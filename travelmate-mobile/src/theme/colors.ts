/**
 * Fryndo design system — color tokens.
 * Source of truth: claude.ai/design "Mobile app design brief" (Fryndo App.dc.html).
 */

export const palette = {
  // Brand
  primary: '#4A3AFF',
  primarySoft: '#ECEBFF',
  primaryDark: '#8E7BFF', // dark-mode primary; content on it is ink, not white

  // Ink / text
  ink: '#101014',
  textSecondary: '#4A4A55',
  textTertiary: '#74747F',
  textMuted: '#8A8A95',
  placeholder: '#9A9AA4',
  disabled: '#C6C5C0',

  // Surfaces (light)
  background: '#FFFFFF',
  backgroundAlt: '#FAFAF8',
  surface: '#F5F4F1',
  surfaceAlt: '#F0EFEB',
  hairline: '#EFEEEA',
  divider: '#F2F1ED',
  outline: '#E1E0DB',
  track: '#E3E2DD',
  dashed: '#DEDDD8',
  tintIndigo: '#F8F7FF',

  // Rarity
  rarityCommon: '#8A8A95',
  rarityRare: '#2E7DF6',
  rarityEpic: '#8B45E8',
  rarityLegendary: '#E0952A',

  // Semantic
  error: '#C9453B',
  errorBg: '#FDECEC',
  warningBg: '#FDF3E4',
  warningText: '#8A6A32',
  kakao: '#FEE500',
  kakaoText: '#191600',
  white: '#FFFFFF',

  // Dark surfaces
  darkBackground: '#0C0C11',
  darkSurface: '#16161D',
  darkSurface2: '#1A1A22',
  darkElevated: '#1E1E26',
  darkLine: '#26262F',
  darkTextPrimary: '#F2F2F5',
  darkTextSecondary: '#A0A0AC',
  darkTextMuted: '#8E8E9A',
  darkInactive: '#71717D',
} as const;

export const rarityColor = (rarity?: string): string => {
  switch ((rarity || '').toUpperCase()) {
    case 'LEGENDARY':
      return palette.rarityLegendary;
    case 'EPIC':
      return palette.rarityEpic;
    case 'RARE':
      return palette.rarityRare;
    default:
      return palette.rarityCommon;
  }
};

export type Palette = typeof palette;
