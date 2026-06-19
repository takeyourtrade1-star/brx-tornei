import type { ReactNode } from 'react';

/** Layout auth minimale: ogni pagina sceglie il proprio shell (split o card). */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return children;
}
