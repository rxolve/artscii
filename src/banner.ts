import figlet from 'figlet';

export const BANNER_FONTS = ['Standard', 'Small', 'Slant', 'Big', 'Mini'] as const;
export type BannerFont = (typeof BANNER_FONTS)[number];

export function renderBanner(text: string, font: BannerFont = 'Standard'): string {
  return figlet.textSync(text, { font });
}

export function listBannerFonts(): { name: BannerFont; description: string }[] {
  return [
    { name: 'Standard', description: 'Default balanced font' },
    { name: 'Small', description: 'Compact, saves tokens' },
    { name: 'Slant', description: 'Italic style' },
    { name: 'Big', description: 'Bold emphasis' },
    { name: 'Mini', description: 'Minimal 3-line font' },
  ];
}
