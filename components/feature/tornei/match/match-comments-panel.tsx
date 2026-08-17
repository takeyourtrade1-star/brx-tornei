'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { RefreshCw, Send, Shield } from 'lucide-react';
import type { MatchChatConnectionState, MatchChatMessage } from '@/hooks/use-match-chat';
import { isMatchLifeMessage } from '@/lib/match-life-protocol';
import { isMatchStartMessage } from '@/lib/match-start-protocol';
import {
  MATCH_STICKERS,
  STICKER_COOLDOWN_MS,
  stickerFromText,
  stickerToText,
  type MatchSticker,
} from './match-stickers';
import { MatchStickerIcon } from './match-sticker-icons';
import { cn } from '@/lib/utils';

export interface MatchCommentsPanelProps {
  me: string;
  userId: string;
  messages: MatchChatMessage[];
  send: (text: string) => boolean;
  connectionState: MatchChatConnectionState;
  error: string | null;
  onRetry?: () => void;
  participantNames: Record<string, string>;
  /** Notifica di uno sticker appena arrivato (mio o dell'avversario). */
  onSticker?: (sticker: MatchSticker, fromUserId: string) => void;
}

export function MatchCommentsPanel({
  me, userId, messages, send, connectionState,
  error, onRetry, participantNames, onSticker,
}: MatchCommentsPanelProps) {
  const formId = useId();
  const [draft, setDraft] = useState('');
  const visibleMessages = useMemo(
    () => messages.filter((m) => !isMatchLifeMessage(m.text) && !isMatchStartMessage(m.text)),
    [messages],
  );

  // Cooldown sticker: un taunt ogni STICKER_COOLDOWN_MS con indicatore visivo
  const [stickerCooldown, setStickerCooldown] = useState(false);
  const cooldownTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (cooldownTimer.current) clearTimeout(cooldownTimer.current); }, []);

  function sendSticker(id: string) {
    if (stickerCooldown || !send(stickerToText(id))) return;
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
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-header-bg/90 shadow-xl shadow-black/40 lg:flex-row">
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        {/* Avviso stile gaming: condotta, privacy e moderazione staff */}
        <div className="flex items-center gap-2 border-b border-white/10 bg-white/[0.03] px-3.5 py-2 text-[11px] text-white/60 backdrop-blur-sm">
          <Shield className="h-3.5 w-3.5 shrink-0 text-amber-400" aria-hidden />
          <p className="min-w-0 flex-1 truncate text-[11px] text-white/65">
            <strong className="font-bold text-amber-300">Fair Play:</strong> usa un linguaggio corretto e non diffondere informazioni private. In caso di segnalazione, le chat potrebbero essere revisionate dallo staff.
          </p>
          {statusLabel && (
            <span
              className={cn(
                'inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2 py-0.5 text-[9px] font-black uppercase tracking-wider',
                connectionState === 'error'
                  ? 'border-red-400/30 bg-red-500/10 text-red-300'
                  : 'border-white/10 bg-white/5 text-white/50',
              )}
            >
              <span
                aria-hidden
                className={cn(
                  'h-1 w-1 rounded-full',
                  connectionState === 'error' ? 'bg-red-400' : 'animate-pulse bg-amber-300',
                )}
              />
              {statusLabel}
            </span>
          )}
        </div>

        {error && connectionState !== 'connected' && (
          <div className="flex items-center justify-between gap-2 border-b border-red-500/30 bg-red-500/15 px-3.5 py-2 text-xs text-red-200">
            <span>{error}</span>
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="inline-flex shrink-0 items-center gap-1 rounded-xl border border-red-500/30 bg-red-500/20 px-2.5 py-1 text-[10px] font-black uppercase text-red-200 hover:bg-red-500/30"
              >
                <RefreshCw className="h-3 w-3" /> Riprova
              </button>
            )}
          </div>
        )}

        <ul ref={listRef} className="scrollbar-none flex-1 space-y-1.5 overflow-y-auto p-3">
          {visibleMessages.length === 0 ? (
            <li className="grid h-full min-h-16 place-items-center px-5 py-3 text-center">
              <span className="text-xs text-white/35">
                La chat della partita è attiva. Scrivi all&apos;avversario o invia una reazione rapida.
              </span>
            </li>
          ) : (
            visibleMessages.map((m) => {
              const mine = m.userId === userId;
              const sticker = stickerFromText(m.text);
              return (
                <li key={m.id} className={cn('flex', mine ? 'justify-end' : 'justify-start')}>
                  <div
                    className={cn(
                      'max-w-[78%] rounded-2xl border px-3 py-1.5',
                      mine
                        ? 'rounded-br-md border-primary/25 bg-primary/15'
                        : 'rounded-bl-md border-sky-400/20 bg-sky-400/[0.08]',
                    )}
                  >
                    {!mine && (
                      <p className="text-[10px] font-black uppercase tracking-wider text-sky-300">
                        {displayName(m.userId)}
                      </p>
                    )}
                    {sticker ? (
                      <p className="flex items-center gap-2 py-0.5">
                        <span className="sticker-chat-pop grid h-6 w-6 shrink-0 place-items-center" aria-hidden>
                          <MatchStickerIcon id={sticker.id} />
                        </span>
                        <span className="font-sans text-[11px] font-black uppercase tracking-wider text-[#FF9C4A]">
                          {sticker.label}
                        </span>
                      </p>
                    ) : (
                      <p className="text-sm leading-snug text-white/95">{m.text}</p>
                    )}
                  </div>
                </li>
              );
            })
          )}
        </ul>
      </div>

      {/* Azioni: sticker e invio, colonna a destra su desktop. */}
      <div className="flex shrink-0 flex-col gap-2 border-t border-white/10 bg-white/[0.02] p-2.5 lg:w-80 lg:justify-center lg:border-l lg:border-t-0 lg:px-3.5">
        <div className="scrollbar-none flex items-center gap-1.5 overflow-x-auto py-0.5">
          {MATCH_STICKERS.map((s) => (
            <button
              key={s.id}
              type="button"
              title={`${s.title} (${s.label})`}
              aria-label={`Invia sticker ${s.label}`}
              disabled={stickerCooldown || connectionState !== 'connected'}
              onClick={() => sendSticker(s.id)}
              className={cn(
                'group relative grid h-8 w-8 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/[0.05] p-1 transition duration-150',
                stickerCooldown || connectionState !== 'connected'
                  ? 'cursor-not-allowed opacity-35'
                  : 'hover:-translate-y-0.5 hover:border-primary/50 hover:bg-primary/20 hover:shadow-[0_0_12px_rgba(255,115,0,0.35)] active:scale-95',
              )}
            >
              <div className="h-5 w-5 transition-transform duration-150 group-hover:scale-125">
                <MatchStickerIcon id={s.id} />
              </div>
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
            className="h-10 min-w-0 flex-1 rounded-full border border-white/10 bg-white/[0.06] px-4 font-sans text-sm text-white placeholder:text-white/35 transition focus:border-primary/50 focus:bg-white/[0.08] focus:outline-none disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!draft.trim() || connectionState !== 'connected'}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-primary to-[#e0564d] text-white shadow-[0_6px_16px_-6px_rgba(255,115,0,0.55)] transition hover:brightness-110 active:scale-95 disabled:opacity-30 disabled:shadow-none"
            aria-label="Invia messaggio"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
