import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import type { ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

type PortalAuthState =
  | 'loading'        // verificando sessão
  | 'unauthenticated' // sem sessão Supabase
  | 'needs-mfa'      // sessão ok, MFA pessoal pendente
  | 'authenticated'; // sessão + MFA verificado

type MfaEnrollPayload = {
  secret: string;
  otpauthUrl: string;
};

type PortalAuthContextValue = {
  state: PortalAuthState;
  session: Session | null;
  professionalName: string | null;
  professionalId: number | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  enrollMfa: () => Promise<MfaEnrollPayload>;
  verifyMfa: (code: string) => Promise<void>;
  authError: string | null;
};

const PortalAuthContext = createContext<PortalAuthContextValue | undefined>(undefined);

const MFA_SESSION_KEY = 'onica-portal-mfa-verified';

export function PortalAuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PortalAuthState>('loading');
  const [session, setSession] = useState<Session | null>(null);
  const [professionalName, setProfessionalName] = useState<string | null>(null);
  const [professionalId, setProfessionalId] = useState<number | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const initialized = useRef(false);

  const loadProfessional = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from('profissionais')
      .select('id, nome')
      .eq('auth_user_id', userId)
      .limit(1)
      .maybeSingle();
    if (data) {
      setProfessionalName(data.nome);
      setProfessionalId(data.id);
    }
    return data;
  }, []);

  const checkMfaVerified = useCallback((sessionId: string): boolean => {
    try {
      const raw = localStorage.getItem(MFA_SESSION_KEY);
      if (!raw) return false;
      const stored = JSON.parse(raw) as { sessionId: string; expiresAt: number };
      return stored.sessionId === sessionId && stored.expiresAt > Date.now();
    } catch {
      return false;
    }
  }, []);

  const markMfaVerified = useCallback((sessionId: string) => {
    localStorage.setItem(
      MFA_SESSION_KEY,
      JSON.stringify({ sessionId, expiresAt: Date.now() + 8 * 60 * 60 * 1000 })
    );
  }, []);

  const bootstrap = useCallback(async (currentSession: Session | null) => {
    if (!currentSession) {
      setState('unauthenticated');
      setSession(null);
      setProfessionalName(null);
      setProfessionalId(null);
      return;
    }

    setSession(currentSession);

    const prof = await loadProfessional(currentSession.user.id);
    if (!prof) {
      // Usuário autenticado mas sem registro de profissional — bloqueia
      setState('unauthenticated');
      setAuthError('Nenhum registro de profissional encontrado para este usuário.');
      await supabase.auth.signOut();
      return;
    }

    const sessionId = (currentSession as unknown as { session_id?: string }).session_id
      ?? currentSession.access_token.slice(-20);

    if (checkMfaVerified(sessionId)) {
      setState('authenticated');
    } else {
      setState('needs-mfa');
    }
  }, [loadProfessional, checkMfaVerified]);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      void bootstrap(s);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      void bootstrap(s);
    });

    return () => subscription.unsubscribe();
  }, [bootstrap]);

  const signIn = useCallback(async (email: string, password: string) => {
    setAuthError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
  }, []);

  const signOut = useCallback(async () => {
    localStorage.removeItem(MFA_SESSION_KEY);
    await supabase.auth.signOut();
    setState('unauthenticated');
    setSession(null);
    setProfessionalName(null);
    setProfessionalId(null);
  }, []);

  const enrollMfa = useCallback(async (): Promise<MfaEnrollPayload> => {
    const { data, error } = await supabase.functions.invoke('professional-mfa-enroll', {
      body: {},
    });
    if (error || !data) throw new Error('Erro ao iniciar configuração do MFA.');
    return data as MfaEnrollPayload;
  }, []);

  const verifyMfa = useCallback(async (code: string) => {
    const { data, error } = await supabase.functions.invoke('professional-mfa-verify', {
      body: { code },
    });
    if (error || !data?.verified) {
      throw new Error('Código inválido. Verifique o Authenticator e tente novamente.');
    }

    const sessionId = (session as unknown as { session_id?: string })?.session_id
      ?? session?.access_token.slice(-20) ?? '';
    markMfaVerified(sessionId);
    setState('authenticated');
  }, [session, markMfaVerified]);

  return (
    <PortalAuthContext.Provider value={{
      state, session, professionalName, professionalId,
      signIn, signOut, enrollMfa, verifyMfa, authError,
    }}>
      {children}
    </PortalAuthContext.Provider>
  );
}

export function usePortalAuth() {
  const ctx = useContext(PortalAuthContext);
  if (!ctx) throw new Error('usePortalAuth must be used inside PortalAuthProvider');
  return ctx;
}
