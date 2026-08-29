/**
 * Fryndo design system — typography tokens.
 * Manrope (UI), Noto Sans KR (Korean fallback baked into Manrope stack on
 * native we set per-weight families), Playfair Display (display numerals).
 */
import { TextStyle } from 'react-native';

export const fonts = {
  regular: 'Manrope_400Regular',
  medium: 'Manrope_500Medium',
  semibold: 'Manrope_600SemiBold',
  bold: 'Manrope_700Bold',
  extrabold: 'Manrope_800ExtraBold',
  krRegular: 'NotoSansKR_400Regular',
  krMedium: 'NotoSansKR_500Medium',
  krBold: 'NotoSansKR_700Bold',
  display: 'PlayfairDisplay_500Medium',
  displaySemibold: 'PlayfairDisplay_600SemiBold',
} as const;

export const type = {
  /** Playfair display — hero/stat numerals */
  display: {
    fontFamily: fonts.display,
    fontSize: 34,
    lineHeight: 38,
  } as TextStyle,
  statNumber: {
    fontFamily: fonts.display,
    fontSize: 22,
    lineHeight: 24,
  } as TextStyle,
  /** Page titles (홈 인사, 내 컬렉션…) */
  title: {
    fontFamily: fonts.extrabold,
    fontSize: 24,
    lineHeight: 30,
    letterSpacing: -0.72,
  } as TextStyle,
  /** Section headings */
  heading: {
    fontFamily: fonts.extrabold,
    fontSize: 17,
    lineHeight: 23,
    letterSpacing: -0.34,
  } as TextStyle,
  cardTitle: {
    fontFamily: fonts.bold,
    fontSize: 15,
    lineHeight: 20,
  } as TextStyle,
  body: {
    fontFamily: fonts.medium,
    fontSize: 15,
    lineHeight: 23,
  } as TextStyle,
  bodySmall: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    lineHeight: 19,
  } as TextStyle,
  caption: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    lineHeight: 17,
  } as TextStyle,
  meta: {
    fontFamily: fonts.semibold,
    fontSize: 11,
    lineHeight: 15,
  } as TextStyle,
  button: {
    fontFamily: fonts.extrabold,
    fontSize: 15,
    lineHeight: 20,
  } as TextStyle,
  tabLabel: {
    fontFamily: fonts.bold,
    fontSize: 10,
    lineHeight: 13,
  } as TextStyle,
  badge: {
    fontFamily: fonts.extrabold,
    fontSize: 10,
    lineHeight: 13,
    letterSpacing: 0.5,
  } as TextStyle,
  eyebrow: {
    fontFamily: fonts.extrabold,
    fontSize: 13,
    lineHeight: 17,
    letterSpacing: 1.8,
  } as TextStyle,
} as const;
