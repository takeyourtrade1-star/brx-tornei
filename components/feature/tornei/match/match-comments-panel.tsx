'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { MessageSquare, Send } from 'lucide-react';
import type {
  MatchChatConnectionState,
  MatchChatMessage,
} from '@/hooks/use-match-chat';
import { isMatchLifeMessage } from '@/lib/match-life-protocol';
import { isMatchStartMessage } from '@/lib/match-start-protocol';
import {
  MATCH_STICKERS,
  STICKER_COOLDOWN_MS,
  stickerFromText,
  stickerToText,
  type MatchSticker,
} from './match-stickers';
import { cn } from '@/lib/utils';

export interface MatchCommentsPanelProps {
  me: string;
  userId: string;
  messages: MatchChatMessage[];
  send: (text: string) => boolean;
  connectionState: MatchChatConnectionState;
  error: string | null;
  participantNames: Record<string, string>;
  compact?: boolean;
  /** Notifica di uno sticker appena arrivato (mio o dell'avversario). */
  onSticker?: (sticker: MatchSticker, fromUserId: string) => void;
}

export function MatchCommentsPanel({
  me,
  userId,
  messages,
  send,
  connectionState,
  error,
  participantNames,
  onSticker,
  compact = false,
}: MatchCommentsPanelProps) {
  const formId = useId();
  const [draft, setDraft] = useState('');
  const visibleMessages = useMemo(
    () =>
      messages.filter(
        (message) =>
          !isMatchLifeMessage(message.text) && !isMatchStartMessage(message.text),
      ),
    [messages],
  );

  // Cooldown sticker: un taunt ogni STICKER_COOLDOWN_MS, col pulsante che
  // si "ricarica" (stile abilità nei videogiochi).
  const [stickerCooldown, setStickerCooldown] = useState(false);
  const cooldownTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (cooldownTimer.current) clearTimeout(cooldownTimer.current);
    },
    [],
  );

  function sendSticker(id: string) {
    if (stickerCooldown) return;
    if (!send(stickerToText(id))) return;
    setStickerCooldown(true);
    cooldownTimer.current = setTimeout(() => setStickerCooldown(false), STICKER_COOLDOWN_MS);
  }

  // Auto-scroll in fondo a ogni messaggio nuovo.
  const listRef = useRef<HTMLUListElement | null>(null);
  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [visibleMessages.length]);

  // Notifica al padre gli sticker NUOVI (per l'overlay sul video), una volta
  // sola per messaggio: il cursore ricorda quanti ne abbiamo già processati.
  const processedCount = useRef(0);
  useEffect(() => {
    for (let i = processedCount.current; i < messages.length; i++) {
      const message = messages[i];
      if (!message) continue;
      const sticker = stickerFromText(message.text);
      if (sticker) onSticker?.(sticker, message.userId);
    }
    processedCount.current = messages.length;
  }, [messages, onSticker]);

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
    <div className={cn('flex flex-col overflow-hidden rounded-2xl border border-white/10 shadow-[0_12px_36px_rgba(15,23,42,0.18)]', compact ? 'h-full min-h-0 bg-black/45' : 'h-full min-h-[150px] bg-header-bg/90')}>
      <div className="flex items-center gap-2 border-b border-white/10 bg-white/[0.03] px-3 py-2">
        <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary/15 text-primary">
          <MessageSquare className="h-3.5 w-3.5" />
        </span>
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/75">Chat</p>
          <p className="text-[9px] text-white/35">Messaggi rapidi durante il match</p>
        </div>
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

      <ul ref={listRef} className={cn('scrollbar-none flex-1 space-y-2 overflow-y-auto p-3', compact && 'space-y-1.5 p-2')}>
        {visibleMessages.length === 0 ? (
          <li className={cn('grid h-full place-items-center px-5 text-center', compact ? 'min-h-0 py-2' : 'min-h-12 py-3')}>
            <span className={cn('leading-relaxed text-white/35', compact ? 'text-xs' : 'text-sm')}>
              La chat è pronta. Scrivi all&apos;avversario durante la partita.
            </span>
          </li>
        ) : (
          visibleMessages.map((m) => {
            const sticker = stickerFromText(m.text);
            if (sticker) {
              return (
                <li
                  key={m.id}
                  className="rounded-xl border border-[#FF7300]/30 bg-[#FF7300]/[0.08] px-3 py-2"
                >
                  <p className="text-[11px] font-bold text-white/70">{displayName(m.userId)}</p>
                  <p className="mt-0.5 flex items-center gap-2">
                    <span className="sticker-chat-emoji text-3xl leading-none" aria-hidden>
                      {sticker.emoji}
                    </span>
                    <span className="text-xs font-black uppercase tracking-wider text-[#FF9C4A]">
                      {sticker.label}
                    </span>
                  </p>
                </li>
              );
            }
            return (
              <li key={m.id} className={cn('rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2', compact && 'px-2 py-1.5')}>
                <p className="text-[11px] font-bold text-white/70">{displayName(m.userId)}</p>
                <p className={cn('mt-0.5 leading-snug text-white/90', compact ? 'text-xs' : 'text-sm')}>{m.text}</p>
              </li>
            );
          })
        )}
      </ul>

      {!compact && <div className="flex gap-1 border-t border-white/10 px-3 py-1.5">
        {MATCH_STICKERS.map((s) => (
          <button
            key={s.id}
            type="button"
            title={s.title}
            aria-label={`Invia sticker ${s.label}`}
            disabled={stickerCooldown || connectionState !== 'connected'}
            onClick={() => sendSticker(s.id)}
            className={cn(
              'group relative grid h-7 w-7 place-items-center rounded-lg border border-white/10 bg-white/5 text-base transition',
              stickerCooldown || connectionState !== 'connected'
                ? 'opacity-40'
                : 'hover:-translate-y-0.5 hover:border-[#FF7300]/50 hover:bg-[#FF7300]/15 active:scale-95',
            )}
          >
            <span className="transition group-hover:scale-125">{s.emoji}</span>
          </button>
        ))}
      </div>}

      <form onSubmit={submit} className={compact ? 'p-1.5' : 'p-2'}>
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
            className={cn('min-w-0 flex-1 rounded-xl border border-white/15 bg-white/5 px-3 py-2 font-sans text-white placeholder:text-white/35 focus:border-white/30 focus:outline-none disabled:opacity-50', compact ? 'text-xs' : 'text-sm')}
          />
          <button
            type="submit"
            disabled={!draft.trim() || connectionState !== 'connected'}
            className={cn('grid shrink-0 place-items-center rounded-xl border border-white/15 bg-white/10 text-white/80 transition hover:bg-white/15 disabled:opacity-40', compact ? 'h-9 w-9' : 'h-10 w-10')}
            aria-label="Invia messaggio"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
