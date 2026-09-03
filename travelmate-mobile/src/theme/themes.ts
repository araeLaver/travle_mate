/**
 * Fryndo design system — light & dark theme palettes.
 * Dark mapping per the design brief (04/07 — SCREENS · DARK):
 * primary flips to #8E7BFF with ink-colored content on it.
 */

export interface ThemePalette {
  primary: string;
  /** Content color rendered on top of primary surfaces (buttons, pills). */
  onPrimary: string;
  primarySoft: string;
  primaryDark: string;
  ink: string;
  textSecondary: string;
  textTertiary: string;
  textMuted: string;
  placeholder: string;
  disabled: string;
  background: string;
  backgroundAlt: string;
  surface: string;
  surfaceAlt: string;
  hairline: string;
  divider: string;
  outline: string;
  track: string;
  dashed: string;
  tintIndigo: string;
  rarityCommon: string;
  rarityRare: string;
  rarityEpic: string;
  rarityLegendary: string;
  error: string;
  errorBg: string;
  warningBg: string;
  warningText: string;
  kakao: string;
  kakaoText: string;
  white: string;
}

export const lightPalette: ThemePalette = {
  primary: '#4A3AFF',
  onPrimary: '#FFFFFF',
  primarySoft: '#ECEBFF',
  primaryDark: '#8E7BFF',
  ink: '#101014',
  textSecondary: '#4A4A55',
  textTertiary: '#74747F',
  textMuted: '#8A8A95',
  placeholder: '#9A9AA4',
  disabled: '#C6C5C0',
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
  rarityCommon: '#8A8A95',
  rarityRare: '#2E7DF6',
  rarityEpic: '#8B45E8',
  rarityLegendary: '#E0952A',
  error: '#C9453B',
  errorBg: '#FDECEC',
  warningBg: '#FDF3E4',
  warningText: '#8A6A32',
  kakao: '#FEE500',
  kakaoText: '#191600',
  white: '#FFFFFF',
};

export const darkPalette: ThemePalette = {
  primary: '#8E7BFF',
  onPrimary: '#0C0C11',
  primarySoft: 'rgba(142,123,255,0.16)',
  primaryDark: '#8E7BFF',
  ink: '#F2F2F5',
  textSecondary: '#A0A0AC',
  textTertiary: '#8E8E9A',
  textMuted: '#8E8E9A',
  placeholder: '#71717D',
  disabled: '#4A4A54',
  background: '#0C0C11',
  backgroundAlt: '#16161D',
  surface: '#16161D',
  surfaceAlt: '#1E1E26',
  hairline: '#1E1E26',
  divider: '#24242E',
  outline: '#2E2E38',
  track: '#26262F',
  dashed: '#2E2E38',
  tintIndigo: '#141420',
  rarityCommon: '#8E8E9A',
  rarityRare: '#5B9BFF',
  rarityEpic: '#A66CF5',
  rarityLegendary: '#E0952A',
  error: '#E0685E',
  errorBg: 'rgba(201,69,59,0.18)',
  warningBg: 'rgba(224,149,42,0.16)',
  warningText: '#E0952A',
  kakao: '#FEE500',
  kakaoText: '#191600',
  white: '#FFFFFF',
};

export const rarityColorFor = (p: ThemePalette, rarity?: string): string => {
  switch ((rarity || '').toUpperCase()) {
    case 'LEGENDARY':
      return p.rarityLegendary;
    case 'EPIC':
      return p.rarityEpic;
    case 'RARE':
      return p.rarityRare;
    default:
      return p.rarityCommon;
  }
};
