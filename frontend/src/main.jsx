import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { BusinessProvider } from './context/BusinessContext.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <BusinessProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BusinessProvider>
    </BrowserRouter>
  </React.StrictMode>
);
