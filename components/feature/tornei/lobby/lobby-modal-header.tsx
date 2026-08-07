import { X } from 'lucide-react';

interface LobbyModalHeaderProps {
  eyebrow: string;
  titleId: string;
  descriptionId: string;
  title: string;
  description: string;
  meta?: string[];
  onClose: () => void;
  closeDisabled?: boolean;
}

/** Testata condivisa dai modali del flusso lobby. */
export function LobbyModalHeader({
  eyebrow,
  titleId,
  descriptionId,
  title,
  description,
  meta,
  onClose,
  closeDisabled = false,
}: LobbyModalHeaderProps) {
  return (
    <header className="flex items-start justify-between gap-5 border-b border-slate-900/[0.06] px-6 py-5 sm:px-7">
      <div className="min-w-0">
        <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-primary">
          {eyebrow}
        </p>
        <h2
          id={titleId}
          className="mt-1.5 font-sans text-2xl font-black leading-tight tracking-tight text-header-bg"
        >
          {title}
        </h2>
        <p
          id={descriptionId}
          className="mt-1.5 max-w-md text-sm font-medium leading-relaxed text-slate-500"
        >
          {description}
        </p>
        {meta && meta.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2" aria-label="Dettagli del tavolo">
            {meta.map((item) => (
              <span
                key={item}
                className="rounded-full border border-slate-900/[0.08] bg-slate-50 px-2.5 py-1.5 text-[8px] font-black uppercase tracking-[0.08em] text-slate-500 sm:px-3 sm:text-[9px]"
              >
                {item}
              </span>
            ))}
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={onClose}
        disabled={closeDisabled}
        aria-label="Chiudi"
        className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-slate-900/[0.1] bg-white text-slate-400 shadow-sm transition hover:border-slate-900/20 hover:text-header-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-40"
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </button>
    </header>
  );
}
