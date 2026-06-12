/** Formattazione data/ora per UI partite (it-IT). */
export function formatMatchDateTime(iso: string): string {
  return new Intl.DateTimeFormat('it-IT', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}
