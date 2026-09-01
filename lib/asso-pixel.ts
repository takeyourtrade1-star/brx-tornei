/*
 * Source of truth dello sprite Asso della Sala Arcade.
 * La griglia viene usata sia dal canvas del minigioco sia dai piccoli
 * componenti React che devono restare coerenti con l'avatar arcade.
 */
export const ASSO_GW = 18;
export const ASSO_GH = 22;

export const ASSO_GRID = [
  '........y.........',
  '..b............g..',
  '....DDDDDDDDDD....',
  '...DllllllllllD...',
  '...DloooooooolD...',
  '...DOCCCCCCCCOD...',
  '...DOCCCCCCCCOD...',
  '...DOCCCCCCCCOD...',
  '...DOCWECCWECOD...',
  '...DOCEECCEECOD...',
  '...DOBCCCCCCBOD...',
  '...DOCCMCCMCCOD...',
  '...DOCCCMMCCCOD...',
  '...DOCCCCCCCCOD...',
  '...DOOOOOOOOOOD...',
  '...DOOPPPPPPOOD...',
  '...DOOPPPPPPOOD...',
  '...DHHHHHHHHHHD...',
  '....DDDDDDDDDD....',
  '.....kkkkkkkk.....',
  '..................',
  '..................',
] as const;

/** Solo i pixel del corpo; occhi, scintille e ombra sono disegnati a parte. */
export const ASSO_BODY_COL = {
  D: '#d24e00',
  l: '#ffd2a0',
  o: '#ffb066',
  O: '#ff8418',
  H: '#ef6c00',
  C: '#fff6ec',
  M: '#4a5548',
  B: '#ffab84',
  P: '#fff1db',
} as const;

export const ASSO_ACCENTS = {
  sparkleGold: '#ffd24a',
  sparkleBlue: '#5ab0ff',
  sparkleMint: '#5ad6a6',
  shadow: 'rgba(0,0,0,0.15)',
  hammer: '#f2b94b',
  hammerDark: '#8f5b20',
} as const;

export const ASSO_EYE_CELLS = [
  { x: 6, y: 8, w: true },
  { x: 7, y: 8 },
  { x: 10, y: 8, w: true },
  { x: 11, y: 8 },
  { x: 6, y: 9 },
  { x: 7, y: 9 },
  { x: 10, y: 9 },
  { x: 11, y: 9 },
] as const;
