import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.min.css';
import './styles.css';
import { StoreProvider } from './store.jsx';
import App from './App.jsx';

try {
  const t = localStorage.getItem('odajah_demo_theme');
  if (t) document.documentElement.setAttribute('data-bs-theme', t);
} catch { /* storage disekat */ }

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <StoreProvider>
        <App />
      </StoreProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
