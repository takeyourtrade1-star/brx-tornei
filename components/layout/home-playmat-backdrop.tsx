import { getPlaymat, type PlaymatId } from '@/lib/playmats';

interface HomePlaymatBackdropProps {
  playmatId: PlaymatId | null;
}

/** Sfondo personalizzato della home: resta separato dall'arena fullscreen. */
export function HomePlaymatBackdrop({ playmatId }: HomePlaymatBackdropProps) {
  if (!playmatId) return null;

  const playmat = getPlaymat(playmatId);

  return (
    <div aria-hidden className="home-playmat-backdrop">
      <div
        className="home-playmat-backdrop-image"
        style={{ backgroundImage: 'url(' + playmat.src + ')' }}
      />
      <div className="home-playmat-backdrop-overlay" />
    </div>
  );
}
