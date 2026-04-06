import { describe, it, expect } from 'vitest';
import { renderBanner, listBannerFonts, BANNER_FONTS } from './banner.js';

describe('renderBanner', () => {
  it('renders text as ASCII banner', () => {
    const out = renderBanner('Hi');
    expect(out).toBeTruthy();
    expect(out.split('\n').length).toBeGreaterThan(1);
  });

  it('renders with each font without throwing', () => {
    for (const font of BANNER_FONTS) {
      expect(() => renderBanner('Test', font)).not.toThrow();
    }
  });
});

describe('listBannerFonts', () => {
  it('returns all 5 fonts', () => {
    const fonts = listBannerFonts();
    expect(fonts).toHaveLength(5);
    expect(fonts.map((f) => f.name)).toEqual([...BANNER_FONTS]);
  });

  it('each font has name and description', () => {
    for (const f of listBannerFonts()) {
      expect(f.name).toBeTruthy();
      expect(f.description).toBeTruthy();
    }
  });
});
