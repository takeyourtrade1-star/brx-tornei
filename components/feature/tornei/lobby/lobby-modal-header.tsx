import { X } from 'lucide-react';

interface LobbyModalHeaderProps {
  eyebrow: string;
  titleId: string;
  descriptionId: string;
  title: string;
  description: string;
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
  onClose,
  closeDisabled = false,
}: LobbyModalHeaderProps) {
  return (
    <header className="flex items-start justify-between gap-5 border-b border-white/10 px-5 py-5 sm:px-6">
      <div className="min-w-0">
        <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-primary">
          {eyebrow}
        </p>
        <h2
          id={titleId}
          className="mt-1.5 font-sans text-2xl font-black leading-tight tracking-tight text-white"
        >
          {title}
        </h2>
        <p
          id={descriptionId}
          className="mt-1.5 max-w-md text-sm font-medium leading-relaxed text-white/60"
        >
          {description}
        </p>
      </div>
      <button
        type="button"
        onClick={onClose}
        disabled={closeDisabled}
        aria-label="Chiudi"
        className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/15 bg-white/5 text-white/70 transition hover:border-white/25 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-40"
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </button>
    </header>
  );
}
