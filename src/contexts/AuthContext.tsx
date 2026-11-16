import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from '../firebase';

const BOOTSTRAPPED_ADMIN_EMAIL = 'jonasweb2rj@gmail.com';
const ADMIN_CREDENTIAL_EMAIL = 'admin@x.com';
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
  const [firebaseSessionAdmin, setFirebaseSessionAdmin] = useState(false);
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
        const contentType = res.headers.get('content-type') || '';
        if (res.ok && contentType.includes('application/json')) {
          const data = (await res.json()) as { email: string };
          if (mounted) {
            setAdminToken(existingToken);
            setAdminEmail(data.email);
          }
        } else if (res.status === 401) {
          window.localStorage.removeItem(TOKEN_STORAGE_KEY);
          window.localStorage.removeItem(EMAIL_STORAGE_KEY);
          if (mounted) {
            setAdminToken(null);
            setAdminEmail(null);
          }
        }
      } catch {
        // Keep local check graceful when offline
      }
    }

    verifyStoredToken();

    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      if (!mounted) return;
      setUser(currentUser);

      if (!currentUser) {
        setFirebaseAdminReady(false);
        setFirebaseSessionAdmin(false);
        setLoading(false);
        return;
      }

      const emailLower = (currentUser.email || '').toLowerCase();
      if (emailLower === ADMIN_CREDENTIAL_EMAIL || emailLower === BOOTSTRAPPED_ADMIN_EMAIL) {
        setFirebaseSessionAdmin(true);
      }

      if (!currentUser.emailVerified) {
        setFirebaseAdminReady(false);
        setLoading(false);
        return;
      }

      if (emailLower === BOOTSTRAPPED_ADMIN_EMAIL) {
        setFirebaseAdminReady(true);
        setFirebaseSessionAdmin(true);
        setLoading(false);
        return;
      }

      try {
        const adminSnap = await getDoc(doc(db, 'admins', currentUser.uid));
        const exists = adminSnap.exists();
        setFirebaseAdminReady(exists);
        if (exists || emailLower === ADMIN_CREDENTIAL_EMAIL) {
          setFirebaseSessionAdmin(true);
        }
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
    const cleanEmail = email.trim().toLowerCase();

    let serverOk = false;
    let serverAuthRejected = false;
    let serverErrorMsg = '';

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, password }),
      });
      const rawText = await res.text();
      let data: { ok?: boolean; token?: string; email?: string; error?: string } = {};
      try {
        data = rawText ? (JSON.parse(rawText) as typeof data) : {};
      } catch {
        data = {};
      }

      if (res.ok && data.token) {
        window.localStorage.setItem(TOKEN_STORAGE_KEY, data.token);
        window.localStorage.setItem(EMAIL_STORAGE_KEY, data.email || cleanEmail);
        setAdminToken(data.token);
        setAdminEmail(data.email || cleanEmail);
        serverOk = true;
      } else if (res.status === 401) {
        serverAuthRejected = true;
        serverErrorMsg = data.error || 'Credenciais inválidas. Verifique o e-mail e a senha.';
      }
    } catch {
      // Server login unreachable — continue with Firebase Email/Password authentication
    }

    let firebaseOk = false;
    let firebaseInvalid = false;

    try {
      const cred = await signInWithEmailAndPassword(auth, cleanEmail, password);
      const signedEmail = (cred.user.email || cleanEmail).toLowerCase();
      if (signedEmail === ADMIN_CREDENTIAL_EMAIL || signedEmail === BOOTSTRAPPED_ADMIN_EMAIL) {
        firebaseOk = true;
      } else {
        try {
          const adminSnap = await getDoc(doc(db, 'admins', cred.user.uid));
          if (adminSnap.exists()) firebaseOk = true;
        } catch {
          // Ignore doc read error if serverOk already handled auth
        }
      }
      if (firebaseOk) {
        setFirebaseSessionAdmin(true);
        setAdminEmail(cred.user.email || cleanEmail);
        window.localStorage.setItem(EMAIL_STORAGE_KEY, cred.user.email || cleanEmail);
      }
    } catch (fbErr) {
      const code = (fbErr as { code?: string })?.code || '';
      if (
        code === 'auth/invalid-credential' ||
        code === 'auth/wrong-password' ||
        code === 'auth/user-not-found' ||
        code === 'auth/invalid-email'
      ) {
        firebaseInvalid = true;
      }
    }

    if (serverOk || firebaseOk) {
      setAuthError(null);
      return true;
    }

    if (serverAuthRejected || firebaseInvalid) {
      setAuthError(
        serverErrorMsg || 'E-mail ou senha inválidos. Verifique suas credenciais e tente novamente.'
      );
      return false;
    }

    setAuthError(
      'Não foi possível autenticar no momento. Verifique a conexão ou entre com sua conta Google.'
    );
    return false;
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
    setFirebaseSessionAdmin(false);
    if (auth.currentUser) {
      await signOut(auth);
    }
  };

  const isAdmin = Boolean(adminToken) || firebaseAdminReady || firebaseSessionAdmin;
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
