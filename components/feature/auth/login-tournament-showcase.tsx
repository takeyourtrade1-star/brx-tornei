'use client';

import Link from 'next/link';
import Image from 'next/image';
import { getCdnImageUrl } from '@/lib/config';
import { FORMATS } from '@/lib/data/catalog';
import { cn } from '@/lib/utils';

interface LoginTournamentShowcaseProps {
  className?: string;
}

type Pillar = {
  key: string;
  label: string;
  title: string;
  description: string;
  accent: string;
};

const PILLARS: Pillar[] = [
  {
    key: 'live',
    label: 'Tornei live',
    title: 'Partecipa e segui le partite',
    description:
      'Dal PC della stanza entri nei tornei aperti, controlli lo stato e ti iscrivi con un click.',
    accent: '#FB923C',
  },
  {
    key: 'create',
    label: 'Crea sfide',
    title: 'Organizza tornei su misura',
    description:
      'Pubblica tornei pubblici o privati dalla bacheca: formato, regole e buy-in a tua scelta.',
    accent: '#34D399',
  },
  {
    key: 'decks',
    label: 'Mazzi TCG',
    title: 'Costruisci il deck perfetto',
    description:
      'Al tavolo delle carte monti i mazzi con le carte del tuo inventario Ebartex.',
    accent: '#A78BFA',
  },
  {
    key: 'room',
    label: 'Stanza virtuale',
    title: 'Gioca in un mondo isometrico',
    description:
      'Esplora la sala, interagisci con gli oggetti e sfida gli avversari in un ambiente vivo.',
    accent: '#38BDF8',
  },
];

/** Colonna sinistra auth: vantaggi tornei/minigioco (editoriale, barre accent — no icone). */
export function LoginTournamentShowcase({ className }: LoginTournamentShowcaseProps) {
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
          <h1 className="font-sans text-[1.65rem] font-bold leading-[1.12] tracking-tight text-white drop-shadow sm:text-3xl lg:text-[2.1rem]">
            La tua sala tornei TCG
          </h1>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/65 sm:text-[15px]">
            Accedi con le stesse credenziali Ebartex e entra nella stanza: tornei, mazzi e sfide
            ti aspettano.
          </p>
        </div>

        <ul className="flex flex-col">
          {PILLARS.map(({ key, label, title, description, accent }, i) => (
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
                <p className="mt-0.5 text-xs leading-snug text-white/55">{description}</p>
              </div>
            </li>
          ))}
        </ul>

        <div className="flex flex-col gap-2.5">
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-400/40 bg-gradient-to-r from-emerald-500/25 to-emerald-400/10 px-3 py-1 text-[11px] font-semibold text-emerald-50 shadow-[0_0_20px_rgba(52,211,153,0.18)]">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-300" />
            </span>
            Tornei attivi adesso
          </span>

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
    </div>
  );
}
