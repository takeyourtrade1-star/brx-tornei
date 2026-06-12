'use client';

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import { AuthModal } from '@/components/feature/auth/auth-modal';

type AuthSuccessHandler = () => void;

interface AuthModalContextValue {
  openAuthModal: (onSuccess?: AuthSuccessHandler) => void;
}

const AuthModalContext = createContext<AuthModalContextValue | null>(null);

export function AuthModalProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const onSuccessRef = useRef<AuthSuccessHandler | null>(null);

  const openAuthModal = useCallback((onSuccess?: AuthSuccessHandler) => {
    onSuccessRef.current = onSuccess ?? null;
    setOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    setOpen(false);
    onSuccessRef.current = null;
  }, []);

  const handleLoginSuccess = useCallback(() => {
    setOpen(false);
    router.refresh();
    onSuccessRef.current?.();
    onSuccessRef.current = null;
  }, [router]);

  return (
    <AuthModalContext.Provider value={{ openAuthModal }}>
      {children}
      <AuthModal open={open} onClose={handleClose} onLoginSuccess={handleLoginSuccess} />
    </AuthModalContext.Provider>
  );
}

export function useAuthModal(): AuthModalContextValue {
  const ctx = useContext(AuthModalContext);
  if (!ctx) {
    throw new Error('useAuthModal va usato dentro AuthModalProvider');
  }
  return ctx;
}
