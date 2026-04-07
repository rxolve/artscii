const CHAR_MAPS: Record<string, Record<string, string>> = {
  bubble: Object.fromEntries([
    ...'abcdefghijklmnopqrstuvwxyz'.split('').map((c, i) => [c, String.fromCodePoint(0x24D0 + i)]),
    ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map((c, i) => [c, String.fromCodePoint(0x24B6 + i)]),
    ...'0123456789'.split('').map((c, i) => [c, i === 0 ? '\u24EA' : String.fromCodePoint(0x2460 + i - 1)]),
  ]),
  fullwidth: Object.fromEntries([
    ...' !\"#$%&\'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~'
      .split('').map((c) => [c, String.fromCodePoint(c.charCodeAt(0) - 0x20 + 0xFF00)]),
  ]),
  bold: Object.fromEntries([
    ...'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split('').map((c, i) => [
      c,
      i < 26
        ? String.fromCodePoint(0x1D400 + i)
        : String.fromCodePoint(0x1D41A + i - 26),
    ]),
    ...'0123456789'.split('').map((c, i) => [c, String.fromCodePoint(0x1D7CE + i)]),
  ]),
  italic: Object.fromEntries([
    ...'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split('').map((c, i) => {
      if (i === 7) return [c, '\u210E']; // lowercase h
      return [c, i < 26
        ? String.fromCodePoint(0x1D434 + i)
        : String.fromCodePoint(0x1D44E + i - 26)];
    }),
  ]),
  monospace: Object.fromEntries([
    ...'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split('').map((c, i) => [
      c,
      i < 26
        ? String.fromCodePoint(0x1D670 + i)
        : String.fromCodePoint(0x1D68A + i - 26),
    ]),
    ...'0123456789'.split('').map((c, i) => [c, String.fromCodePoint(0x1D7F6 + i)]),
  ]),
  smallcaps: Object.fromEntries(
    'abcdefghijklmnopqrstuvwxyz'.split('').map((c) => {
      const map: Record<string, string> = {
        a: '\u1D00', b: '\u0299', c: '\u1D04', d: '\u1D05', e: '\u1D07',
        f: '\uA730', g: '\u0262', h: '\u029C', i: '\u026A', j: '\u1D0A',
        k: '\u1D0B', l: '\u029F', m: '\u1D0D', n: '\u0274', o: '\u1D0F',
        p: '\u1D18', q: '\u01EB', r: '\u0280', s: '\uA731', t: '\u1D1B',
        u: '\u1D1C', v: '\u1D20', w: '\u1D21', x: '\u02E3', y: '\u028F',
        z: '\u1D22',
      };
      return [c, map[c]];
    })
  ),
};

const FLIP_MAP: Record<string, string> = {
  a: '\u0250', b: 'q', c: '\u0254', d: 'p', e: '\u01DD',
  f: '\u025F', g: '\u0183', h: '\u0265', i: '\u0131', j: '\u027E',
  k: '\u029E', l: 'l', m: '\u026F', n: 'u', o: 'o',
  p: 'd', q: 'b', r: '\u0279', s: 's', t: '\u0287',
  u: 'n', v: '\u028C', w: '\u028D', x: 'x', y: '\u028E',
  z: 'z',
  A: '\u2200', B: '\u1012', C: '\u0186', D: '\u15E1', E: '\u018E',
  F: '\u2132', G: '\u2141', H: 'H', I: 'I', J: '\u017F',
  K: '\u22CA', L: '\u2142', M: 'W', N: 'N', O: 'O',
  P: '\u0500', Q: '\u038C', R: '\u1D1A', S: 'S', T: '\u22A5',
  U: '\u2229', V: '\u039B', W: 'M', X: 'X', Y: '\u2144',
  Z: 'Z',
  '1': '\u0196', '2': '\u1105', '3': '\u0190', '4': '\u3123',
  '5': '\u03DB', '6': '9', '7': '\u3125', '8': '8', '9': '6', '0': '0',
  '.': '\u02D9', ',': '\'', '\'': ',', '"': '\u201E',
  '!': '\u00A1', '?': '\u00BF', '(': ')', ')': '(',
  '[': ']', ']': '[', '{': '}', '}': '{',
  '<': '>', '>': '<', '&': '\u214B', '_': '\u203E',
};

export type TextStyle =
  | 'bubble'
  | 'fullwidth'
  | 'bold'
  | 'italic'
  | 'monospace'
  | 'smallcaps'
  | 'upsidedown'
  | 'strikethrough';

export const TEXT_STYLES: TextStyle[] = [
  'bubble', 'fullwidth', 'bold', 'italic',
  'monospace', 'smallcaps', 'upsidedown', 'strikethrough',
];

export function styleText(text: string, style: TextStyle): string {
  switch (style) {
    case 'upsidedown':
      return [...text].reverse().map((c) => FLIP_MAP[c] ?? c).join('');

    case 'strikethrough':
      return [...text].map((c) => c + '\u0336').join('');

    default: {
      const map = CHAR_MAPS[style];
      if (!map) return text;
      return [...text].map((c) => map[c] ?? c).join('');
    }
  }
}
