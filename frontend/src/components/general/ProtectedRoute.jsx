import React from 'react';
import { SignedIn, SignedOut, RedirectToSignIn } from '@clerk/clerk-react';

/**
 * ProtectedRoute Wrapper:
 * Secures private pages (/upload, /review, /review/:id, /analytics) from unauthorized access.
 */
export default function ProtectedRoute({ children }) {
  return (
    <>
      <SignedIn>{children}</SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  );
}
