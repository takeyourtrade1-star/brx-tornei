import { FORMATS } from '@/lib/data/catalog';
import { Swords, Video, Trophy } from 'lucide-react';

interface OnboardingGuideProps {
  userName?: string | null;
}

const HIGHLIGHTS = [
  {
    title: 'Duelli 1v1 con carte fisiche',
    description:
      'Gioca direttamente dal browser inquadrando il tuo tappetino con la webcam del PC o usando la fotocamera dello smartphone. Sono ammesse anche carte stampate, a patto che siano a colori e ben visibili.',
    Icon: Video,
  },
  {
    title: 'Tornei per i tuoi TCG preferiti',
    description:
      'Iscriviti a tornei aperti, crea eventi personalizzati con i tuoi amici o cerca partite rapide quando vuoi.*',
    footnote: '*Funzionalità tornei personalizzati e matchmaking avanzato in arrivo.',
    Icon: Swords,
  },
  {
    title: 'Storico, vittorie e reputazione',
    description:
      'Ogni match aggiorna le tue statistiche di gioco, fa crescere il tuo grado e sblocca badge ed emblemi esclusivi.',
    Icon: Trophy,
  },
];

/**
 * Sezione di benvenuto e presentazione della piattaforma tornei.
 */
export function OnboardingGuide({ userName }: OnboardingGuideProps) {
  const formatList = FORMATS.slice(0, 6);

  return (
    <div className="flex flex-col justify-center space-y-4.5 sm:space-y-5 lg:space-y-5.5 text-white">
      {/* Intestazione */}
      <div className="space-y-1.5 sm:space-y-2">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary">
          Ebartex Tournaments
        </p>
        <h1 className="font-display text-2xl font-black tracking-tight text-white sm:text-3xl lg:text-[2rem] leading-tight">
          L&apos;arena online per le tue carte fisiche
        </h1>
        <p className="max-w-xl text-xs sm:text-sm leading-relaxed text-slate-300">
          {userName ? (
            <>
              Ciao <strong className="font-bold text-white">{userName}</strong>! Il tuo account Ebartex è pronto.
              Scegli il tuo nome da duellante e scendi in campo nei tornei della community.
            </>
          ) : (
            'Il tuo account Ebartex è pronto. Scegli il tuo nome da duellante e scendi in campo nei tornei della community.'
          )}
        </p>
      </div>

      {/* 3 Pilastri di gioco */}
      <div className="space-y-3 sm:space-y-3.5">
        {HIGHLIGHTS.map(({ title, description, footnote, Icon }) => (
          <div
            key={title}
            className="flex items-start gap-3.5 sm:gap-4 rounded-xl border border-white/10 bg-white/[0.03] p-3.5 sm:p-4 backdrop-blur-sm transition-colors hover:border-white/20 hover:bg-white/[0.06]"
          >
            <div className="grid h-9 w-9 sm:h-10 sm:w-10 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary">
              <Icon className="h-4.5 w-4.5 sm:h-5 sm:w-5" aria-hidden />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-[15px] font-bold text-white leading-snug">{title}</h2>
              <p className="mt-0.5 text-xs sm:text-[13px] leading-relaxed text-slate-300">{description}</p>
              {footnote && (
                <p className="mt-1 text-[10px] sm:text-[11px] font-medium text-amber-300/80">{footnote}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Formati supportati */}
      <div className="space-y-2 pt-1 sm:pt-2">
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Formati e giochi supportati
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {formatList.map((f) => (
            <span
              key={f.id}
              className="rounded-lg border border-white/15 bg-white/5 px-2.5 py-1 text-xs font-semibold text-white/90"
            >
              {f.name}
            </span>
          ))}
          {FORMATS.length > formatList.length && (
            <span className="rounded-lg border border-white/15 bg-white/5 px-2.5 py-1 text-xs font-semibold text-slate-400">
              +{FORMATS.length - formatList.length} altri
            </span>
          )}
        </div>
      </div>
    </div>
  );
}


