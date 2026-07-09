'use client';

import { useId, useState } from 'react';
import { MessageSquare, Send } from 'lucide-react';
import { useMatchChat } from '@/hooks/use-match-chat';
import { cn } from '@/lib/utils';

interface MatchCommentsPanelProps {
  me: string;
  userId: string;
  matchId?: string | null;
  accessToken?: string | null;
  active: boolean;
  participantNames: Record<string, string>;
}

export function MatchCommentsPanel({
  me,
  userId,
  matchId,
  accessToken,
  active,
  participantNames,
}: MatchCommentsPanelProps) {
  const formId = useId();
  const [draft, setDraft] = useState('');
  const { messages, send, connectionState, error } = useMatchChat({
    matchId,
    accessToken,
    userId,
    active,
  });

  function displayName(forUserId: string): string {
    if (forUserId === userId) return me;
    return participantNames[forUserId] ?? 'Avversario';
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    if (send(text)) setDraft('');
  }

  const statusLabel =
    connectionState === 'connected'
      ? 'Connessa'
      : connectionState === 'connecting'
        ? 'Connessione…'
        : connectionState === 'error'
          ? 'Offline'
          : null;

  return (
    <div className="flex h-full min-h-[200px] flex-col rounded-2xl border border-white/10 bg-black/20">
      <div className="flex items-center gap-2 border-b border-white/10 px-3 py-2.5">
        <MessageSquare className="h-4 w-4 text-white/50" />
        <p className="text-xs font-bold uppercase tracking-wider text-white/55">Chat partita</p>
        {statusLabel && (
          <span
            className={cn(
              'ml-auto rounded-full px-2 py-0.5 text-[10px] font-bold uppercase',
              connectionState === 'connected'
                ? 'bg-emerald-500/20 text-emerald-300'
                : connectionState === 'connecting'
                  ? 'bg-white/10 text-white/50'
                  : 'bg-red-500/20 text-red-300',
            )}
          >
            {statusLabel}
          </span>
        )}
      </div>

      {error && connectionState !== 'connected' && (
        <p className="border-b border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-200">
          {error}
        </p>
      )}

      <ul className="scrollbar-none flex-1 space-y-2 overflow-y-auto p-3">
        {messages.length === 0 ? (
          <li className="py-6 text-center text-sm text-white/40">
            Nessun messaggio. Scrivi qualcosa durante la partita.
          </li>
        ) : (
          messages.map((m) => (
            <li key={m.id} className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
              <p className="text-[11px] font-bold text-white/70">{displayName(m.userId)}</p>
              <p className="mt-0.5 text-sm leading-snug text-white/90">{m.text}</p>
            </li>
          ))
        )}
      </ul>

      <form onSubmit={submit} className="border-t border-white/10 p-2">
        <div className="flex gap-2">
          <label htmlFor={formId} className="sr-only">
            Scrivi un messaggio
          </label>
          <input
            id={formId}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Scrivi un messaggio…"
            maxLength={500}
            disabled={connectionState !== 'connected'}
            className="min-w-0 flex-1 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/35 focus:border-white/30 focus:outline-none disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!draft.trim() || connectionState !== 'connected'}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/15 bg-white/10 text-white/80 transition hover:bg-white/15 disabled:opacity-40"
            aria-label="Invia messaggio"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
