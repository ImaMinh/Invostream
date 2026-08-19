/**
 * Executes an authenticated HTTP fetch request to the FastAPI backend with an injected Clerk JWT Bearer token.
 * @param {string} url - The target backend API endpoint URL (e.g., 'http://localhost:8000/invoices/batch').
 * @param {RequestInit} [options={}] - Standard fetch request configuration (HTTP method, body, headers, etc.).
 * @param {Function} [getToken] - Async token getter function provided by Clerk's `useAuth()` hook.
 * @returns {Promise<Response>} Resolves with the native fetch HTTP Response object.
 */
export async function fetchWithAuth(url, options = {}, getToken) {
  // header preparation 
  // spread operator (...) unpacks the content inside options.headers and copies them into the new headers object. 
  const headers = {
    ...(options.headers || {}),
  };

  // token fetching and header injection 
  if (getToken) {
    try {
      const token = await getToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    } catch (error) {
      console.warn('[Clerk Auth] Failed to fetch auth token:', error);
    }
  }

  // calls native fetch() with updated headers 
  return fetch(url, {
    ...options,
    headers,
  });
}
