import React from 'react'
import ReactDOM from 'react-dom/client'
import { ClerkProvider } from '@clerk/clerk-react'
import App from './App.jsx'
import './index.css'

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || 'pk_test_sample_clerk_key'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ClerkProvider 
      publishableKey={PUBLISHABLE_KEY} 
      afterSignOutUrl="/"
      fallbackRedirectUrl="/review"
      signInFallbackRedirectUrl="/review"
      signUpFallbackRedirectUrl="/review"
    >
      <App />
    </ClerkProvider>
  </React.StrictMode>,
)
