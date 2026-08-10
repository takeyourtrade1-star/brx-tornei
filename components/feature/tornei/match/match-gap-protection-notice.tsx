import { ShieldCheck, TriangleAlert } from 'lucide-react';
import type { GapProtectionSnapshot } from '@/lib/gap-recording/types';

export function MatchGapProtectionNotice({
  snapshot,
}: {
  snapshot: GapProtectionSnapshot;
}) {
  if (snapshot.status === 'disabled' || snapshot.status === 'unsupported') return null;
  const active = snapshot.status === 'capturing' || snapshot.status === 'closing';
  const failed = snapshot.status === 'error';
  const Icon = failed ? TriangleAlert : ShieldCheck;
  const message = failed
    ? snapshot.error ?? 'Protezione disconnessioni non disponibile.'
    : active
      ? 'Connessione instabile: il tratto mancante resta protetto su questo PC.'
      : snapshot.pendingIncidents > 0
        ? `${snapshot.pendingIncidents} tratto${snapshot.pendingIncidents > 1 ? 'i' : ''} in attesa di caricamento sicuro.`
        : 'Protezione disconnessioni attiva. La partita completa non viene salvata.';

  return (
    <p
      className={`mb-3 flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold ${
        failed
          ? 'border-red-400/25 bg-red-500/10 text-red-100'
          : active
            ? 'border-primary/30 bg-primary/10 text-orange-100'
            : 'border-emerald-400/20 bg-emerald-500/[0.08] text-emerald-100/80'
      }`}
    >
      <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
      {message}
    </p>
  );
}
