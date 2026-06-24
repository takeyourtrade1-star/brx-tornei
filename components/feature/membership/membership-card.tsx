'use client';

import Image from 'next/image';
import { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { getCdnImageUrl } from '@/lib/config';
import { cardHolder, formatMemberSince, type MembershipCard } from '@/lib/membership/membership';
import { cn } from '@/lib/utils';

interface MembershipCardViewProps {
  card: MembershipCard;
  /** Abilita il tilt 3D al passaggio del mouse (desktop). */
  interactive?: boolean;
  className?: string;
}

const MAX_TILT = 9; // gradi

/**
 * Tessera "Associato" — sfondo aurora animato, sheen olografico, chip e QR.
 * Pensata per il reveal post-onboarding e per la vista profilo.
 */
export function MembershipCardView({ card, interactive = false, className }: MembershipCardViewProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!interactive) return;
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width - 0.5;
    const py = (event.clientY - rect.top) / rect.height - 0.5;
    el.style.transform = `perspective(1200px) rotateY(${px * MAX_TILT * 2}deg) rotateX(${-py * MAX_TILT * 2}deg)`;
    el.style.setProperty('--shine-x', `${(px + 0.5) * 100}%`);
    el.style.setProperty('--shine-y', `${(py + 0.5) * 100}%`);
  };

  const resetTilt = () => {
    const el = cardRef.current;
    if (el) el.style.transform = 'perspective(1200px) rotateY(0deg) rotateX(0deg)';
  };

  return (
    <div className={cn('w-full select-none [perspective:1200px]', className)}>
      <div
        ref={cardRef}
        onPointerMove={handlePointerMove}
        onPointerLeave={resetTilt}
        className={cn(
          'relative aspect-[1.586] w-full overflow-hidden rounded-[28px] p-[1.6px]',
          'shadow-[0_34px_80px_-24px_rgba(120,30,200,0.85)]',
          'transition-transform duration-200 ease-out will-change-transform'
        )}
      >
        {/* Anello esterno olografico animato (il bordo che ruota) */}
        <div
          className="tessera-border-spin absolute inset-[-45%]"
          aria-hidden
          style={{
            background:
              'conic-gradient(from 0deg, #ff2d92, #ffd23f, #3df0ff, #bb82ff, #ff7300, #ff2d92)',
          }}
        />

        {/* Carta interna */}
        <div className="relative h-full w-full overflow-hidden rounded-[26px]">
        {/* Base scura */}
        <div className="absolute inset-0 bg-[#160a36]" aria-hidden />

        {/* Aurora animata: blob colorati sfocati */}
        <div className="absolute inset-0 overflow-hidden" aria-hidden>
          <div
            className="tessera-aurora-b absolute right-[20%] top-[35%] h-[70%] w-[55%] rounded-full blur-3xl"
            style={{
              background: 'radial-gradient(circle, rgba(50,200,210,0.7) 0%, rgba(50,200,210,0) 70%)',
              animationDelay: '-5s',
            }}
          />
          <div
            className="tessera-aurora-a absolute left-[-20%] top-[-30%] h-[90%] w-[90%] rounded-full blur-3xl"
            style={{ background: 'radial-gradient(circle, rgba(187,130,255,0.95) 0%, rgba(187,130,255,0) 70%)' }}
          />
          <div
            className="tessera-aurora-b absolute right-[-25%] top-[-10%] h-[110%] w-[95%] rounded-full blur-3xl"
            style={{ background: 'radial-gradient(circle, rgba(255,45,146,0.9) 0%, rgba(255,45,146,0) 70%)' }}
          />
          <div
            className="tessera-aurora-c absolute bottom-[-40%] left-[10%] h-[110%] w-[90%] rounded-full blur-3xl"
            style={{ background: 'radial-gradient(circle, rgba(61,101,198,0.95) 0%, rgba(61,101,198,0) 70%)' }}
          />
          <div
            className="tessera-aurora-a absolute bottom-[-30%] right-[-10%] h-[80%] w-[70%] rounded-full blur-3xl"
            style={{
              background: 'radial-gradient(circle, rgba(255,115,0,0.8) 0%, rgba(255,115,0,0) 70%)',
              animationDelay: '-7s',
            }}
          />
        </div>

        {/* Sheen olografico rotante — mascherato al centro per evitare patch agli angoli */}
        <div
          className="tessera-holo absolute inset-[-30%] opacity-30 mix-blend-soft-light"
          aria-hidden
          style={{
            background:
              'conic-gradient(from 0deg, #ff2d92, #ffd23f, #3df0ff, #bb82ff, #ff7300, #ff2d92)',
            maskImage: 'radial-gradient(circle at 50% 45%, #000 30%, transparent 68%)',
            WebkitMaskImage: 'radial-gradient(circle at 50% 45%, #000 30%, transparent 68%)',
          }}
        />

        {/* Secondo strato olografico controrotante per profondità iridescente */}
        <div
          className="tessera-holo-rev absolute inset-[-30%] opacity-25 mix-blend-screen"
          aria-hidden
          style={{
            background:
              'conic-gradient(from 120deg, #3df0ff, #bb82ff, #ff2d92, #ffd23f, #3df0ff)',
            maskImage: 'radial-gradient(circle at 50% 55%, #000 20%, transparent 70%)',
            WebkitMaskImage: 'radial-gradient(circle at 50% 55%, #000 20%, transparent 70%)',
          }}
        />

        {/* Bagliore caldo pulsante in basso (profondità) */}
        <div
          className="tessera-glow-pulse pointer-events-none absolute -bottom-1/3 left-[-10%] h-[80%] w-[70%] rounded-full blur-3xl"
          aria-hidden
          style={{ background: 'radial-gradient(circle, rgba(255,170,90,0.5) 0%, rgba(255,170,90,0) 70%)' }}
        />

        {/* Velo per leggibilità del testo (più scuro in basso) */}
        <div
          className="absolute inset-0"
          aria-hidden
          style={{
            background:
              'linear-gradient(160deg, rgba(0,0,0,0.05) 0%, rgba(10,4,30,0.18) 45%, rgba(10,4,30,0.62) 100%)',
          }}
        />

        {/* Brillio diagonale che attraversa la tessera */}
        <div className="absolute inset-0 overflow-hidden" aria-hidden>
          <div
            className="tessera-shine absolute -inset-y-10 left-0 w-1/3"
            style={{
              background:
                'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.55) 50%, rgba(255,255,255,0) 100%)',
            }}
          />
        </div>

        {/* Gloss superiore: riflesso lucido curvo in alto */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-1/2"
          aria-hidden
          style={{
            background:
              'linear-gradient(180deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.05) 40%, rgba(255,255,255,0) 100%)',
          }}
        />

        {/* Glint scintillanti */}
        <div
          className="tessera-twinkle pointer-events-none absolute h-1 w-1 rounded-full bg-white"
          aria-hidden
          style={{ top: '20%', left: '58%', boxShadow: '0 0 7px 1px rgba(255,255,255,0.9)' }}
        />
        <div
          className="tessera-twinkle pointer-events-none absolute h-[3px] w-[3px] rounded-full bg-white"
          aria-hidden
          style={{ top: '64%', left: '40%', boxShadow: '0 0 6px 1px rgba(255,255,255,0.85)', animationDelay: '-1.6s' }}
        />
        <div
          className="tessera-twinkle pointer-events-none absolute h-1 w-1 rounded-full bg-white"
          aria-hidden
          style={{ top: '34%', left: '82%', boxShadow: '0 0 7px 1px rgba(255,255,255,0.9)', animationDelay: '-2.7s' }}
        />

        {/* Glare che segue il puntatore (solo desktop interattivo) */}
        {interactive ? (
          <div
            className="pointer-events-none absolute inset-0 mix-blend-screen"
            aria-hidden
            style={{
              background:
                'radial-gradient(circle at var(--shine-x, 50%) var(--shine-y, 0%), rgba(255,255,255,0.4) 0%, rgba(255,255,255,0) 45%)',
            }}
          />
        ) : null}

        {/* Bordo luminoso interno */}
        <div
          className="pointer-events-none absolute inset-0 rounded-[26px] ring-1 ring-inset ring-white/30"
          aria-hidden
          style={{ boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.5)' }}
        />

        {/* ─────────── Contenuto ─────────── */}
        <div className="relative z-10 flex h-full flex-col justify-between p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <Image
              src={getCdnImageUrl('Logo%20Principale%20EBARTEX.png')}
              alt="Ebartex"
              width={700}
              height={263}
              className="h-7 w-auto object-contain drop-shadow-[0_2px_6px_rgba(0,0,0,0.4)] sm:h-8"
              sizes="160px"
              unoptimized
            />
            <span className="rounded-full bg-white/15 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white shadow-sm ring-1 ring-white/30 backdrop-blur-sm">
              Associato
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Chip dorato stile carta */}
            <div
              className="h-7 w-10 shrink-0 rounded-[6px] ring-1 ring-amber-200/60 sm:h-8 sm:w-11"
              aria-hidden
              style={{
                background: 'linear-gradient(135deg, #fde68a 0%, #d4a017 45%, #fff3c4 60%, #b8860b 100%)',
              }}
            >
              <div className="mx-auto mt-1 h-[3px] w-7 rounded-full bg-amber-900/25" />
              <div className="mx-auto mt-1 h-[3px] w-6 rounded-full bg-amber-900/25" />
            </div>
            <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/70">
              {card.tier}
            </span>
          </div>

          <div className="flex items-end justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-white/60">
                Titolare
              </p>
              <p className="truncate font-sans text-xl font-bold leading-tight tracking-tight text-white drop-shadow sm:text-2xl">
                {cardHolder(card)}
              </p>
              <p className="mt-1 font-mono text-[11px] tracking-[0.18em] text-white/80 sm:text-xs">
                {card.serial}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[10px] text-white/70 sm:text-[11px]">
                <span>
                  <span className="text-white/45">Socio dal </span>
                  {formatMemberSince(card.memberSince)}
                </span>
                {card.club ? (
                  <span className="truncate">
                    <span className="text-white/45">Circolo </span>
                    {card.club}
                  </span>
                ) : null}
              </div>
            </div>

            {/* QR della tessera */}
            <div className="shrink-0 rounded-xl bg-white/90 p-1.5 shadow-lg ring-1 ring-white/40">
              <QRCodeSVG
                value={card.code}
                size={56}
                bgColor="transparent"
                fgColor="#160a36"
                level="M"
                className="block"
              />
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
