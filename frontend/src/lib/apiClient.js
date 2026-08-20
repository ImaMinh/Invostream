/**
 * Executes an authenticated HTTP fetch request to the FastAPI backend with an injected Clerk JWT Bearer token.
 * Automatically throws an error with backend detail on HTTP error statuses (non-2xx).
 *
 * @param {string} url - The target backend API endpoint URL (e.g., 'http://localhost:8000/invoices/batch').
 * @param {RequestInit} [options={}] - Standard fetch request configuration (HTTP method, body, headers, etc.).
 * @param {Function} [getToken] - Async token getter function provided by Clerk's `useAuth()` hook.
 * @returns {Promise<Response>} Resolves with the native fetch HTTP Response object.
 */
export async function fetchWithAuth(url, options = {}, getToken) {
  // Normalize headers to support both plain objects and Headers instances
  const headers = new Headers(options.headers || {});

  // token fetching and header injection 
  if (getToken) {
    try {
      const token = await getToken();
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
    } catch (error) {
      console.warn('[Clerk Auth] Failed to fetch auth token:', error);
    }
  }

  // calls native fetch() with updated headers and error checking
  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      let errorData = null;
      try {
        errorData = await response.json();
        if (errorData && (errorData.detail || errorData.message)) {
          errorMessage = errorData.detail || errorData.message;
        }
      } catch {
        try {
          const text = await response.text();
          if (text) errorMessage = text;
        } catch {
          // ignore parsing error
        }
      }

      const error = new Error(errorMessage);
      error.status = response.status;
      error.detail = (typeof errorData === 'object' && errorData && errorData.detail) ? errorData.detail : errorMessage;
      error.response = response;
      throw error;
    }

    return response;
  } catch (error) {
    console.error('[Fetch With Authentication] Request failed:', error);
    throw error;
  }
}
