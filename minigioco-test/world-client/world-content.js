/* Battute degli easter egg (oggetti decorativi cliccabili) */
export const EGG_LINES = {
  plant: ["Una pianta finta: zero mana, zero manutenzione 🌿", "Le racconto le mie sconfitte. Non giudica mai.", "Foglia-counter: ancora imbattuta."],
  lamp: ["Illuminazione da torneo professionale 💡", "Accesa dal 2019. Nessuno trova l'interruttore.", "Lume di candela? No, lume di meta."],
  cam: ["📹 Sorridi, sei su Ebartex TV!", "La regia inquadra solo le mie vittorie.", "REC… meglio non fare misplay adesso."],
  cam2: ["Questa telecamera riprende il mio lato migliore.", "📹 Angolo B: per i replay delle giocate epiche."],
  chair: ["La sedia del campione. La sto scaldando per me.", "Ergonomica, dicono. Il mio collo dissente.", "5 ruote, 0 sconfitte."],
  stool: ["Uno sgabello onesto, senza pretese.", "Riservato agli sfidanti.", "Tre gambe e tanta umiltà."],
  window: ["Bella giornata… per stare al chiuso a giocare ☀️", "Là fuori c'è un mondo intero senza carte. Che tristezza."],
  windowNight: ["Le stelle stanno guardando. Niente pressione ✨", "Notte perfetta per un'ultima partita. L'ultima davvero, giuro."],
  posterBrand: ["Ebartex: dove i sogni diventano BO3 🧡", "Il poster del capo. Spolverato ogni giorno."],
};

/* Battute per i poster dinamici (carta della settimana / ban hammer) */
export const BAN_LINES = [
  "Bandita per «eccesso di divertimento altrui» ⚖️",
  "Il giudice ha parlato: troppo forte perfino per il proprietario.",
  "Tre turni, zero interazione: il martello era inevitabile 🔨",
  "RIP. Era bella finché vinceva da sola.",
];
export const WEEK_LINES = [
  "⭐ La più venduta su ebartex! Le altre carte rosicano.",
  "Vola in classifica vendite: il poster se l'è guadagnato.",
  "Top seller della settimana. Sì, ne ho già tre copie.",
];

/* Nomi torneo mock per la ricompensa crediti della busta lettere */
export const MOCK_TOURNAMENT_NAMES = [
  "Coppa del Weekend", "Grand Prix Notturno", "Challenge d'Autunno",
  "Torneo dei Campioni", "Duello d'Estate", "Open del Venerdì",
  "Coppa Ebartex", "Memorial del Meta", "Rush Hour Cup",
];

export const CREDIT_REWARD_NICE = [25, 50, 75, 100, 125, 150, 200];

export function mockCreditReward() {
  const creditsBefore = 80 + Math.floor(Math.random() * 920);
  const creditsEarned =
    Math.random() < 0.45
      ? CREDIT_REWARD_NICE[Math.floor(Math.random() * CREDIT_REWARD_NICE.length)]
      : 15 + Math.floor(Math.random() * 136);
  return {
    creditsBefore,
    creditsEarned,
    creditsAfter: creditsBefore + creditsEarned,
  };
}

/** Valore crediti con effetto slot/casinò durante il reveal. */
export function slotCreditValue(before, after, progress) {
  const spinStart = 0.1;
  const spinEnd = 0.94;
  if (progress < spinStart) return before;
  if (progress >= spinEnd) return after;
  const t = (progress - spinStart) / (spinEnd - spinStart);
  const eased = 1 - Math.pow(1 - t, 4.2);
  const base = before + (after - before) * eased;
  const jitterMax = Math.pow(1 - t, 2.2) * Math.max(12, (after - before) * 0.55);
  const jitter =
    (Math.sin(progress * 118 + before * 0.07) * 0.45 +
      Math.sin(progress * 73 + after * 0.11) * 0.55) *
    jitterMax;
  return Math.min(after, Math.max(before, Math.floor(base + jitter)));
}

export function formatCredits(n) {
  return Math.round(n).toLocaleString("it-IT");
}

/** Layout card ricompensa crediti (coordinate locali, origine al centro).
 *  h:300 con padding 20px in basso sotto il bottone; btnCy assoluto dal centro. */
export const CREDITS_REWARD_CARD = { w: 290, h: 300, btnW: 140, btnH: 32, btnCy: 114 };

/** URL sezione crediti del portale Ebartex (sottodominio account). */
export const EBARTEX_CREDITO_URL = "https://www.ebartex.com/account/credito";
/** Colore arancione brand per il link "Ebartex". */
export const EB_LINK_ORANGE = "#ff7a32";

/* Battute misteriose della modalità Shadow Realm */
export const SHADOW_LINES = [
  "Il meta è un'illusione…",
  "Hai visto cosa c'è dietro il codice?",
  "Le carte ci guardano da sempre. Ora lo sai.",
  "Mezzanotte è solo un altro mulligan del tempo.",
  "Qui ogni topdeck era già scritto.",
  "Shhh… il Reame ascolta.",
];

/* Battute al risveglio dall'AFK (idle reward) */
export const AFK_LINES = [
  "Ho meditato: il prossimo mazzo sarà leggendario 🧘",
  "Che pisolino! Energie al 100% 🔋",
  "Nel sogno ho toppato la combo. Buon segno ✨",
  "Mente lucida, mana pieno. Si gioca.",
];

/* Carte di Magic per Missy */
export const MTG_CARDS = [
  "Black Lotus",
  "Ancestral Recall",
  "Time Walk",
  "Mox Sapphire",
  "Lightning Bolt",
  "Colossal Dreadmaw",
  "Thassa's Oracle",
  "Jace, the Mind Sculptor",
  "Force of Will",
  "Ragavan",
  "Black Cat",
  "Savannah Lions",
  "Sol Ring",
  "Tarmogoyf",
  "Wrath of God",
  "Nicol Bolas",
  "Cruel Ultimatum",
  "Gaea's Cradle",
  "Sheoldred",
  "Bolas's Citadel",
  "Thoughtseize",
  "Birds of Paradise"
];

export const MTG_TEMPLATES = [
  (card) => `Miao miao... ${card}... miao! 🐈`,
  (card) => `Miao! ${card}! Purr... 🐾`,
  (card) => `Miao miao, ${card}, purr miao! 🐱`,
  (card) => `Miao... ${card}... miao miao. 🐈‍⬛`,
  (card) => `Miao! ${card}! Miao! 🐾`
];

/* Fase del giorno in base all'ora locale */
