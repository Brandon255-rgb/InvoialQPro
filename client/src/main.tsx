import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Set up document title
document.title = "InvoaIQ - Smart Invoicing & Analytics Platform";

// Add meta description for SEO
const metaDescription = document.createElement('meta');
metaDescription.name = 'description';
metaDescription.content = 'InvoaIQ - A modern invoicing and analytics platform for small businesses with invoice generation, client management, and financial insights';
document.head.appendChild(metaDescription);

// Create the root and render the app
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
