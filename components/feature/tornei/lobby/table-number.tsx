interface TableNumberProps {
  number: number;
}

/** Targhetta comune a tavoli liberi, aperti e in partita. */
export function TableNumber({ number }: TableNumberProps) {
  return (
    <span className="flex min-w-16 shrink-0 flex-col items-center justify-center self-start rounded-xl border border-primary/30 bg-primary/10 px-3 py-2 text-white">
      <span className="text-[8px] font-black uppercase tracking-[0.16em] text-primary">Tavolo</span>
      <span className="font-sans text-3xl font-black leading-none tracking-tight tabular-nums">
        {String(number).padStart(2, '0')}
      </span>
    </span>
  );
}
