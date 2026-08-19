"""
clerk authentication & security module for invostream.

implements openid connect (oidc) / oauth 2.0 asymmetric (rs256) jwt authentication.
- retrieves and caches clerk jwks public signing keys (.well-known/jwks.json)
- verifies incoming bearer tokens on protected fastapi endpoints
- enforces user identity payload extraction for multi-tenant data isolation
"""

import os
from typing import Optional
import jwt
from jwt import PyJWKClient
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

# Automatically parses incoming HTTP request headers. Looks for Authorization: Bearer <token>
security = HTTPBearer(auto_error=False)

CLERK_SECRET_KEY = os.getenv("CLERK_SECRET_KEY", "")
CLERK_DOMAIN = os.getenv("CLERK_DOMAIN", "")
CLERK_JWKS_URL = os.getenv("CLERK_JWKS_URL", "")

_jwk_client: Optional[PyJWKClient] = None

def get_jwk_client() -> Optional[PyJWKClient]:
    """
    - Lazily initializes and caches a singleton PyJWKClient instance for Clerk.
    - Resolves the JSON Web Key Set (JWKS) URL from Clerk environment configurations.
    - Provides cached public signing keys for verifying incoming JWT signature authenticity.
    """
    global _jwk_client

    # lazily construct PyJWKClient if uninitialized
    if _jwk_client is None:
        url = None
        # resolve jwks url from direct environment variable or clerk domain
        if CLERK_JWKS_URL:
            url = CLERK_JWKS_URL
        elif CLERK_DOMAIN:
            domain = CLERK_DOMAIN.replace("https://", "").replace("http://", "").strip("/")
            url = f"https://{domain}/.well-known/jwks.json"
            
        # instantiate singleton client with resolved jwks endpoint
        if url:
            _jwk_client = PyJWKClient(url)
            
    # return cached jwk client instance
    return _jwk_client

async def verify_clerk_token(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)) -> dict:
    """
    - Fastapi security dependency that intercepts, validates, and decodes incoming clerk bearer jwt tokens.
    - Verifies JWT bearer token against Clerk's JWKS public keys and extracts claims payload.
    - Payload is a variable containing sub, iss, email, and exp, etc. 
    - Enables downstream endpoint authentication and multi-tenant user data isolation.
    """

    # reject authorization request if bearer token header is missing
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token required",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # extract raw jwt string and initialize jwk client
    token = credentials.credentials
    jwk_client = get_jwk_client()

    # handle development mode fallback when clerk domain or jwks url is unconfigured
    if not jwk_client:
        # decode token payload without verifying signature for local dev setup
        try:
            unverified_payload = jwt.decode(token, options={"verify_signature": False})
            return unverified_payload
        except Exception as err:
            print(f"[Clerk Dev Auth Warning] Unverified decoding failed: {err}")
            # return mock developer payload if unverified decoding fails
            return {"sub": None, "email": None}

    # verify token signature using clerk jwks public key
    try:
        # retrieve signing key from jwks and verify rsa signature
        signing_key = jwk_client.get_signing_key_from_jwt(token)
        payload = jwt.decode(
            token,
            signing_key.key,
            algorithms=["RS256"],
            options={"verify_aud": False}
        )
        # return verified token payload claims
        return payload
    except jwt.ExpiredSignatureError:
        # handle expired jwt token signatures
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except Exception as e:
        # handle general verification failures or malformed tokens
        print(f"[Clerk Auth Error] Token verification failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid authentication token: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )
