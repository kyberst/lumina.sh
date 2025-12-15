
import React from 'react';
import ReactDOM from 'react-dom/client';
// FIX: Corrected import path to point to the App component inside the App directory.
import App from './App/index';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);