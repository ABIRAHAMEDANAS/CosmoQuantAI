
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { ThemeProvider } from '@/context/ThemeContext';
import { ToastProvider } from '@/context/ToastContext';
import { SettingsProvider } from '@/context/SettingsContext';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ThemeProvider>
      <ToastProvider>
        <SettingsProvider>
          <App />
        </SettingsProvider>
      </ToastProvider>
    </ThemeProvider>
  </React.StrictMode>
);

