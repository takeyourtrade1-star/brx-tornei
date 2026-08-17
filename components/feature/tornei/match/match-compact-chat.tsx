'use client';

import { useId, useMemo, useState } from 'react';
import { RefreshCw, Send, Shield } from 'lucide-react';
import type { MatchChatConnectionState, MatchChatMessage } from '@/hooks/use-match-chat';
import { isMatchLifeMessage } from '@/lib/match-life-protocol';
import { isMatchStartMessage } from '@/lib/match-start-protocol';
import { MATCH_STICKERS, stickerFromText, stickerToText } from './match-stickers';
import { MatchStickerIcon } from './match-sticker-icons';

export interface MatchCompactChatProps {
  me: string;
  userId: string;
  messages: MatchChatMessage[];
  send: (text: string) => boolean;
  connectionState: MatchChatConnectionState;
  error: string | null;
  onRetry?: () => void;
  participantNames: Record<string, string>;
  fullHeight?: boolean;
}

export function MatchCompactChat({
  me,
  userId,
  messages,
  send,
  connectionState,
  error,
  onRetry,
  participantNames,
  fullHeight = false,
}: MatchCompactChatProps) {
  const inputId = useId();
  const [draft, setDraft] = useState('');
  const visibleMessages = useMemo(
    () => messages.filter((message) => !isMatchLifeMessage(message.text) && !isMatchStartMessage(message.text)),
    [messages],
  );
  const lastMessage = visibleMessages.at(-1);
  const connected = connectionState === 'connected';
  const sender = lastMessage
    ? lastMessage.userId === userId
      ? me
      : (participantNames[lastMessage.userId] ?? 'Avversario')
    : null;
  const sticker = lastMessage ? stickerFromText(lastMessage.text) : null;

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const text = draft.trim();
    if (!text) return;
    if (send(text)) setDraft('');
  }

  return (
    <section className={'rounded-2xl border border-white/15 bg-header-bg/85 p-2 text-white shadow-2xl shadow-black/40 backdrop-blur-xl' + (fullHeight ? ' flex h-full min-h-0 flex-col' : '')}>
      <div className="mb-1.5 flex items-center gap-1.5 px-1">
        <Shield className="h-3 w-3 text-amber-400" />
        <span className="text-[9px] font-bold text-white/60">Fair Play</span>
        <span className={connected ? 'ml-auto h-1.5 w-1.5 rounded-full bg-emerald-400' : 'ml-auto h-1.5 w-1.5 rounded-full bg-red-400'} />
        {!connected && onRetry && (
          <button type="button" onClick={onRetry} className="grid h-6 w-6 place-items-center rounded-md hover:bg-white/10" aria-label="Riconnetti la chat">
            <RefreshCw className="h-3 w-3" />
          </button>
        )}
      </div>

      <div className={'mb-1.5 min-w-0 rounded-lg bg-white/[0.05] px-2 py-1.5' + (fullHeight ? ' min-h-0 flex-1 overflow-y-auto' : '')}>
        {fullHeight ? (
          <ul className="space-y-1.5 text-[10px] text-white/70">
            {visibleMessages.length ? visibleMessages.map((message) => {
              const name = message.userId === userId ? me : (participantNames[message.userId] ?? 'Avversario');
              const messageSticker = stickerFromText(message.text);
              return (
                <li key={message.id} className="flex items-center gap-1.5 break-words">
                  <strong className="text-white">{name}:</strong>{' '}
                  {messageSticker ? (
                    <span className="inline-flex items-center gap-1 font-sans font-bold text-primary">
                      <span className="grid h-4 w-4 shrink-0 place-items-center"><MatchStickerIcon id={messageSticker.id} /></span>
                      {messageSticker.label}
                    </span>
                  ) : (
                    message.text
                  )}
                </li>
              );
            }) : <li className="grid h-full min-h-12 place-items-center text-white/35">{error ?? 'Nessun messaggio'}</li>}
          </ul>
        ) : lastMessage ? (
          <p className="flex items-center gap-1 truncate text-[10px] text-white/70">
            <strong className="text-white">{sender}:</strong>{' '}
            {sticker ? (
              <span className="inline-flex items-center gap-1 font-sans font-bold text-primary">
                <span className="grid h-4 w-4 shrink-0 place-items-center"><MatchStickerIcon id={sticker.id} /></span>
                {sticker.label}
              </span>
            ) : (
              lastMessage.text
            )}
          </p>
        ) : (
          <p className="truncate text-[10px] text-white/35">{error ?? 'Nessun messaggio'}</p>
        )}
      </div>

      <div className="scrollbar-none mb-1.5 flex items-center gap-1 overflow-x-auto py-0.5">
        {MATCH_STICKERS.map((s) => (
          <button
            key={s.id}
            type="button"
            title={`${s.title} (${s.label})`}
            aria-label={`Invia sticker ${s.label}`}
            disabled={!connected}
            onClick={() => send(stickerToText(s.id))}
            className="grid h-7 w-7 shrink-0 place-items-center rounded-lg border border-white/10 bg-white/[0.05] p-1 transition hover:border-primary/50 hover:bg-primary/20 active:scale-95 disabled:opacity-35"
          >
            <div className="h-4 w-4">
              <MatchStickerIcon id={s.id} />
            </div>
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="flex gap-1.5">
        <label htmlFor={inputId} className="sr-only">Scrivi un messaggio</label>
        <input
          id={inputId}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Messaggio..."
          maxLength={500}
          disabled={!connected}
          className="h-8 min-w-0 flex-1 rounded-lg border border-white/10 bg-black/20 px-2.5 font-sans text-xs text-white placeholder:text-white/30 focus:border-primary/50 focus:outline-none disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!draft.trim() || !connected}
          className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary text-white transition hover:opacity-90 disabled:opacity-30"
          aria-label="Invia messaggio"
        >
          <Send className="h-3.5 w-3.5" />
        </button>
      </form>
    </section>
  );
}
