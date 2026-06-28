/**
 * Cliente HTTP para hablar con el backend FastAPI.
 *
 * Incluye un interceptor que automáticamente:
 * - Agrega el token JWT de Firebase a cada request.
 * - Maneja errores 401 (token expirado) re-pidiendo el token.
 */
import axios, { type AxiosInstance } from 'axios';
import { auth } from './firebase';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const ORCHESTRATOR_URL = import.meta.env.VITE_ORCHESTRATOR_URL || 'http://localhost:8001';

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30s
});

// Cliente directo al Orquestador IA (sin JWT de Firebase — el orquestador no usa Firebase Auth)
export const orquestadorClient: AxiosInstance = axios.create({
  baseURL: ORCHESTRATOR_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60000, // 60s — las campañas pueden tardar
});

// Interceptor de request: agrega el token JWT de Firebase si hay usuario logueado
apiClient.interceptors.request.use(
  async (config) => {
    const user = auth.currentUser;
    if (user) {
      const token = await user.getIdToken();
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor de response: log de errores
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn('[API] Token expirado o inválido');
    }
    return Promise.reject(error);
  }
);

export default apiClient;
