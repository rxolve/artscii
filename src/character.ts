// --- Types ---

export const SPECIES = ['blob', 'cat', 'bear', 'robot', 'bird', 'bunny', 'ghost', 'alien', 'fox', 'frog', 'penguin', 'octopus', 'dragon', 'mushroom', 'cactus', 'skull'] as const;
export const EYES = ['dot', 'round', 'wide', 'wink', 'happy', 'star', 'x', 'at', 'dash', 'asym'] as const;
export const MOUTHS = ['smile', 'grin', 'open', 'flat', 'cat', 'teeth', 'tongue', 'zigzag'] as const;
export const HATS = ['none', 'tophat', 'crown', 'party', 'cap', 'beanie', 'antenna', 'bow', 'halo', 'headband'] as const;
export const ACCESSORIES = ['none', 'bowtie', 'scarf', 'sword', 'shield', 'tail', 'glasses', 'cape', 'wings', 'staff', 'bag', 'flower'] as const;
export const MOODS = ['happy', 'sad', 'angry', 'surprised', 'sleepy', 'cool', 'love', 'silly'] as const;
export const SIZES = ['mini', 'standard'] as const;

export type Species = (typeof SPECIES)[number];
export type Eyes = (typeof EYES)[number];
export type Mouth = (typeof MOUTHS)[number];
export type Hat = (typeof HATS)[number];
export type Accessory = (typeof ACCESSORIES)[number];
export type Mood = (typeof MOODS)[number];
export type CharacterSize = (typeof SIZES)[number];

export interface CharacterOptions {
  seed: string;
  species?: Species;
  eyes?: Eyes;
  mouth?: Mouth;
  hat?: Hat;
  accessory?: Accessory;
  mood?: Mood;
  size?: CharacterSize;
}

// --- FNV-1a 32-bit hash (no dependencies, deterministic) ---

export function hashSeed(seed: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0; // unsigned 32-bit
}

// --- Slot-independent selection via bit rotation + golden ratio mixing ---

export function selectIndex(hash: number, slot: number, count: number): number {
  // Rotate bits by slot * 7 to decorrelate slots
  const rotation = (slot * 7) % 32;
  const rotated = ((hash << rotation) | (hash >>> (32 - rotation))) >>> 0;
  // Golden ratio mixing
  const mixed = Math.imul(rotated, 0x9e3779b9) >>> 0;
  return mixed % count;
}

// --- Part Data ---

const BODY_TEMPLATES: Record<Species, string[]> = {
  blob: [
    '     ___   ',
    '    / L R \\  ',
    '   |   M   | ',
    '   |       | ',
    '    \\_____/  ',
  ],
  cat: [
    '    /\\_/\\   ',
    '   ( L R )  ',
    '   ( M )  ',
    '    \\_^_/   ',
  ],
  bear: [
    ' ʕ·͡·͡ʔ     ',
    '  /  L R  \\ ',
    ' |    M    |',
    '  \\  ___  / ',
    '   |     |  ',
  ],
  robot: [
    '  ┌─────┐  ',
    '  │ L R │  ',
    '  │  M  │  ',
    '  └──┬──┘  ',
    '  ┌──┴──┐  ',
    '  │     │  ',
    '  └─────┘  ',
  ],
  bird: [
    '    \\\\      ',
    '    (L R)   ',
    '    ( M )   ',
    '   / | \\    ',
    '  ~  |  ~   ',
  ],
  bunny: [
    '   (\\(\\    ',
    '   ( L R)  ',
    '   ( M  )  ',
    '   o(\")(\")',
  ],
  ghost: [
    '    .-.    ',
    '   ( L R ) ',
    '   |  M  | ',
    '   |     | ',
    '   ^^^\"^^^ ',
  ],
  alien: [
    '   .===.   ',
    '  / L R \\  ',
    ' |   M   | ',
    '  \\_=^=_/  ',
    '   /| |\\   ',
  ],
  fox: [
    '   /\\  /\\  ',
    '  / L  R \\ ',
    ' (    M   )',
    '  \\  __  / ',
    '   \\/ \\/   ',
  ],
  frog: [
    '  @L  @R   ',
    '  /`----`\\ ',
    ' (   M    )',
    '  \\      / ',
    '   `----`  ',
  ],
  penguin: [
    '    ___    ',
    '  /(L R)\\ ',
    '  | (M) | ',
    '  |\\  /|  ',
    '   \\ /    ',
    '    V     ',
  ],
  octopus: [
    '   ,---,   ',
    '  ( L R )  ',
    '   ( M )   ',
    '  /|||||\\  ',
    ' ~ ~ ~ ~ ~ ',
  ],
  dragon: [
    '   /\\_     ',
    '  / L R>   ',
    ' <   M  )  ',
    '  \\_/|_/   ',
    '    / \\    ',
  ],
  mushroom: [
    '  .-----.  ',
    ' / L   R \\ ',
    '(----M----)' ,
    '   |   |   ',
    '   |___|   ',
  ],
  cactus: [
    '    |      ',
    '   /L R\\   ',
    '--|  M  |  ',
    '  |     |--',
    '  |     |  ',
    '   \\___/   ',
  ],
  skull: [
    '  _____    ',
    ' / L R \\   ',
    '|   M   |  ',
    ' \\_____/   ',
    '  |||||    ',
  ],
};

const MINI_TEMPLATES: Record<Species, string[]> = {
  blob:     [' (L R) ', '  (M)  '],
  cat:      ['/L R\\', ' >M< '],
  bear:     ['(L R)', ' {M} '],
  robot:    ['[L R]', ' [M] '],
  bird:     ['>L R<', ' (M) '],
  bunny:    ['(\\L R/)', '  (M)  '],
  ghost:    ['(L R)', ' ~M~ '],
  alien:    ['{L R}', ' =M= '],
  fox:      ['/L R\\', ' (M) '],
  frog:     ['@L R@', ' (M) '],
  penguin:  ['(L R)', ' <M> '],
  octopus:  ['~L R~', ' (M) '],
  dragon:   ['<L R>', ' (M) '],
  mushroom: ['.L R.', ' |M| '],
  cactus:   ['|L R|', ' |M| '],
  skull:    ['(L R)', ' |M| '],
};

const EYE_PARTS: Record<Eyes, [string, string]> = {
  dot:   ['·', '·'],
  round: ['o', 'o'],
  wide:  ['O', 'O'],
  wink:  ['^', '-'],
  happy: ['^', '^'],
  star:  ['*', '*'],
  x:     ['x', 'x'],
  at:    ['@', '@'],
  dash:  ['-', '-'],
  asym:  ['o', 'O'],
};

const MOUTH_PARTS: Record<Mouth, string> = {
  smile:  'u',
  grin:   'D',
  open:   'O',
  flat:   '-',
  cat:    'w',
  teeth:  'E',
  tongue: 'P',
  zigzag: 'z',
};

const MOOD_MAP: Record<Mood, { eyes: Eyes; mouth: Mouth }> = {
  happy:     { eyes: 'happy',  mouth: 'smile' },
  sad:       { eyes: 'dot',    mouth: 'flat' },
  angry:     { eyes: 'x',      mouth: 'zigzag' },
  surprised: { eyes: 'wide',   mouth: 'open' },
  sleepy:    { eyes: 'dash',   mouth: 'flat' },
  cool:      { eyes: 'dash',   mouth: 'grin' },
  love:      { eyes: 'star',   mouth: 'smile' },
  silly:     { eyes: 'asym',   mouth: 'tongue' },
};

const HAT_PARTS: Record<Hat, string[]> = {
  none: [],
  tophat: [
    '   ___   ',
    '  |   |  ',
    '  |___|  ',
  ],
  crown: [
    '  /\\/\\/\\  ',
    '  |    |  ',
  ],
  party: [
    '     *    ',
    '    /|    ',
    '   / |    ',
  ],
  cap: [
    '   ____   ',
    '  ]==== )  ',
  ],
  beanie: [
    '    ()    ',
    '   /  \\   ',
  ],
  antenna: [
    '    o     ',
    '    |     ',
  ],
  bow: [
    '  >===<   ',
  ],
  halo: [
    '   ****   ',
    '  *    *  ',
    '   ****   ',
  ],
  headband: [
    ' ~~~~~~~  ',
  ],
};

const ACCESSORY_PARTS: Record<Accessory, { position: 'below' | 'left' | 'right'; lines: string[] }> = {
  none:   { position: 'below', lines: [] },
  bowtie: { position: 'below', lines: ['    {=}    '] },
  scarf:  { position: 'below', lines: ['  ~~~~~~   ', '   \\\\\\\\   '] },
  sword:  { position: 'right', lines: ['  /', ' /==|', '  \\'] },
  shield: { position: 'left',  lines: ['  ]', ' [==]', '  ]'] },
  tail:    { position: 'right', lines: ['', '', '   ~', '    ~~'] },
  glasses: { position: 'below', lines: ['   ~~o=o~~ '] },
  cape:    { position: 'below', lines: ['  \\|||||/  ', '   \\|||/   ', '    \\|/    '] },
  wings:   { position: 'right', lines: ['  ))', ' ))', '  ))'] },
  staff:   { position: 'left',  lines: ['   |', '   |', '   |', '   O'] },
  bag:     { position: 'right', lines: ['', '', ' [_]'] },
  flower:  { position: 'right', lines: [' @}->--'] },
};

// --- Composition ---

function replaceMarkers(template: string[], leftEye: string, rightEye: string, mouth: string): string[] {
  return template.map(line =>
    line.replace('L', leftEye).replace('R', rightEye).replace('M', mouth)
  );
}

function prependLines(hat: string[], body: string[]): string[] {
  if (hat.length === 0) return body;
  return [...hat, ...body];
}

function attachAccessory(body: string[], acc: { position: 'below' | 'left' | 'right'; lines: string[] }): string[] {
  if (acc.lines.length === 0) return body;

  if (acc.position === 'below') {
    return [...body, ...acc.lines];
  }

  if (acc.position === 'right') {
    const result: string[] = [];
    const maxLen = Math.max(body.length, acc.lines.length);
    const bodyWidth = Math.max(...body.map(l => l.length), 0);
    for (let i = 0; i < maxLen; i++) {
      const bLine = i < body.length ? body[i].padEnd(bodyWidth) : ' '.repeat(bodyWidth);
      const aLine = i < acc.lines.length ? acc.lines[i] : '';
      result.push(bLine + aLine);
    }
    return result;
  }

  // left
  const result: string[] = [];
  const maxLen = Math.max(body.length, acc.lines.length);
  const accWidth = Math.max(...acc.lines.map(l => l.length), 0);
  for (let i = 0; i < maxLen; i++) {
    const aLine = i < acc.lines.length ? acc.lines[i].padStart(accWidth) : ' '.repeat(accWidth);
    const bLine = i < body.length ? body[i] : '';
    result.push(aLine + bLine);
  }
  return result;
}

// --- Main API ---

export function generateCharacter(options: CharacterOptions): string {
  const hash = hashSeed(options.seed);
  const size = options.size ?? 'standard';

  // Mood sets eyes+mouth defaults (explicit eyes/mouth still override)
  const moodPreset = options.mood ? MOOD_MAP[options.mood] : undefined;

  const species = options.species ?? SPECIES[selectIndex(hash, 0, SPECIES.length)];
  const eyes = options.eyes ?? moodPreset?.eyes ?? EYES[selectIndex(hash, 1, EYES.length)];
  const mouth = options.mouth ?? moodPreset?.mouth ?? MOUTHS[selectIndex(hash, 2, MOUTHS.length)];

  // 1. Get body template (copy)
  const templates = size === 'mini' ? MINI_TEMPLATES : BODY_TEMPLATES;
  const bodyTemplate = [...templates[species]];

  // 2. Replace eye/mouth markers
  const [leftEye, rightEye] = EYE_PARTS[eyes];
  const mouthChar = MOUTH_PARTS[mouth];
  const body = replaceMarkers(bodyTemplate, leftEye, rightEye, mouthChar);

  // Mini: no hat/accessory — return immediately
  if (size === 'mini') {
    return body.join('\n');
  }

  const hat = options.hat ?? HATS[selectIndex(hash, 3, HATS.length)];
  const accessory = options.accessory ?? ACCESSORIES[selectIndex(hash, 4, ACCESSORIES.length)];

  // 3. Prepend hat
  const hatLines = HAT_PARTS[hat];
  const withHat = prependLines(hatLines, body);

  // 4. Attach accessory
  const final = attachAccessory(withHat, ACCESSORY_PARTS[accessory]);

  return final.join('\n');
}
