import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from '../firebase';

const BOOTSTRAPPED_ADMIN_EMAIL = 'jonasweb2rj@gmail.com';
const TOKEN_STORAGE_KEY = 'mg_admin_session_token';
const EMAIL_STORAGE_KEY = 'mg_admin_session_email';

interface AuthContextValue {
  user: User | null;
  adminEmail: string | null;
  adminToken: string | null;
  firebaseAdminReady: boolean;
  loading: boolean;
  isAdmin: boolean;
  authError: string | null;
  signInWithCredentials: (email: string, password: string) => Promise<boolean>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function getStoredAdminToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function getStoredAdminEmail(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(EMAIL_STORAGE_KEY);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseAdminReady, setFirebaseAdminReady] = useState(false);
  const [adminToken, setAdminToken] = useState<string | null>(() => getStoredAdminToken());
  const [adminEmail, setAdminEmail] = useState<string | null>(() => getStoredAdminEmail());
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function verifyStoredToken() {
      const existingToken = getStoredAdminToken();
      if (!existingToken) return;
      try {
        const res = await fetch('/api/admin/verify', {
          headers: { Authorization: `Bearer ${existingToken}` },
        });
        if (res.ok) {
          const data = (await res.json()) as { email: string };
          if (mounted) {
            setAdminToken(existingToken);
            setAdminEmail(data.email);
          }
        } else {
          window.localStorage.removeItem(TOKEN_STORAGE_KEY);
          window.localStorage.removeItem(EMAIL_STORAGE_KEY);
          if (mounted) {
            setAdminToken(null);
            setAdminEmail(null);
          }
        }
      } catch {
        // Keep offline check graceful
      }
    }

    verifyStoredToken();

    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      if (!mounted) return;
      setUser(currentUser);

      if (!currentUser || !currentUser.emailVerified) {
        setFirebaseAdminReady(false);
        setLoading(false);
        return;
      }

      if (currentUser.email === BOOTSTRAPPED_ADMIN_EMAIL) {
        setFirebaseAdminReady(true);
        setLoading(false);
        return;
      }

      try {
        const adminSnap = await getDoc(doc(db, 'admins', currentUser.uid));
        setFirebaseAdminReady(adminSnap.exists());
      } catch {
        setFirebaseAdminReady(false);
      } finally {
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      unsub();
    };
  }, []);

  const signInWithCredentials = async (email: string, password: string): Promise<boolean> => {
    setAuthError(null);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = (await res.json()) as { ok?: boolean; token?: string; email?: string; error?: string };
      if (!res.ok || !data.token) {
        setAuthError(data.error || 'E-mail ou senha inválidos.');
        return false;
      }
      window.localStorage.setItem(TOKEN_STORAGE_KEY, data.token);
      window.localStorage.setItem(EMAIL_STORAGE_KEY, data.email || email);
      setAdminToken(data.token);
      setAdminEmail(data.email || email);
      return true;
    } catch {
      setAuthError('Falha ao conectar com o servidor de autenticação.');
      return false;
    }
  };

  const signInWithGoogle = async () => {
    setAuthError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao autenticar com Google.';
      setAuthError(msg);
    }
  };

  const logout = async () => {
    window.localStorage.removeItem(TOKEN_STORAGE_KEY);
    window.localStorage.removeItem(EMAIL_STORAGE_KEY);
    setAdminToken(null);
    setAdminEmail(null);
    if (auth.currentUser) {
      await signOut(auth);
    }
  };

  const isAdmin = Boolean(adminToken) || firebaseAdminReady;
  const effectiveEmail = adminEmail || user?.email || null;

  return (
    <AuthContext.Provider
      value={{
        user,
        adminEmail: effectiveEmail,
        adminToken,
        firebaseAdminReady,
        loading,
        isAdmin,
        authError,
        signInWithCredentials,
        signInWithGoogle,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return ctx;
}
