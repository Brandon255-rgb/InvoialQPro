import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import App from './App.tsx';
import './index.css';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Set document title and meta description
document.title = "invoiaiqpro - Smart Invoicing & Analytics Platform";
const metaDescription = document.querySelector('meta[name="description"]') as HTMLMetaElement;
if (metaDescription) {
  metaDescription.content = 'invoiaiqpro - A modern invoicing and analytics platform for small businesses with invoice generation, client management, and financial insights';
}

// Create the root and render the app
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <Toaster position="top-right" />
      <App />
    </QueryClientProvider>
  </React.StrictMode>
);
