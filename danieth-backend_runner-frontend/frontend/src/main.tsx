/**
 * Entry point del frontend.
 * Monta el componente raíz e inicializa los servicios globales.
 */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

// Inicializar servicios globales antes de montar la app
import '@/lib/firebase'; // Inicializa Firebase SDK
import '@/lib/i18n';     // Inicializa i18n

// Estilos globales
import '@/styles/globals.css';

import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('No se encontró el elemento root en index.html');
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>
);
