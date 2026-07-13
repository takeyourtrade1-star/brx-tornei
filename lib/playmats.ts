export const PLAYMATS = [
  { id: 'ember-foundry', name: 'Forgia Ardente', src: '/images/playmats/ember-foundry.webp' },
  { id: 'tidal-archive', name: 'Archivio Sommerso', src: '/images/playmats/tidal-archive.webp' },
  { id: 'verdant-sanctum', name: 'Santuario Verde', src: '/images/playmats/verdant-sanctum.webp' },
  { id: 'astral-observatory', name: 'Osservatorio Astrale', src: '/images/playmats/astral-observatory.webp' },
  { id: 'ivory-citadel', name: 'Cittadella d\u2019Avorio', src: '/images/playmats/ivory-citadel.webp' },
  { id: 'neon-necropolis', name: 'Necropoli Neon', src: '/images/playmats/neon-necropolis.webp' },
] as const;

export type PlaymatId = (typeof PLAYMATS)[number]['id'];

export function getPlaymat(id: PlaymatId) {
  return PLAYMATS.find((playmat) => playmat.id === id) ?? PLAYMATS[0];
}
