/**
 * AuthContext.tsx — Autenticación con soporte Multi-Tenant.
 *
 * Cambios respecto a la versión anterior:
 * - UserProfile incluye company_id (null para usuarios sin empresa).
 * - signUp ya NO acepta el parámetro 'role' — el backend siempre asigna 'viewer'.
 * - refreshProfile() permite forzar re-fetch del perfil (útil tras cambio de rol).
 */
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  type User,
} from 'firebase/auth';

import { auth } from '../lib/firebase';
import { apiClient } from '../lib/api';

// ── Tipos ─────────────────────────────────────────────────────────────────────

export interface UserProfile {
  uid: string;
  email: string | null;
  name: string | null;
  role: string;
  company_id: string | null;  // null para super_admin y viewers sin empresa
}

interface AuthContextValue {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// ── Provider ──────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (firebaseUser: User): Promise<void> => {
    try {
      const { data } = await apiClient.get<UserProfile>('/api/v1/auth/me/profile');
      setProfile(data);
    } catch {
      // Fallback mínimo — el router redirigirá al portal correcto cuando el perfil cargue
      setProfile({
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        name: firebaseUser.displayName,
        role: 'viewer',
        company_id: null,
      });
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        await fetchProfile(firebaseUser);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const signIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
    // onAuthStateChanged dispara fetchProfile automáticamente tras el login
  };

  // El backend siempre asigna 'viewer' — no se acepta rol como parámetro
  const signUp = async (email: string, password: string, name: string) => {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(credential.user, { displayName: name });
    await apiClient.post('/api/v1/auth/register', { name });
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  // Fuerza re-fetch del perfil desde el backend (útil tras cambio de rol)
  const refreshProfile = async () => {
    if (user) await fetchProfile(user);
  };

  return (
    <AuthContext.Provider
      value={{ user, profile, loading, signIn, signUp, signOut, resetPassword, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
}
