import sharp from 'sharp';

const ASCII_RAMP = ' .:-=+*#%@';
const RAMP_LEN = ASCII_RAMP.length - 1;

export interface ConvertOptions {
  width?: number;
  height?: number;
  invert?: boolean;
  contrast?: boolean;
  gamma?: number;
}

export async function convertImage(
  input: Buffer,
  opts: ConvertOptions = {},
): Promise<string> {
  const maxW = opts.width ?? 64;
  const maxH = opts.height ?? 32;
  const invert = opts.invert ?? false;
  const contrast = opts.contrast ?? true;
  const gamma = opts.gamma ?? 1.0;

  const instance = sharp(input);
  const metadata = await instance.metadata();
  const origW = metadata.width ?? maxW;
  const origH = metadata.height ?? maxH;
  const aspect = origH / origW;

  let newW = maxW;
  let newH = Math.floor(newW * aspect * 0.5);

  if (newH > maxH) {
    newH = maxH;
    newW = Math.floor(newH / aspect * 2);
  }

  newW = Math.max(newW, 1);
  newH = Math.max(newH, 1);

  let pipeline = instance.flatten({ background: '#ffffff' }).grayscale();

  if (contrast) {
    pipeline = pipeline.normalise();
  }

  const { data } = await pipeline
    .resize(newW, newH, { fit: 'fill', kernel: 'lanczos3' })
    .raw()
    .toBuffer({ resolveWithObject: true });

  const lines: string[] = [];
  for (let y = 0; y < newH; y++) {
    let row = '';
    for (let x = 0; x < newW; x++) {
      let brightness = data[y * newW + x];
      if (invert) {
        brightness = 255 - brightness;
      }
      const normalized = Math.pow(brightness / 255, gamma);
      const idx = Math.min(Math.floor(normalized * RAMP_LEN), RAMP_LEN);
      row += ASCII_RAMP[idx];
    }
    lines.push(row.trimEnd());
  }

  while (lines.length > 0 && lines[lines.length - 1].trim() === '') {
    lines.pop();
  }

  return lines.join('\n');
}
