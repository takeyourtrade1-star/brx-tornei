import { beforeEach, describe, expect, it, vi } from 'vitest';
import { drawSceneActors } from '../../minigioco-test/high-detail/scene-actors';
import { drawDetailedCharacter, drawDetailedPet } from '../../minigioco-test/high-detail/character';
import { drawFurnitureMotion } from '../../minigioco-test/high-detail/furniture-motion';
import { installPetDog } from '../../minigioco-test/world-engine/pet-dog';

vi.mock('../../minigioco-test/high-detail/character', () => ({ drawDetailedCharacter: vi.fn(), drawDetailedPet: vi.fn() }));
vi.mock('../../minigioco-test/high-detail/scene-cache', () => ({ drawDetailedLayer: vi.fn() }));
vi.mock('../../minigioco-test/high-detail/furniture-motion', () => ({ drawFurnitureMotion: vi.fn() }));
vi.mock('../../minigioco-test/social-room/piazza-remote-player-presentation', () => ({
  isRemotePlayerMoving: (value: { nextStep: unknown }) => Boolean(value.nextStep), drawRemotePlayerAnnotations: vi.fn(),
}));

function fixture(reducedMotion = false) {
  const pet = { fx: 4, fy: 6, dir: 'nw', state: 'sleep', to: null, perch: null, lastPet: 9 };
  const turn = { key: 'turn', minX: 10, maxX: 10, minY: 0, maxY: 0, inter: null };
  return {
    fx: { reducedMotion }, currentLook: { hair: 'm3', outfit: 'tank' },
    entities: [turn], remotePlayers: new Map(), sfx: { musicOn: () => true },
    petFootPoint: () => ({ x: 102, y: 215, perched: false }),
    st: { t: 10, room: 'tournament', afk: false, ghost: null, tut: { active: false }, nearObj: null,
      cat: { ...pet }, dog: { ...pet, dir: 'se', state: 'sit', lastPet: -99 },
      av: { fx: 5, fy: 6, dir: 'sw', to: { cx: 5, cy: 7 }, seated: false, wt: 8.5, blinkUntil: 0 },
    },
  };
}

beforeEach(() => vi.clearAllMocks());

describe('animazioni collegate allo stato di Asso World', () => {
  it('disegna direzione, riposo e carezza reali degli animali', () => {
    drawSceneActors(fixture(), { furniture: new Map() }, {});
    expect(drawDetailedPet).toHaveBeenCalledWith({}, expect.objectContaining({ type: 'cat', x: 102, y: 215, direction: 'nw', mode: 'sleep', petted: true }));
    expect(drawDetailedPet).toHaveBeenCalledWith({}, expect.objectContaining({ type: 'dog', direction: 'se', mode: 'sit', petted: false }));
  });

  it('mantiene la fase del passo locale e anima il giradischi solo con la musica', () => {
    const engine = fixture();
    drawSceneActors(engine, { furniture: new Map() }, {});
    expect(drawDetailedCharacter).toHaveBeenCalledWith({}, expect.objectContaining({ walking: true, motionTime: 1, time: 10 }));
    expect(drawFurnitureMotion).toHaveBeenLastCalledWith({}, 'tournament', engine.entities[0], 10, expect.objectContaining({ active: true }));
    engine.sfx.musicOn = () => false;
    drawSceneActors(engine, { furniture: new Map() }, {});
    expect(drawFurnitureMotion).toHaveBeenLastCalledWith({}, 'tournament', engine.entities[0], 10, expect.objectContaining({ active: false }));
  });

  it('inoltra il movimento ridotto ad avatar, animali e arredi senza perdere la posa', () => {
    drawSceneActors(fixture(true), { furniture: new Map() }, {});
    expect(drawDetailedCharacter).toHaveBeenCalledWith({}, expect.objectContaining({ reducedMotion: true, time: 0, direction: 'sw' }));
    expect(drawDetailedPet).toHaveBeenCalledWith({}, expect.objectContaining({ reducedMotion: true, time: 0, mode: 'sleep' }));
    expect(drawFurnitureMotion).toHaveBeenCalledWith({}, 'tournament', expect.any(Object), 0, expect.objectContaining({ reducedMotion: true }));
  });

  it('appoggia il bacino dettagliato sulla sedia e sul tappeto senza il vecchio offset degli sprite', () => {
    const engine = fixture();
    const seated = { ...engine.st.av, to: null, seated: true };
    drawSceneActors({ ...engine, st: { ...engine.st, av: seated } }, { furniture: new Map() }, {});
    expect(drawDetailedCharacter).toHaveBeenLastCalledWith({}, expect.objectContaining({ seated: true, y: 342 }));
    drawSceneActors({ ...engine, st: { ...engine.st, afk: true, av: seated } }, { furniture: new Map() }, {});
    expect(drawDetailedCharacter).toHaveBeenLastCalledWith({}, expect.objectContaining({ seated: true, y: 354 }));
  });

  it('registra la carezza del cane per mostrarne la reazione e rispettarne la pausa', () => {
    const dog = { state: 'sit', until: 0, pets: 0, lastPet: -99, perch: null, to: null, pendingChairAt: null };
    const engine = { st: { t: 42, dog }, sfx: { pant: vi.fn() }, petFootPoint: () => ({ x: 0, y: 0 }), spawnFx: vi.fn(), petDog: () => {} };
    installPetDog(engine); engine.petDog();
    expect(dog.lastPet).toBe(42);
    expect(dog.pets).toBe(1);
  });
});
