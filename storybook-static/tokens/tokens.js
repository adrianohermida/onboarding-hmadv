/**
 * Design Tokens — single source of truth for all design values.
 *
 * These values mirror variables.css but are available in JS
 * for use in dynamic styles, chart configs, and components.
 */
export const COLORS = {
  // Brand
  navy:       '#1A3A5C',
  blue:       '#2E6DA4',
  ice:        '#EBF3FC',
  gold:       '#F5A623',
  goldBg:     'rgba(245,166,35,.12)',

  // Semantic
  ok:         '#1a7a4a',
  okBg:       '#e8f5ee',
  warn:       '#b45309',
  warnBg:     '#fef3c7',
  red:        '#dc2626',
  redBg:      '#fef2f2',

  // Text
  ink:        '#0f1923',
  ink2:       '#3d4f63',
  muted:      '#94a3b8',

  // Surfaces
  line:       '#e2e8f0',
  line2:      '#f0f4f8',
  bg:         '#edf1f7',
  white:      '#ffffff',
};

export const TYPOGRAPHY = {
  serif: "'Libre Baskerville', Georgia, serif",
  sans:  "'DM Sans', system-ui, sans-serif",

  sizes: {
    xs:   '10px',
    sm:   '12px',
    base: '13px',
    md:   '14px',
    lg:   '16px',
    xl:   '18px',
    '2xl':'22px',
    '3xl':'28px',
  },
};

export const SPACING = {
  1:  '4px',
  2:  '8px',
  3:  '12px',
  4:  '16px',
  5:  '20px',
  6:  '24px',
  8:  '32px',
  10: '40px',
  12: '48px',
};

export const RADII = {
  sm:  '8px',
  md:  '12px',
  lg:  '16px',
  xl:  '20px',
  full:'9999px',
};

export const SHADOWS = {
  sm: '0 2px 8px rgba(15,25,35,.06)',
  md: '0 4px 16px rgba(15,25,35,.10)',
  lg: '0 8px 32px rgba(15,25,35,.18)',
};

export const Z_INDEX = {
  base:        0,
  dropdown:    100,
  stickyHeader:200,
  slideover:   900,
  modal:       1000,
  toast:       1100,
  loading:     9999,
};

export const BREAKPOINTS = {
  mobile:  '480px',
  tablet:  '768px',
  desktop: '1024px',
  wide:    '1280px',
};

export const ANIMATION = {
  fast:   '.15s ease',
  normal: '.25s cubic-bezier(.4,0,.2,1)',
  slow:   '.4s ease',
};

// Chart.js default config (reuse across financial/debt charts)
export const CHART_DEFAULTS = {
  fontFamily: "'DM Sans', system-ui, sans-serif",
  colors: {
    primary:  COLORS.navy,
    secondary:COLORS.blue,
    accent:   COLORS.gold,
    ok:       COLORS.ok,
    warn:     COLORS.warn,
    red:      COLORS.red,
    muted:    COLORS.muted,
  },
  grid: {
    color:      'rgba(226,232,240,.6)',
    borderColor:'transparent',
  },
};

export default { COLORS, TYPOGRAPHY, SPACING, RADII, SHADOWS, Z_INDEX, BREAKPOINTS, ANIMATION, CHART_DEFAULTS };
