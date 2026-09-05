import { describe, expect, it, vi } from 'vitest';

const scene = vi.hoisted(() => ({
  dayPhase: vi.fn(() => ({ id: 'dusk' })),
  buildBackground: vi.fn(() => ({ art: 'club-al-tramonto' })),
  buildPiazzaBackground: vi.fn(() => ({ art: 'terrazza-al-tramonto' })),
}));
vi.mock('../../minigioco-test/world-engine/dependencies', () => scene);
import { updateAmbience } from '../../minigioco-test/world-engine/update-ambience';

describe('illuminazione al cambio del giorno', () => {
  it.each(['tournament', 'piazza'])('aggiorna la scena %s e conserva la Sala Tornei', (room) => {
    const engine = {
      st: { room, t: 31, phaseCheck: 30, nextPetInteraction: Infinity },
      phase: { id: 'day' }, stats: {}, posters: null,
      tourData: { bg: { art: 'club-giorno' } }, bg: { art: 'giorno' }, piazzaBg: null,
    };
    updateAmbience(engine, { isTour: room === 'tournament' });
    expect(engine.phase.id).toBe('dusk');
    expect(engine.tourData.bg.art).toBe('club-al-tramonto');
    expect(engine.bg.art).toBe(room === 'piazza' ? 'terrazza-al-tramonto' : 'club-al-tramonto');
    expect(engine.st.phaseCheck).toBe(61);
  });
});
