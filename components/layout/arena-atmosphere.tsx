/** Brace dell'arena: particelle fluttuanti con ritmo bilanciato. */
const EMBERS = [
  { left: '8%', delay: '0s', duration: '9s', size: 'h-1 w-1', color: 'bg-primary/80' },
  { left: '20%', delay: '2.5s', duration: '11s', size: 'h-[3px] w-[3px]', color: 'bg-marquee/70' },
  { left: '38%', delay: '1.2s', duration: '8.5s', size: 'h-1.5 w-1.5', color: 'bg-primary/60' },
  { left: '55%', delay: '4.8s', duration: '10s', size: 'h-[3px] w-[3px]', color: 'bg-marquee/80' },
  { left: '72%', delay: '1.8s', duration: '11.5s', size: 'h-1 w-1', color: 'bg-primary/70' },
  { left: '88%', delay: '3.4s', duration: '9.5s', size: 'h-1.5 w-1.5', color: 'bg-marquee/60' },
];

/** Texture d'atmosfera condivisa: glow, griglia e brace. */
export function ArenaAtmosphere() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(800px_350px_at_15%_0%,rgba(255,115,0,0.10),transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(900px_400px_at_85%_10%,rgba(243,199,106,0.07),transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(1000px_500px_at_50%_100%,rgba(255,115,0,0.06),transparent_65%)]" />
      <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] [background-size:40px_40px] [mask-image:radial-gradient(circle_at_50%_30%,black,transparent_75%)]" />
      {EMBERS.map((ember, index) => (
        <span
          key={index}
          className={`pt-ember ${ember.size} ${ember.color}`}
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
