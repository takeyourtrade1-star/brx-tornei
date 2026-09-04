"use client";

import React, { useId, useRef, useState, type FormEvent, type RefObject } from "react";
import {
  MAX_CHAT_LENGTH,
  sanitizeChatText,
  type SocialRoomPlayer,
} from "./social-room-protocol";
import { ChatBubble, PlayerRow, QUICK_MESSAGES } from "./PiazzaSocialPanelParts";

export interface PiazzaSocialPanelProps {
  /** Roster già validato e aggiornato dal layer di presenza realtime. */
  readonly players: readonly SocialRoomPlayer[];
  /** True solo dopo l'autenticazione del WebSocket della Piazza. */
  readonly connected: boolean;
  /** Errore del trasporto o dell'ACK, se presente. */
  readonly error: string | null;
  /** Restituisce false quando il trasporto non ha accettato l'invio locale. */
  readonly onSendChat: (text: string) => boolean;
  /** Ref opzionale per permettere al motore di dare focus alla chat. */
  readonly inputRef?: RefObject<HTMLInputElement>;
}

/** Dock compatta di roster e chat per la Sala Piazza. */
export function PiazzaSocialPanel({
  players,
  connected,
  error,
  onSendChat,
  inputRef,
}: PiazzaSocialPanelProps): React.JSX.Element {
  const localInputRef = useRef<HTMLInputElement>(null);
  const fieldRef = inputRef ?? localInputRef;
  const [draft, setDraft] = useState("");
  const [rosterOpen, setRosterOpen] = useState(false);
  const [messagesOpen, setMessagesOpen] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const idPrefix = useId();
  const rosterId = `${idPrefix}-roster`;
  const messagesId = `${idPrefix}-messages`;
  const chatInputId = `${idPrefix}-chat-input`;
  const countId = `${idPrefix}-chat-count`;

  // Dopo la disconnessione i dati remoti precedenti non sono più una presenza confermata.
  const livePlayers = connected ? players : [];
  const playersWithBubbles = livePlayers.filter((player) => player.bubble !== null);
  const sanitizedDraft = sanitizeChatText(draft);
  const canSubmit = connected && sanitizedDraft.length > 0;
  const statusLabel = connected
    ? "Online"
    : error
      ? "Piazza offline"
      : "Ingresso in piazza…";

  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    if (!connected) return;
    if (!sanitizedDraft) {
      setSubmitError("Scrivi un messaggio prima di inviarlo.");
      return;
    }
    if (!onSendChat(sanitizedDraft)) {
      setSubmitError("Messaggio non inviato.");
      return;
    }
    setDraft("");
    setSubmitError(null);
  };

  const sendQuickMessage = (message: string): void => {
    const text = sanitizeChatText(message);
    if (!connected || !text) return;
    if (!onSendChat(text)) {
      setDraft(text);
      setSubmitError("Messaggio non inviato.");
      fieldRef.current?.focus();
      return;
    }
    setDraft("");
    setSubmitError(null);
  };

  return (
    <aside
      className="flex w-full min-w-0 flex-col gap-2 rounded-xl border border-white/10 bg-header-bg p-2 text-white shadow-xl shadow-black/30 backdrop-blur-sm sm:max-w-sm"
      aria-label="Chat della Sala Piazza"
    >
      <header className="flex min-h-7 min-w-0 items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5">
          <span
            className={connected ? "h-2 w-2 shrink-0 rounded-full bg-emerald-400" : "h-2 w-2 shrink-0 rounded-full bg-white/35"}
            aria-hidden="true"
          />
          <span
            className="truncate font-display text-[11px] font-black uppercase tracking-wider text-white"
            role="status"
            aria-live="polite"
            aria-label={statusLabel}
          >
            {statusLabel}
          </span>
          {error && (
            <details className="min-w-0 text-[10px] font-semibold text-white/60">
              <summary className="cursor-pointer rounded px-1 py-0.5 underline decoration-white/30 underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary motion-reduce:transition-none">
                Dettagli
              </summary>
              <p className="mt-1 max-w-[16rem] rounded-lg border border-red-300/20 bg-red-500/10 p-2 text-left text-[11px] leading-4 text-red-100" role="alert">
                {error}
              </p>
            </details>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <span
            className="rounded-full bg-white/[0.08] px-1.5 py-1 text-[10px] font-black tabular-nums text-white/75"
            aria-label={connected ? `${livePlayers.length} giocatori presenti` : "Numero di giocatori non disponibile"}
          >
            {connected ? livePlayers.length : "—"}
          </span>
          <button
            type="button"
            className="min-h-7 rounded-md border border-white/10 px-2 text-[10px] font-black uppercase tracking-wide text-white/75 transition-colors hover:border-primary/40 hover:bg-white/[0.08] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary motion-reduce:transition-none"
            aria-expanded={rosterOpen}
            aria-controls={rosterId}
            onClick={() => setRosterOpen((open) => !open)}
          >
            {rosterOpen ? "Chiudi" : "Presenti"}
          </button>
          {connected && (
            <button
              type="button"
              className="min-h-7 rounded-md border border-white/10 px-2 text-[10px] font-black uppercase tracking-wide text-white/75 transition-colors hover:border-primary/40 hover:bg-white/[0.08] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary motion-reduce:transition-none"
              aria-expanded={messagesOpen}
              aria-controls={messagesId}
              onClick={() => setMessagesOpen((open) => !open)}
            >
              {messagesOpen ? "Nascondi" : "Chat"}
            </button>
          )}
        </div>
      </header>

      <section id={rosterId} className={rosterOpen ? "grid gap-2" : "hidden"} aria-labelledby={`${idPrefix}-roster-title`}>
        <h2 id={`${idPrefix}-roster-title`} className="font-display text-[10px] font-black uppercase tracking-wider text-white/65">
          Giocatori presenti
        </h2>
        {!connected ? (
          <p className="rounded-lg border border-dashed border-white/15 px-2.5 py-2 text-xs font-semibold text-white/55">
            Elenco in pausa.
          </p>
        ) : livePlayers.length === 0 ? (
          <p className="rounded-lg border border-dashed border-white/15 px-2.5 py-2 text-xs font-semibold text-white/55">
            Nessun giocatore in sala.
          </p>
        ) : (
          <ul className="grid max-h-40 gap-1.5 overflow-auto pr-1" aria-label="Giocatori confermati nella Piazza">
            {livePlayers.map((player) => <PlayerRow key={player.peerId} player={player} />)}
          </ul>
        )}
      </section>

      {connected && (
        <section id={messagesId} className={messagesOpen ? "grid gap-2" : "hidden"} aria-labelledby={`${idPrefix}-messages-title`}>
          <h2 id={`${idPrefix}-messages-title`} className="font-display text-[10px] font-black uppercase tracking-wider text-white/65">
            Messaggi recenti
          </h2>
          {playersWithBubbles.length === 0 ? (
            <p className="rounded-lg border border-dashed border-white/15 px-2.5 py-2 text-xs font-semibold text-white/55">
              Nessun messaggio recente.
            </p>
          ) : (
            <ul className="grid max-h-32 gap-1.5 overflow-y-auto pr-1" aria-label="Messaggi recenti della Piazza">
              {playersWithBubbles.map((player) => <ChatBubble key={`${player.peerId}-${player.bubble?.id}`} player={player} />)}
            </ul>
          )}
        </section>
      )}

      <form className="grid gap-1.5" onSubmit={handleSubmit}>
        <label htmlFor={chatInputId} className="sr-only">Messaggio per la Piazza</label>
        <div className="flex min-w-0 gap-1.5">
          <input
            ref={fieldRef}
            id={chatInputId}
            type="text"
            value={draft}
            onChange={(event) => {
              setDraft(event.target.value);
              setSubmitError(null);
            }}
            maxLength={MAX_CHAT_LENGTH}
            disabled={!connected}
            placeholder="Scrivi un saluto…"
            aria-label="Messaggio per la Piazza"
            aria-describedby={countId}
            className="h-11 min-w-0 flex-1 rounded-lg border border-white/15 bg-white/[0.08] px-3 text-sm font-semibold text-white placeholder:text-white/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-55"
          />
          <button
            type="submit"
            disabled={!canSubmit}
            className="h-11 shrink-0 rounded-lg bg-primary px-3 text-xs font-black uppercase tracking-wide text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-45 motion-reduce:transition-none"
            aria-label="Invia messaggio alla Piazza"
          >
            Invia
          </button>
        </div>
        <span id={countId} className="sr-only" aria-live="polite">
          {Array.from(sanitizedDraft).length} caratteri su {MAX_CHAT_LENGTH}
        </span>
        {connected && (
          <div className="scrollbar-none flex min-w-0 gap-1.5 overflow-x-auto" aria-label="Messaggi predefiniti">
            {QUICK_MESSAGES.map((message) => (
              <button
                key={message}
                type="button"
                onClick={() => sendQuickMessage(message)}
                className="h-11 shrink-0 rounded-full border border-white/10 bg-white/[0.06] px-3 text-[10px] font-bold text-white/75 transition-colors hover:border-primary/45 hover:bg-primary/15 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary motion-reduce:transition-none"
                aria-label={`Invia messaggio rapido: ${message}`}
              >
                {message}
              </button>
            ))}
          </div>
        )}
        {submitError && <p className="text-[11px] font-bold leading-4 text-red-200" role="alert">{submitError}</p>}
      </form>
    </aside>
  );
}
