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

  // Lo stato si mostra solo quando c'è qualcosa da segnalare: a chat connessa
  // il badge sarebbe rumore.
  const statusLabel =
    connectionState === 'connecting'
      ? 'Connessione…'
      : connectionState === 'error'
        ? 'Offline'
        : null;

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-white/10 bg-header-bg/90 shadow-[0_12px_36px_rgba(15,23,42,0.18)] lg:flex-row">
      {/* Intestazione: striscia in alto su mobile, colonna a sinistra su desktop. */}
      <div className="flex shrink-0 items-center gap-2 border-b border-white/10 bg-white/[0.03] px-3 py-2 lg:w-44 lg:flex-col lg:items-start lg:justify-center lg:border-b-0 lg:border-r lg:px-4">
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-primary/15 text-primary">
          <MessageSquare className="h-3.5 w-3.5" />
        </span>
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/75">Chat</p>
          <p className="text-[9px] text-white/35">Messaggi rapidi durante il match</p>
        </div>
        {statusLabel && (
          <span
            className={cn(
              'ml-auto shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase lg:ml-0',
              connectionState === 'error'
                ? 'bg-red-500/20 text-red-300'
                : 'bg-white/10 text-white/50',
            )}
          >
            {statusLabel}
          </span>
        )}
      </div>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        {error && connectionState !== 'connected' && (
          <p className="border-b border-red-500/20 bg-red-500/10 px-3 py-1.5 text-xs text-red-200">
            {error}
          </p>
        )}

        <ul ref={listRef} className="scrollbar-none flex-1 space-y-2 overflow-y-auto p-3">
          {visibleMessages.length === 0 ? (
            <li className="grid h-full min-h-12 place-items-center px-5 py-3 text-center">
              <span className="text-sm leading-relaxed text-white/35">
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
                <li key={m.id} className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
                  <p className="text-[11px] font-bold text-white/70">{displayName(m.userId)}</p>
                  <p className="mt-0.5 text-sm leading-snug text-white/90">{m.text}</p>
                </li>
              );
            })
          )}
        </ul>
      </div>

      {/* Azioni: sticker e invio, colonna a destra su desktop. */}
      <div className="flex shrink-0 flex-col gap-1.5 border-t border-white/10 p-2 lg:w-72 lg:justify-center lg:border-l lg:border-t-0">
        <div className="flex gap-1">
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
        </div>
        <form onSubmit={submit} className="flex gap-2">
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
            className="min-w-0 flex-1 rounded-xl border border-white/15 bg-white/5 px-3 py-2 font-sans text-sm text-white placeholder:text-white/35 focus:border-white/30 focus:outline-none disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!draft.trim() || connectionState !== 'connected'}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/15 bg-white/10 text-white/80 transition hover:bg-white/15 disabled:opacity-40"
            aria-label="Invia messaggio"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
