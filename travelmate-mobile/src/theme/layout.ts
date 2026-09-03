/**
 * Fryndo design system — spacing, radii, shadows.
 * 8pt grid, 20px screen padding, 44px minimum tap target.
 */
import { ViewStyle } from 'react-native';

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  screenH: 20,
} as const;

export const radii = {
  badge: 7,
  chip: 10,
  iconButton: 13,
  input: 14,
  button: 15,
  card: 16,
  cardLarge: 18,
  hero: 20,
  photo: 24,
  sheet: 26,
} as const;

export const shadows = {
  card: {
    shadowColor: '#101014',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.14,
    shadowRadius: 25,
    elevation: 8,
  } as ViewStyle,
  floating: {
    shadowColor: '#101014',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 9,
    elevation: 4,
  } as ViewStyle,
  primaryGlow: {
    shadowColor: '#4A3AFF',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.34,
    shadowRadius: 11,
    elevation: 8,
  } as ViewStyle,
  sheet: {
    shadowColor: '#101014',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 12,
  } as ViewStyle,
} as const;

export const hitSlop = { top: 8, bottom: 8, left: 8, right: 8 } as const;
