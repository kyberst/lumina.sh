
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { toast } from './services/toastService';
import { getLanguage } from './services/i18n';

/**
 * Robust silencer for ResizeObserver loop errors.
 */
const suppressResizeObserverErrors = () => {
    const isResizeObserverError = (msg: any) => {
        const errorMsg = typeof msg === 'string' ? msg : (msg?.message || '');
        return (
            errorMsg.includes('ResizeObserver loop completed with undelivered notifications.') ||
            errorMsg.includes('ResizeObserver loop limit exceeded')
        );
    };

    // 1. Handle standard window errors
    const originalOnError = window.onerror;
    window.onerror = (message, source, lineno, colno, error) => {
        if (isResizeObserverError(message)) {
            return true; 
        }
        
        // Human friendly toast for unexpected errors
        const lang = getLanguage();
        toast.error(lang === 'es' ? "Algo ha salido mal, pero estamos intentando recuperarnos." : "Something went wrong, but we're trying to recover.");

        if (originalOnError) {
            return originalOnError(message, source, lineno, colno, error);
        }
        return false;
    };

    // 2. Handle error events
    window.addEventListener('error', (e) => {
        if (isResizeObserverError(e.message) || isResizeObserverError(e.error)) {
            e.stopImmediatePropagation();
            e.preventDefault();
        }
    }, true);

    // 3. Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (e) => {
        const reason = e.reason?.message || String(e.reason);
        if (isResizeObserverError(reason)) {
            e.stopImmediatePropagation();
            e.preventDefault();
            return;
        }
        
        const lang = getLanguage();
        toast.error(lang === 'es' ? "La conexión con el servidor ha fallado. Reinténtalo en un momento." : "Connection failed. Please try again in a moment.");
    }, true);
};

suppressResizeObserverErrors();

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error("Critical: Could not find root element.");

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
