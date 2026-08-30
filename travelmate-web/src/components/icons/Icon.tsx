/**
 * Fryndo icon set — 34 icons from the design system (24px viewBox,
 * 1.5 stroke, round caps/joins; names ending in -f are filled).
 * Includes web-only icons: down, trend, tag.
 */
import React from 'react';
// Plain-SVG port of the mobile icon set (react-native-svg there).

export type IconName =
  | 'home'
  | 'pin'
  | 'compass'
  | 'grid'
  | 'chat'
  | 'user'
  | 'users'
  | 'bell'
  | 'gear'
  | 'search'
  | 'heart'
  | 'star'
  | 'star-f'
  | 'plus'
  | 'check'
  | 'left'
  | 'right'
  | 'close'
  | 'filter'
  | 'share'
  | 'camera'
  | 'cal'
  | 'crown'
  | 'globe'
  | 'spark'
  | 'spark-f'
  | 'image'
  | 'send'
  | 'more'
  | 'lock'
  | 'nav'
  | 'wallet'
  | 'arrow-ur'
  | 'stamp'
  | 'down'
  | 'trend'
  | 'tag';

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
}

const FILLED: ReadonlySet<IconName> = new Set<IconName>(['star-f', 'spark-f', 'more']);

const GLYPHS: Record<IconName, React.ReactElement> = {
  home: (
    <>
      <path d="M3.2 10.4 12 3.4l8.8 7" />
      <path d="M5.6 9.6V20.4h12.8V9.6" />
      <path d="M9.6 20.4v-6h4.8v6" />
    </>
  ),
  pin: (
    <>
      <path d="M12 21.2s7-6 7-11.2a7 7 0 1 0-14 0c0 5.2 7 11.2 7 11.2Z" />
      <circle cx={12} cy={10} r={2.6} />
    </>
  ),
  compass: (
    <>
      <circle cx={12} cy={12} r={8.8} />
      <path d="m15.6 8.4-2 5.2-5.2 2 2-5.2Z" />
    </>
  ),
  grid: (
    <>
      <rect x={3.4} y={3.4} width={7.2} height={7.2} rx={2} />
      <rect x={13.4} y={3.4} width={7.2} height={7.2} rx={2} />
      <rect x={3.4} y={13.4} width={7.2} height={7.2} rx={2} />
      <rect x={13.4} y={13.4} width={7.2} height={7.2} rx={2} />
    </>
  ),
  chat: (
    <path d="M20.4 15.2a2 2 0 0 1-2 2h-6.2L7.6 20.4v-3.2H5.6a2 2 0 0 1-2-2V5.6a2 2 0 0 1 2-2h12.8a2 2 0 0 1 2 2Z" />
  ),
  user: (
    <>
      <circle cx={12} cy={8.2} r={3.6} />
      <path d="M4.8 20.2c1.4-3.6 4-5.4 7.2-5.4s5.8 1.8 7.2 5.4" />
    </>
  ),
  users: (
    <>
      <circle cx={9.4} cy={8.6} r={3.2} />
      <path d="M3.4 19.6c1.1-3.1 3.3-4.6 6-4.6s4.9 1.5 6 4.6" />
      <path d="M16.2 6.1a3.2 3.2 0 0 1 .6 6.2" />
      <path d="M17.4 15.4c2 .5 3.4 1.9 4.2 4.2" />
    </>
  ),
  bell: (
    <>
      <path d="M6.4 10.4a5.6 5.6 0 1 1 11.2 0c0 4.2 1.6 5.8 1.6 5.8H4.8s1.6-1.6 1.6-5.8Z" />
      <path d="M10 19a2 2 0 0 0 4 0" />
    </>
  ),
  gear: (
    <>
      <circle cx={12} cy={12} r={3.1} />
      <path d="M19.6 14.4a1.6 1.6 0 0 0 .3 1.8l.1.1a1.9 1.9 0 1 1-2.7 2.7l-.1-.1a1.6 1.6 0 0 0-2.7 1.1v.3a1.9 1.9 0 1 1-3.8 0v-.2a1.6 1.6 0 0 0-2.8-1.1l-.1.1a1.9 1.9 0 1 1-2.7-2.7l.1-.1a1.6 1.6 0 0 0-1.1-2.7h-.2a1.9 1.9 0 1 1 0-3.8h.2a1.6 1.6 0 0 0 1.1-2.8l-.1-.1a1.9 1.9 0 1 1 2.7-2.7l.1.1a1.6 1.6 0 0 0 1.8.3h.1a1.6 1.6 0 0 0 1-1.5v-.2a1.9 1.9 0 1 1 3.8 0v.2a1.6 1.6 0 0 0 2.7 1.1l.1-.1a1.9 1.9 0 1 1 2.7 2.7l-.1.1a1.6 1.6 0 0 0 1.1 2.7h.2a1.9 1.9 0 1 1 0 3.8h-.2a1.6 1.6 0 0 0-1.5 1Z" />
    </>
  ),
  search: (
    <>
      <circle cx={11} cy={11} r={6.6} />
      <path d="m16 16 4.2 4.2" />
    </>
  ),
  heart: <path d="M12 20.4 4.9 13.3a4.4 4.4 0 1 1 7.1-5 4.4 4.4 0 1 1 7.1 5Z" />,
  star: <path d="m12 3.6 2.6 5.4 5.9.8-4.3 4.1 1.1 5.9-5.3-2.9-5.3 2.9 1.1-5.9L3.5 9.8l5.9-.8Z" />,
  'star-f': (
    <path d="m12 3.6 2.6 5.4 5.9.8-4.3 4.1 1.1 5.9-5.3-2.9-5.3 2.9 1.1-5.9L3.5 9.8l5.9-.8Z" />
  ),
  plus: <path d="M12 5.2v13.6M5.2 12h13.6" />,
  check: <path d="m4.8 12.6 4.8 4.8 9.6-10" />,
  left: <path d="M15 4.8 7.8 12l7.2 7.2" />,
  right: <path d="M9 4.8 16.2 12 9 19.2" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  filter: (
    <>
      <path d="M3.6 7.6h4M12 7.6h8.4M3.6 16.4h8.4M16.4 16.4h4" />
      <circle cx={9.6} cy={7.6} r={2.2} />
      <circle cx={14.4} cy={16.4} r={2.2} />
    </>
  ),
  share: (
    <>
      <path d="M12 15.4V3.8M8.4 7.4 12 3.8l3.6 3.6" />
      <path d="M5.2 13.6v6.6h13.6v-6.6" />
    </>
  ),
  camera: (
    <>
      <path d="M3.6 8.4h3.8L9 6.2h6l1.6 2.2h3.8v11.2H3.6Z" />
      <circle cx={12} cy={13.4} r={3.4} />
    </>
  ),
  cal: (
    <>
      <rect x={3.6} y={5.2} width={16.8} height={15.2} rx={2.4} />
      <path d="M3.6 10h16.8M8.4 3.6v3.2M15.6 3.6v3.2" />
    </>
  ),
  crown: <path d="m3.8 18.2-1.4-10 5.2 4.2L12 4.6l4.4 7.8 5.2-4.2-1.4 10Z" />,
  globe: (
    <>
      <circle cx={12} cy={12} r={8.8} />
      <path d="M3.4 12h17.2" />
      <path d="M12 3.2c2.4 2.4 3.6 5.4 3.6 8.8s-1.2 6.4-3.6 8.8c-2.4-2.4-3.6-5.4-3.6-8.8S9.6 5.6 12 3.2Z" />
    </>
  ),
  spark: <path d="m12 3.4 2 6.6 6.6 2-6.6 2-2 6.6-2-6.6-6.6-2 6.6-2Z" />,
  'spark-f': <path d="m12 3.4 2 6.6 6.6 2-6.6 2-2 6.6-2-6.6-6.6-2 6.6-2Z" />,
  image: (
    <>
      <rect x={3.4} y={4.8} width={17.2} height={14.4} rx={2.4} />
      <circle cx={8.8} cy={9.8} r={1.8} />
      <path d="m4.4 17.6 4.8-4.6 3.2 3 3-2.6 4.2 4.2" />
    </>
  ),
  send: (
    <>
      <path d="M20.4 3.6 3.6 10.4l7 2.6 2.6 7Z" />
      <path d="m10.6 13 4-4" />
    </>
  ),
  more: (
    <>
      <circle cx={5.4} cy={12} r={1.5} />
      <circle cx={12} cy={12} r={1.5} />
      <circle cx={18.6} cy={12} r={1.5} />
    </>
  ),
  lock: (
    <>
      <rect x={4.8} y={10.4} width={14.4} height={9.6} rx={2.4} />
      <path d="M8.4 10.4V8a3.6 3.6 0 0 1 7.2 0v2.4" />
    </>
  ),
  nav: <path d="M20.4 3.6 3.6 11l7.4 2 2 7.4Z" />,
  wallet: (
    <>
      <rect x={3.4} y={5.8} width={17.2} height={12.8} rx={2.6} />
      <path d="M15.4 12.2h5.2" />
    </>
  ),
  'arrow-ur': <path d="M7.6 16.4 16.4 7.6M9.2 7.6h7.2v7.2" />,
  stamp: (
    <>
      <path d="M4.4 8.4h15.2v11.2H4.4Z" />
      <circle cx={12} cy={14} r={3} />
      <path d="M8 4.2v2.4M12 3.4v3.2M16 4.2v2.4" />
    </>
  ),
  down: <path d="M4.8 9 12 16.2 19.2 9" />,
  trend: (
    <>
      <path d="M3.6 17.4 9 10.8l4.2 3.4 7.2-8.6" />
      <path d="M15.6 5.6h4.8v4.8" />
    </>
  ),
  tag: (
    <>
      <path d="M20.4 12.6 12.6 20.4 3.6 11.4V3.6h7.8Z" />
      <circle cx={8.2} cy={8.2} r={1.6} />
    </>
  ),
};

const Icon: React.FC<IconProps> = ({ name, size = 24, color = '#101014', strokeWidth = 1.5 }) => {
  const filled = FILLED.has(name);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? color : 'none'}
      stroke={filled ? 'none' : color}
      strokeWidth={filled ? 0 : strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {GLYPHS[name]}
    </svg>
  );
};

export default Icon;
