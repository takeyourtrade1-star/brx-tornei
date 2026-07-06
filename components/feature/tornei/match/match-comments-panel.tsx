'use client';

import { useId, useState } from 'react';
import { MessageSquare, Send } from 'lucide-react';

interface Comment {
  id: string;
  author: string;
  text: string;
  at: number;
}

interface MatchCommentsPanelProps {
  me: string;
}

/**
 * Commenti locali della partita (solo client, nessun backend ancora).
 */
export function MatchCommentsPanel({ me }: MatchCommentsPanelProps) {
  const formId = useId();
  const [comments, setComments] = useState<Comment[]>([]);
  const [draft, setDraft] = useState('');

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    setComments((prev) => [
      ...prev,
      { id: crypto.randomUUID(), author: me, text, at: Date.now() },
    ]);
    setDraft('');
  }

  return (
    <div className="flex h-full min-h-[200px] flex-col rounded-2xl border border-white/10 bg-black/20">
      <div className="flex items-center gap-2 border-b border-white/10 px-3 py-2.5">
        <MessageSquare className="h-4 w-4 text-white/50" />
        <p className="text-xs font-bold uppercase tracking-wider text-white/55">Commenti</p>
      </div>

      <ul className="scrollbar-none flex-1 space-y-2 overflow-y-auto p-3">
        {comments.length === 0 ? (
          <li className="py-6 text-center text-sm text-white/40">
            Nessun commento. Scrivi qualcosa durante la partita.
          </li>
        ) : (
          comments.map((c) => (
            <li key={c.id} className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
              <p className="text-[11px] font-bold text-white/70">{c.author}</p>
              <p className="mt-0.5 text-sm leading-snug text-white/90">{c.text}</p>
            </li>
          ))
        )}
      </ul>

      <form onSubmit={submit} className="border-t border-white/10 p-2">
        <div className="flex gap-2">
          <label htmlFor={formId} className="sr-only">
            Scrivi un commento
          </label>
          <input
            id={formId}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Scrivi un commento…"
            maxLength={500}
            className="min-w-0 flex-1 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/35 focus:border-white/30 focus:outline-none"
          />
          <button
            type="submit"
            disabled={!draft.trim()}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/15 bg-white/10 text-white/80 transition hover:bg-white/15 disabled:opacity-40"
            aria-label="Invia commento"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
