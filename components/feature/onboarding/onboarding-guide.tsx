import { FORMATS } from '@/lib/data/catalog';
import { Camera, ShieldCheck, Sparkles, Trophy, UserCheck, Video } from 'lucide-react';

interface OnboardingGuideProps {
  userName?: string | null;
}

const GUIDE_STEPS = [
  {
    num: '01',
    title: 'Scegli Gamertag e Avatar',
    description: 'Il tuo nome di battaglia e l’emblema visibili agli avversari sui tavoli di gioco e nelle classifiche.',
    Icon: UserCheck,
  },
  {
    num: '02',
    title: 'Partecipa o Crea Tornei',
    description: 'Trova tornei attivi nei tuoi formati TCG preferiti, prepara il tuo mazzo o crea eventi personalizzati.',
    Icon: Trophy,
  },
  {
    num: '03',
    title: 'Duelli Live in Webcam',
    description: 'Gioca 1v1 in videochiamata P2P direttamente da PC o usa lo smartphone come camera tramite QR code.',
    Icon: Video,
  },
  {
    num: '04',
    title: 'Scala Rank e Reputazione',
    description: 'Accumula vittorie, sblocca leghe competitive, guadagna punti onore e colleziona badge unici.',
    Icon: Sparkles,
  },
];

const FEATURE_PILLS = [
  { label: 'Video P2P a Bassa Latenza', icon: Camera },
  { label: 'Anti-Cheat Locale Trasparente', icon: ShieldCheck },
];

/**
 * Sezione di benvenuto e mini-guida ai tornei Ebartex.
 */
export function OnboardingGuide({ userName }: OnboardingGuideProps) {
  const formatList = FORMATS.slice(0, 6);

  return (
    <div className="flex flex-col justify-center space-y-6 text-white lg:py-2">
      {/* Intestazione e Benvenuto */}
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-marquee/30 bg-marquee/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-marquee">
          <Sparkles className="h-3.5 w-3.5" aria-hidden />
          Nuovo Giocatore Ebartex
        </div>

        <h1 className="font-display text-2xl font-black uppercase tracking-tight text-white sm:text-3xl lg:text-4xl">
          Benvenuto nell&apos;Arena dei Tornei
        </h1>

        <p className="max-w-xl text-sm leading-relaxed text-white/75 sm:text-base">
          {userName ? (
            <>
              Ciao <strong className="font-bold text-white">{userName}</strong>! Il tuo account Ebartex è collegato.
              Bastano pochi secondi per attivare il tuo profilo duellante e scendere in campo.
            </>
          ) : (
            'Il tuo account Ebartex è collegato. Bastano pochi secondi per attivare il tuo profilo duellante e scendere in campo.'
          )}
        </p>
      </div>

      {/* Mini Guida in 4 Step */}
      <div className="space-y-3 pt-1">
        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-white/50">
          Come funzionano i tornei
        </p>

        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {GUIDE_STEPS.map(({ num, title, description, Icon }) => (
            <div
              key={num}
              className="relative flex flex-col justify-between rounded-xl border border-white/10 bg-white/[0.04] p-3.5 backdrop-blur-sm transition-colors hover:border-white/20 hover:bg-white/[0.07]"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary/20 text-xs font-black text-primary">
                  <Icon className="h-4 w-4" aria-hidden />
                </span>
                <span className="font-display text-xs font-black text-white/40 tabular-nums">{num}</span>
              </div>
              <div className="mt-2.5">
                <h3 className="text-sm font-bold text-white">{title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-white/60">{description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Formati e Feature Pills */}
      <div className="space-y-3 border-t border-white/10 pt-4">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-white/40">
            Formati Supportati:
          </span>
          {formatList.map((f) => (
            <span
              key={f.id}
              className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] font-medium text-white/80"
            >
              {f.name}
            </span>
          ))}
          {FORMATS.length > formatList.length && (
            <span className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] font-medium text-white/60">
              +{FORMATS.length - formatList.length} altri
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-1">
          {FEATURE_PILLS.map(({ label, icon: Icon }) => (
            <span
              key={label}
              className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-950/30 px-2.5 py-1 text-[11px] font-medium text-emerald-300"
            >
              <Icon className="h-3 w-3 text-emerald-400" aria-hidden />
              {label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
