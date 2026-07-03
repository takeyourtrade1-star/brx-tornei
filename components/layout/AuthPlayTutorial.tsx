import Link from 'next/link';
import Image from 'next/image';
import { getCdnImageUrl } from '@/lib/config';
import { FORMATS } from '@/lib/data/catalog';
import { cn } from '@/lib/utils';

interface AuthPlayTutorialProps {
  className?: string;
}

type TutorialStep = {
  key: string;
  label: string;
  title: string;
  lines: readonly string[];
  accent: string;
};

const STEPS: TutorialStep[] = [
  {
    key: 'access',
    label: 'Passo 1',
    title: 'Accedi con Ebartex',
    lines: [
      'Usa email o username e password del sito principale.',
      'Un solo account per carte, inventario e piattaforma tornei.',
    ],
    accent: '#FB923C',
  },
  {
    key: 'browse',
    label: 'Passo 2',
    title: 'Scegli formato e modalità',
    lines: [
      'Dalla dashboard apri la sezione Tornei.',
      'Seleziona formato TCG e modalità di gioco; puoi filtrare l’elenco.',
    ],
    accent: '#34D399',
  },
  {
    key: 'join',
    label: 'Passo 3',
    title: 'Iscriviti o crea un torneo',
    lines: [
      'Su un torneo in registrazione premi Partecipa per entrare.',
      'Per organizzare, crea il tuo torneo con formato, best-of e visibilità.',
    ],
    accent: '#A78BFA',
  },
  {
    key: 'play',
    label: 'Passo 4',
    title: 'Gioca la partita in live',
    lines: [
      'Al via del match collega la webcam dal PC.',
      'Il telefono può fare da camera via QR; poi segui risultati e classifiche.',
    ],
    accent: '#38BDF8',
  },
];

/**
 * Colonna sinistra auth — stile LoginDemoShowcase (new_frontend_brx):
 * headline editorial, pillar con barre accent e chip formati.
 */
export function AuthPlayTutorial({ className }: AuthPlayTutorialProps) {
  const formatTags = FORMATS.slice(0, 5);

  return (
    <div className={cn('flex h-full w-full min-w-0 flex-col', className)}>
      <Link
        href="/"
        aria-label="Vai alla home"
        className="inline-flex shrink-0 pt-1 transition-opacity hover:opacity-90"
      >
        <Image
          src={getCdnImageUrl('Logo%20Principale%20EBARTEX.png')}
          alt="Ebartex"
          width={700}
          height={263}
          className="h-11 w-auto object-contain drop-shadow-lg sm:h-12 lg:h-14"
          sizes="280px"
          priority
          unoptimized
        />
      </Link>

      <div className="flex flex-1 flex-col justify-center gap-6 py-6 lg:gap-7">
        <div className="max-w-md">
          <h1 className="font-display text-[1.65rem] font-extrabold leading-[1.08] tracking-tight text-white drop-shadow sm:text-3xl lg:text-[2.1rem]">
            Come partecipare ai tornei
          </h1>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/65 sm:text-[15px]">
            Dall’accesso alla prima sfida in diretta: iscriviti, organizza un torneo o segui le
            partite live con le tue credenziali Ebartex.
          </p>
        </div>

        <ul className="flex flex-col">
          {STEPS.map(({ key, label, title, lines, accent }, i) => (
            <li
              key={key}
              className={cn('flex gap-4 py-3', i > 0 && 'border-t border-white/10')}
            >
              <span
                className="mt-1 h-9 w-[3px] shrink-0 rounded-full"
                style={{ backgroundColor: accent, boxShadow: `0 0 12px ${accent}99` }}
                aria-hidden
              />
              <div className="min-w-0">
                <span
                  className="text-[10px] font-bold uppercase tracking-[0.2em]"
                  style={{ color: accent }}
                >
                  {label}
                </span>
                <p className="text-[15px] font-bold leading-tight text-white">{title}</p>
                {lines.map((line) => (
                  <p key={line} className="mt-0.5 text-xs leading-snug text-white/55">
                    {line}
                  </p>
                ))}
              </div>
            </li>
          ))}
        </ul>

        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/40">
            Formati supportati
          </span>
          {formatTags.map((format) => (
            <span
              key={format.id}
              className="rounded-full border border-white/15 bg-white/[0.07] px-2 py-0.5 text-[10px] font-medium text-white/75 backdrop-blur-sm"
            >
              {format.name}
            </span>
          ))}
          {FORMATS.length > formatTags.length && (
            <span className="rounded-full border border-white/15 bg-white/[0.07] px-2 py-0.5 text-[10px] font-medium text-white/75 backdrop-blur-sm">
              +{FORMATS.length - formatTags.length}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
