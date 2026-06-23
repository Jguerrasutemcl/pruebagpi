/**
 * Inicialización de Firebase en el frontend.
 *
 * Lee la configuración desde las variables de entorno (VITE_FIREBASE_*)
 * y expone las instancias de Auth y Firestore para el resto de la app.
 */
import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Validar que todas las variables estén configuradas
const missingVars = Object.entries(firebaseConfig)
  .filter(([, value]) => !value)
  .map(([key]) => key);

if (missingVars.length > 0) {
  console.error(
    `[Firebase] Variables de entorno faltantes: ${missingVars.join(', ')}. ` +
      'Verificar el archivo frontend/.env'
  );
}

// Inicializar Firebase
export const firebaseApp: FirebaseApp = initializeApp(firebaseConfig);

// Servicios principales
export const auth: Auth = getAuth(firebaseApp);
export const db: Firestore = getFirestore(firebaseApp);

// Exportar por default también para conveniencia
export default firebaseApp;
