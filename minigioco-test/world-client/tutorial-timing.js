export const TUT_STEPS = [
  { kind: "say", intro: true, dur: 10, text: "Ciao! Sono Asso 🃏, la tua guida. In pochi secondi ti mostro i 3 punti chiave della stanza: seguimi!" },
  { kind: "demo", id: "pc",    text: "1 di 3 · Il PC 🖥️ — apre i tavoli ufficiali, aggiornati con la lobby in tempo reale.",
    inside: "Le card e le azioni sono le stesse della lobby Ebartex: siediti, gestisci il tavolo o entra nella partita." },
  { kind: "demo", id: "board", text: "2 di 3 · La bacheca 📌 — apre il flusso ufficiale per creare un nuovo tavolo.",
    inside: "Dichiara il mazzo e crea la sfida con le regole correnti del formato selezionato." },
  { kind: "demo", id: "decks", text: "3 di 3 · Il tavolo 🃏 — apre il gestore mazzi ufficiale Ebartex.",
    inside: "Costruisci e salva usando catalogo, legalità, ban, limiti copie e regole Commander aggiornate." },
  { kind: "keys", id: "keys", text: "Premendo i tasti del tuo PC — o i comandi qui in basso — apri subito ciò che ti serve." },
];
/* Ritmo typewriter condiviso col banner React + tempo di lettura dopo la digitazione. */
export const TUT_CHAR_MS = 52;
export function tutPauseMs(ch) {
  return ".!?…".includes(ch) ? 520 : ",;:".includes(ch) ? 280 : TUT_CHAR_MS;
}
export function tutTypingMs(text) {
  const chars = Array.from(text || "");
  if (!chars.length) return 0;
  let ms = TUT_CHAR_MS;
  for (const ch of chars) ms += tutPauseMs(ch);
  return ms;
}
export function tutReadMs(text, { intro = false } = {}) {
  const n = Array.from(text || "").length;
  const base = intro ? 2600 : 2000;
  const perChar = intro ? 34 : 26;
  return base + n * perChar;
}
export function tutCaptionMs(text, opts) {
  return tutTypingMs(text) + tutReadMs(text, opts);
}
export function tutCaptionSec(text, opts) {
  return tutCaptionMs(text, opts) / 1000;
}
export function tutHoldSec(step) {
  return tutCaptionMs(step.inside || "") / 1000;
}
export function tutUiHoldSec(step) {
  const textMs = tutCaptionMs(step.text || "");
  const spots = TUT_UI_HOTSPOTS[step.id];
  const spotMs = spots && spots.length ? 900 + (spots.length - 1) * 950 : 0;
  return (textMs + spotMs) / 1000;
}
/* Messaggio finale (cartello grande ri-ingrandito con i bottoni di scelta). */
export const TUT_OUTRO = "È tutto qui! 🎉 PC per giocare, bacheca per creare, tavolo per i mazzi. Ora esplora pure la stanza: benvenuto in\nEbartex Tournaments!";
export const TUT_BRAND = "Ebartex Tournaments";
/* Placeholder breve mentre il banner si prepara (prima del saluto di Asso). */
export const TUT_WAIT = "Ecco un breve tutorial, ti mostro la stanza";

/* Punti caldi fuori modale (es. legenda tasti in basso a sinistra). */
export const TUT_UI_HOTSPOTS = {
  keys: [
    { sel: "[data-world-tutorial-index=\"0\"]", label: "1 → PC · Tornei", side: "top" },
    { sel: "[data-world-tutorial-index=\"1\"]", label: "2 → Tavolo · Deck", side: "top" },
    { sel: "[data-world-tutorial-index=\"2\"]", label: "3 → Bacheca · Crea", side: "top" },
    { sel: "[data-world-tutorial-index=\"3\"]", label: "P → Foto", side: "top" },
  ],
};

/** Stima durata di uno step (allineata a tutTick). */
export function tutEstimatedStepSec(step) {
  if (step.kind === "say") {
    return step.dur ?? tutCaptionSec(step.text, { intro: !!step.intro });
  }
  if (step.kind === "keys") {
    return tutUiHoldSec(step);
  }
  const walk = Math.max(tutCaptionSec(step.text), 4.5);
  return walk + tutHoldSec(step) + 3.5;
}
export function tutTotalDurationSec() {
  return TUT_STEPS.reduce((sum, step) => sum + tutEstimatedStepSec(step), 0);
}
export function formatTutDurationLabel(sec) {
  const total = Math.ceil(sec);
  if (total < 60) return `circa ${total} s`;
  const min = Math.round(total / 60);
  return min === 1 ? "circa 1 min" : `circa ${min} min`;
}
export const TUT_DURATION_LABEL = formatTutDurationLabel(tutTotalDurationSec());
