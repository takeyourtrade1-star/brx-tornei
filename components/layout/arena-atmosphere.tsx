/** Brace e scintille: ritmo e deriva diversi così l'arena non pulsa a tempo. */
const EMBERS = [
  { left: '6%', delay: '0s', duration: '8.5s', size: 'h-1 w-1', color: 'bg-primary/85', glow: true, drift: 'arena-ember--right' },
  { left: '42%', delay: '0.8s', duration: '8.8s', size: 'h-[4px] w-[4px]', color: 'bg-marquee/80', glow: true, drift: 'arena-ember--left' },
  { left: '68%', delay: '6s', duration: '10.8s', size: 'h-[3px] w-[3px]', color: 'bg-primary/75', glow: false, drift: 'arena-ember--left' },
  { left: '84%', delay: '3.8s', duration: '11.4s', size: 'h-[4px] w-[4px]', color: 'bg-orange-300/70', glow: true, drift: 'arena-ember--left' },
] as const;

const WISPS = [
  { left: '12%', delay: '0s', duration: '6.5s', tall: true },
  { left: '82%', delay: '0.6s', duration: '7.8s', tall: true },
];

/** Texture d'atmosfera: focolare 3D, fasci, brace e lingue di calore. */
export function ArenaAtmosphere() {
  return (
    <div aria-hidden className="arena-atmosphere pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div className="arena-vignette" />
      <div className="arena-floor" />
      <div className="arena-hearth" />
      <div className="arena-shaft arena-shaft--left" />
      <div className="arena-shaft arena-shaft--right" />
      <div className="arena-orb arena-orb--gold" />
      <div className="arena-orb arena-orb--ember" />
      <div className="absolute inset-0 opacity-[0.16] [background-image:linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:48px_48px] [mask-image:radial-gradient(ellipse_at_50%_28%,black,transparent_72%)]" />
      {WISPS.map((wisp, index) => (
        <span
          key={`wisp-${index}`}
          className={`arena-wisp ${wisp.tall ? 'arena-wisp--tall' : ''}`}
          style={{
            left: wisp.left,
            animationDelay: wisp.delay,
            animationDuration: wisp.duration,
          }}
        />
      ))}
      {EMBERS.map((ember, index) => (
        <span
          key={`ember-${index}`}
          className={`pt-ember ${ember.size} ${ember.color} ${ember.drift} ${ember.glow ? 'arena-ember-glow' : ''}`}
          style={{
            left: ember.left,
            animationDelay: ember.delay,
            animationDuration: ember.duration,
          }}
        />
      ))}
    </div>
  );
}
