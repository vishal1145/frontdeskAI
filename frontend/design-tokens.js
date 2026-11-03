// FrontDesk AI design tokens: the single place to change colours, type and shadows.
// Tailwind reads these in tailwind.config.js, which also publishes `cssVariables` on :root.
// Rules and usage live in /DESIGN.md.

// ─── Colours ─────────────────────────────────────────────────────────────────
// Hex values, not CSS variables, so Tailwind opacity classes like `bg-blue-600/50` keep working.
// Change a value once here: semantic names and the --fd-* variables below reuse these scales.
const blue = {
  // Logo-derived azure scale (replaces Tailwind's default royal blue).
  50: "#EEF6FF",
  100: "#D9EBFF",
  200: "#BCDCFF",
  300: "#8EC6FF",
  400: "#59A8FF",
  500: "#2B8AF7",
  600: "#1570E0",
  700: "#155BBA",
  800: "#174C96",
  900: "#183F78",
  950: "#112848",
};

const slate = {
  50: "#F8FAFC",
  100: "#F1F5F9",
  200: "#E2E8F0",
  300: "#CBD5E1",
  400: "#94A3B8",
  500: "#64748B",
  600: "#475569",
  700: "#334155",
  800: "#1E293B",
  900: "#0F172A",
  950: "#020617",
};

const brand = {
  50: "#F0FDFA",
  100: "#CCFBF1",
  200: "#99F6E4",
  300: "#5EEAD4",
  400: "#2DD4BF",
  500: "#14B8A6",
  600: "#0D9488",
  700: "#0F766E",
  800: "#115E59",
  900: "#134E4A",
};

// Extra shades that have no scale of their own, numbered within each colour family.
const tint = {
  amber: {
    1: "#FFF7ED",
    2: "#FED7AA",
    3: "#FDE68A",
    4: "#EA580C",
    5: "#C2410C",
  },
  blue: {
    1: "#F9FBFF",
    2: "#F7FAFF",
    3: "#F6FAFF",
    4: "#F4F9FF",
    5: "#F3F8FF",
    6: "#F2F8FF",
    7: "#F1F7FF",
    8: "#EFF6FF",
    9: "#EEF2FF",
    10: "#EEF5FF",
    11: "#EEF5FD",
    12: "#EAF3FF",
    13: "#E9F3FD",
    14: "#E6F1FF",
    15: "#EEF2F7",
    16: "#E6EEF9",
    17: "#E7EEF8",
    18: "#E0F2FE",
    19: "#DCECFD",
    20: "#D6EAFF",
    21: "#DCE8F7",
    22: "#CBE6FF",
    23: "#CFE3FA",
    24: "#D5E2F3",
    25: "#93C5FD",
    26: "#B6C6DA",
    27: "#A9BCD6",
    28: "#60A5FA",
    29: "#94A9C4",
    30: "#6366F1",
    31: "#8FA6C4",
    32: "#3B9BFF",
    33: "#2563EB",
    34: "#0D5BBF",
    35: "#0F3456",
    36: "#081A30",
    37: "#0E1B2A",
    38: "#0B1320",
    39: "#061424",
    40: "#F0F7FF",
    41: "#E2F3FF",
    42: "#15294A",
    43: "#0A1322",
    44: "#0C2E4A",
    45: "#0A2038",
    46: "#081424",
    47: "#08111F",
    48: "#12294A",
    49: "#0C1C33",
    50: "#08131F",
  },
  cyan: {
    1: "#FDFEFE",
    2: "#F0FBFF",
    3: "#E0F7FF",
    4: "#A5F3FC",
    5: "#A0FAFF",
    6: "#A2E8FD",
    7: "#7DE7FD",
    8: "#7DD3FC",
    9: "#67E8F9",
    10: "#38BDF8",
    11: "#2BB5F5",
    12: "#EBFDFF",
  },
  green: {
    1: "#F0FDF4",
    2: "#ECFDF5",
    3: "#E3F8EF",
    4: "#BBF7D0",
    5: "#A7F3D0",
    6: "#34D399",
    7: "#10B981",
    8: "#059669",
    9: "#047857",
  },
  rose: {
    1: "#FEF2F2",
    2: "#FFF1F2",
    3: "#FECDD3",
    4: "#FECACA",
    5: "#FB7185",
    6: "#F43F5E",
    7: "#EF4444",
    8: "#B91C1C",
  },
  violet: {
    1: "#F3E8FF",
  },
};

export const colors = {
  white: "#FFFFFF",
  black: "#000000",
  blue,
  slate,
  brand,
  tint,
  ink: {
    DEFAULT: "#0E1A2E",
    soft: "#3B4A63",
    muted: slate[500],
  },
  ice: {
    DEFAULT: "#F4FAFF",
    base: "#EFF5FD",
    deep: "#E3F0FB",
  },
  glow: "#60F7FC",
  rim: "#48E7FD",
  canvas: {
    DEFAULT: "#FFFFFF",
    subtle: slate[50],
    muted: slate[100],
  },
  surface: {
    DEFAULT: "#FFFFFF",
    elevated: "#FFFFFF",
    card: "#FFFFFF",
    border: slate[200],
  },
  accent: {
    teal: {
      DEFAULT: brand[600],
      hover: brand[700],
      light: brand[50],
      border: brand[100],
    },
    sapphire: {
      DEFAULT: "#0284C7",
      hover: "#0369A1",
      light: "#F0F9FF",
      border: "#BAE6FD",
    },
    amber: {
      DEFAULT: "#D97706",
      hover: "#B45309",
      light: "#FFFBEB",
    },
  },
};

// For inline styles and canvas, where Tailwind classes cannot reach.
export const rgbChannels = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
export const withAlpha = (hex, alpha) => `rgb(${rgbChannels(hex).join(' ')} / ${alpha})`;

// ─── Typography ──────────────────────────────────────────────────────────────
// Söhne needs a paid licence, so Hanken Grotesk stands in. To change the font, edit both
// lines: vite.config.js loads `googleFontsUrl` into the page.
export const font = {
  name: 'Hanken Grotesk',
  googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Hanken+Grotesk:ital,wght@0,100..900;1,100..900&display=swap',
};

export const fontFamily = {
  sans: ['var(--fd-font-sans)'],
  display: ['var(--fd-font-display)'],
  heading: ['var(--fd-font-heading)'],
  subheading: ['var(--fd-font-subheading)'],
  mono: ['var(--fd-font-sans)'],
};

// Text classes such as `text-sm`: [font size, line height].
export const fontSize = {
  xs: ['0.75rem', { lineHeight: '1rem' }],
  sm: ['0.875rem', { lineHeight: '1.25rem' }],
  base: ['1rem', { lineHeight: '1.5rem' }],
  lg: ['1.125rem', { lineHeight: '1.75rem' }],
  xl: ['1.25rem', { lineHeight: '1.75rem' }],
  '2xl': ['1.5rem', { lineHeight: '2rem' }],
  '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
  '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
  '5xl': ['3rem', { lineHeight: '1' }],
  '6xl': ['3.75rem', { lineHeight: '1' }],
  // Exact sizes, named in px: `text-13`. Fluid sizes scale with the screen.
  '8-8': '0.55rem',
  '9-5': '0.59375rem',
  '10': '0.625rem',
  '10-4': '0.65rem',
  '11': '0.6875rem',
  '12': '0.75rem',
  '12-8': '0.8rem',
  '13': '0.8125rem',
  '13-2': '0.825rem',
  '14': '0.875rem',
  '14-08': '0.88rem',
  '14-4': '0.9rem',
  '14-5': '0.90625rem',
  '14-72': '0.92rem',
  '15': '0.9375rem',
  '15-2': '0.95rem',
  '15-5': '0.96875rem',
  '15-68': '0.98rem',
  '16': '1rem',
  '16-8': '1.05rem',
  '17': '1.0625rem',
  '17-6': '1.1rem',
  '18': '1.125rem',
  '21-6': '1.35rem',
  '24': '1.5rem',
  '26': '1.625rem',
  '28': '1.75rem',
  '30': '1.875rem',
  'fluid-1': 'clamp(1.5rem, 2.6vw, 2.125rem)',
  'fluid-2': 'clamp(1.5rem, 1.1rem + 1.4vw, 2.1rem)',
  'fluid-3': 'clamp(1.75rem, 1.1rem + 1.8vw, 2.65rem)',
  'fluid-4': 'clamp(1.55rem, 0.9rem + 2.2vw, 2.65rem)',
  'fluid-5': 'clamp(0.875rem, 1.2vw + 0.45rem, 1.125rem)',
  'fluid-6': 'clamp(1.05rem, 0.6vw + 0.95rem, 1rem)',
  'fluid-7': 'clamp(2.85rem, 0.75rem + 8.1vw, 8.5rem)',
  'fluid-8': 'clamp(0.95rem, 0.3vw + 0.9rem, 1.0625rem)',
};

// `tracking-wide-60` is 0.060em, `tracking-tight-25` is -0.025em.
export const letterSpacing = {
  'tight-5': '-0.005em',
  'tight-10': '-0.01em',
  'wide-10': '0.01em',
  'tight-15': '-0.015em',
  'tight-25': '-0.025em',
  'tight-30': '-0.03em',
  'wide-40': '0.04em',
  'tight-55': '-0.055em',
  'wide-60': '0.06em',
  'wide-80': '0.08em',
  'wide-120': '0.12em',
  'wide-140': '0.14em',
  'wide-240': '0.24em',
};

// `leading-ratio-140` is 1.4.
export const lineHeight = {
  'ratio-90': '0.9',
  'ratio-112': '1.12',
  'ratio-115': '1.15',
  'ratio-118': '1.18',
  'ratio-120': '1.2',
  'ratio-125': '1.25',
  'ratio-130': '1.3',
  'ratio-140': '1.4',
  'ratio-150': '1.5',
  'ratio-155': '1.55',
  'ratio-160': '1.6',
  'ratio-165': '1.65',
};

// Weight classes such as `font-semibold`. The values are set in cssVariables below.
export const fontWeight = {
  normal: 'var(--fd-weight-normal)',
  medium: 'var(--fd-weight-medium)',
  semibold: 'var(--fd-weight-semibold)',
  bold: 'var(--fd-weight-bold)',
  extrabold: 'var(--fd-weight-extrabold)',
};

// Text categories. `null` keeps the current design, where each element sets its own size and
// colour. Any other value overrides that property for the whole category, and only that category.
//   header:    h1, h2, hero and section titles
//   subheader: h3 to h6, lead paragraphs, eyebrow pills, intro lines
//   content:   paragraphs, lists, tables, labels, inputs and general text (not buttons or links)
//   button:    buttons
//   link:      links
// Examples: fontSize: '32px', fontWeight: 600,
// color: '#FF0066', lineHeight: 1.2, letterSpacing: '-0.02em', textTransform: 'uppercase'.
export const typography = {
  header: {
    fontFamily: null,
    fontSize: null,
    fontWeight: null,
    color: null,
    lineHeight: null,
    letterSpacing: null,
    textTransform: null,
  },
  subheader: {
    fontFamily: null,
    fontSize: null,
    fontWeight: null,
    color: null,
    lineHeight: null,
    letterSpacing: null,
    textTransform: null,
  },
  content: {
    fontFamily: null,
    fontSize: null,
    fontWeight: null,
    color: null,
    lineHeight: null,
    letterSpacing: null,
    textTransform: null,
  },  button: {
    fontFamily: null,
    fontSize: null,
    fontWeight: null,
    color: null,
    lineHeight: null,
    letterSpacing: null,
    textTransform: null,
  },
  link: {
    fontFamily: null,
    fontSize: null,
    fontWeight: null,
    color: null,
    lineHeight: null,
    letterSpacing: null,
    textTransform: null,
  },
};

// ─── Spacing and radius ──────────────────────────────────────────────────────
// Used by p-*, m-*, gap-*. `s-18` is an exact 18px value; `set-1` is a full shorthand.
export const spacing = {
  '0': '0px',
  '0.5': '0.125rem',
  '1': '0.25rem',
  's-1': '1px',
  'set-1': 'clamp(0.625rem,1.5vh,1.25rem)',
  '1.5': '0.375rem',
  '2': '0.5rem',
  's-2': '2px',
  'set-2': 'clamp(1.25rem,2.5vh,2rem)',
  's-2-4': '0.15rem',
  '2.5': '0.625rem',
  '3': '0.75rem',
  's-3': '3px',
  'set-3': '1.125rem 1.25rem 1.25rem',
  's-3-2': '0.2rem',
  '3.5': '0.875rem',
  '4': '1rem',
  's-4': '0.25rem',
  'set-4': 'clamp(2.5rem, 7vh, 5.5rem)',
  's-4-8': '0.3rem',
  '5': '1.25rem',
  'set-5': 'clamp(2.5rem, 6vh, 4.5rem)',
  's-5-6': '0.35rem',
  '6': '1.5rem',
  's-6': '0.375rem',
  'set-6': 'clamp(1.5rem, 3.5vh, 2.5rem)',
  '7': '1.75rem',
  'set-7': 'clamp(1.25rem, 3vh, 2rem)',
  's-7-2': '0.45rem',
  '8': '2rem',
  's-8': '0.5rem',
  's-8-8': '0.55rem',
  '9': '2.25rem',
  's-9-6': '0.6rem',
  '10': '2.5rem',
  's-10': '0.625rem',
  's-10-4': '0.65rem',
  '11': '2.75rem',
  's-11-2': '0.7rem',
  '12': '3rem',
  's-12': '0.75rem',
  's-12-8': '0.8rem',
  's-13-6': '0.85rem',
  '14': '3.5rem',
  's-14-4': '0.9rem',
  's-15-2': '0.95rem',
  '16': '4rem',
  's-16': '1rem',
  's-17-6': '1.1rem',
  's-18': '1.125rem',
  '20': '5rem',
  's-20': '1.25rem',
  's-22-4': '1.4rem',
  '24': '6rem',
  's-24': '1.5rem',
  '28': '7rem',
  's-28': '1.75rem',
  '32': '8rem',
  's-32': '2rem',
  '36': '9rem',
  '40': '10rem',
  's-41-6': '2.6rem',
  '44': '11rem',
  '48': '12rem',
  '52': '13rem',
  '56': '14rem',
  '60': '15rem',
  '64': '16rem',
  's-64': '4rem',
  '72': '18rem',
  '80': '20rem',
  's-80': '5rem',
  '96': '24rem',
  px: '1px',
  'nav-control': '2.125rem',
  'nav-chip': '1.625rem',
  'doctor-popover': '40rem',
};

// `rounded-14` is 14px.
export const borderRadius = {
  'set-1': '1rem 1rem 0.3rem 1rem',
  '2': '2px',
  '2xl': '1rem',
  'set-2': '1rem 1rem 1rem 0.3rem',
  '3': '3px',
  '3xl': '1.5rem',
  '4': '4px',
  '6': '6px',
  '8': '8px',
  '9': '9px',
  '10': '10px',
  '11-2': '0.7rem',
  '12': '0.75rem',
  '14': '14px',
  '14-4': '0.9rem',
  '16': '1rem',
  '17-6': '1.1rem',
  '20': '1.25rem',
  '24': '1.5rem',
  '28': '1.75rem',
  '36': '2.25rem',
  '99': '99px',
  '9999': '9999px',
  DEFAULT: '0.25rem',
  full: '9999px',
  half: '50%',
  lg: '0.5rem',
  md: '0.375rem',
  none: '0px',
  sm: '0.125rem',
  xl: '0.75rem',
};

// ─── Shadows ─────────────────────────────────────────────────────────────────
export const boxShadow = {
  'subtle': '0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px -1px rgba(0, 0, 0, 0.04)',
  'elevated': '0 10px 30px -5px rgba(15, 23, 42, 0.06), 0 4px 6px -4px rgba(15, 23, 42, 0.03)',
  'elevated-hover': '0 20px 35px -10px rgba(13, 148, 136, 0.12), 0 8px 12px -3px rgba(15, 23, 42, 0.05)',
  'teal-glow': '0 10px 25px -4px rgba(13, 148, 136, 0.35)',
  'card-featured': '0 0 0 1px rgba(13, 148, 136, 0.2), 0 12px 30px -8px rgba(13, 148, 136, 0.12)',
  'pulse-glow': '0 0 20px 2px rgba(13, 148, 136, 0.4)',
};

// ─── Motion ──────────────────────────────────────────────────────────────────
export const animation = {
  'wave-bar': 'waveBar 1.2s ease-in-out infinite alternate',
  'pulse-ring': 'pulseRing 2.2s cubic-bezier(0.2, 0, 0.4, 1) infinite',
  'float-gentle': 'floatGentle 4.5s ease-in-out infinite',
  'shimmer': 'shimmer 2.5s infinite linear',
  'pulse-slow': 'pulseSlow 4s ease-in-out infinite',
  'ping-slow': 'pingSlow 3s cubic-bezier(0, 0, 0.2, 1) infinite',
  'slide-up': 'slideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards',
  'marquee': 'marquee 48s linear infinite',
  'spin-slow': 'spin 14s linear infinite',
};

export const keyframes = {
  marquee: {
    '0%': { transform: 'translateX(-50%)' },
    '100%': { transform: 'translateX(0%)' },
  },
  waveBar: {
    '0%': { height: '18%' },
    '100%': { height: '94%' },
  },
  pulseRing: {
    '0%': { transform: 'scale(0.95)', opacity: '0.8' },
    '60%': { transform: 'scale(1.4)', opacity: '0' },
    '100%': { transform: 'scale(1.4)', opacity: '0' },
  },
  floatGentle: {
    '0%, 100%': { transform: 'translateY(0px)' },
    '50%': { transform: 'translateY(-6px)' },
  },
  shimmer: {
    '0%': { backgroundPosition: '-200% 0' },
    '100%': { backgroundPosition: '200% 0' },
  },
  pulseSlow: {
    '0%, 100%': { opacity: '0.6', transform: 'scale(1)' },
    '50%': { opacity: '0.9', transform: 'scale(1.05)' },
  },
  pingSlow: {
    '75%, 100%': { transform: 'scale(1.8)', opacity: '0' },
  },
  slideUp: {
    '0%': { opacity: '0', transform: 'translateY(12px)' },
    '100%': { opacity: '1', transform: 'translateY(0)' },
  }
};

// ─── Text category rules ─────────────────────────────────────────────────────
const headerElements = 'h1, h2, .hero-title-clamp, .section-title-clamp';
const subheaderElements = `h3, h4, h5, h6, .lead, .subheading, .sub-heading, .font-subheading, .hero-anim-sub,
  .body-lead-clamp, .adm-sub, .eyebrow, [data-anim="para"], [data-anim="cta-sub"]`;
const notContent = `${headerElements}, ${subheaderElements}, button, a`;

const categorySelectors = {
  header: `:is(${headerElements}), :is(${headerElements}) *`,
  subheader: `:is(${subheaderElements}), :is(${subheaderElements}) *`,
  content: `:is(p, li, td, th, label, blockquote, dd, dt, small, span, div, input, textarea, select):not(:is(${notContent}), :is(${notContent}) *)`,
  button: "button, button *, [role='button'], [role='button'] *",
  link: 'a, a *',
};

const toKebabCase = (property) => property.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
const isSet = ([, value]) => value !== null;

// { header: { fontSize: '32px' } } becomes { '--fd-header-font-size': '32px' }. Null is left out.
const typographyVariables = Object.fromEntries(
  Object.entries(typography).flatMap(([category, properties]) =>
    Object.entries(properties)
      .filter(isSet)
      .map(([property, value]) => [`--fd-${category}-${toKebabCase(property)}`, String(value)])
  )
);

// A rule exists only for values that are set, so null tokens add no CSS at all. !important inside
// a layer beats utility classes, inline styles and the unlayered !important rules in index.css.
export const typographyRules = {
  '@layer fd-typography': Object.fromEntries(
    Object.entries(typography).map(([category, properties]) => [
      categorySelectors[category],
      Object.fromEntries(
        Object.entries(properties)
          .filter(isSet)
          .map(([property]) => {
            const cssProperty = toKebabCase(property);
            return [cssProperty, `var(--fd-${category}-${cssProperty}) !important`];
          })
      ),
    ])
  ),
};

// ─── CSS variables on :root, for index.css and inline styles ─────────────────
// Every colour as a variable for SVG attributes: { blue: { 600: x } } gives --fd-color-blue-600.
const flattenColors = (group, prefix = '--fd-color') =>
  Object.entries(group).flatMap(([name, value]) => {
    const key = name === 'DEFAULT' ? prefix : `${prefix}-${name}`;
    return typeof value === 'string' ? [[key, value]] : flattenColors(value, key);
  });
const colorVariables = Object.fromEntries(flattenColors(colors));

export const cssVariables = {
  'color-scheme': 'light',
  '--fd-ink': colors.ink.DEFAULT,
  '--fd-ink-soft': colors.ink.soft,
  '--fd-ink-muted': colors.ink.muted,
  '--fd-ice': colors.ice.DEFAULT,
  '--fd-ice-base': colors.ice.base,
  '--fd-ice-deep': colors.ice.deep,
  '--fd-brand': blue[600],
  '--fd-brand-vivid': blue[500],
  '--fd-brand-deep': blue[800],
  '--fd-glow': colors.glow,
  '--fd-rim': colors.rim,
  '--fd-ease': 'cubic-bezier(0.22, 1, 0.36, 1)',
  '--fd-font-sans': `'${font.name}', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`,
  '--fd-font-display': 'var(--fd-font-sans)',
  '--fd-font-heading': 'var(--fd-font-sans)',
  '--fd-font-subheading': 'var(--fd-font-sans)',
  '--fd-letter-spacing': '-0.011em',
  '--fd-weight-normal': '400',
  '--fd-weight-medium': '500',
  '--fd-weight-semibold': '600',
  '--fd-weight-bold': '700',
  '--fd-weight-extrabold': '800',
  '--fd-glass-shadow': 'inset 0 1px 1px rgba(255, 255, 255, 0.9), inset 0 0 0 1px rgba(255, 255, 255, 0.85), 0 0 0 1px rgba(23, 76, 150, 0.06), 0 18px 38px -18px rgba(23, 76, 150, 0.32)',
  '--fd-glass-shadow-hover': 'inset 0 1px 1px rgba(255, 255, 255, 0.95), inset 0 0 0 1px rgba(72, 231, 253, 0.55), 0 0 0 1px rgba(23, 76, 150, 0.08), 0 28px 50px -22px rgba(23, 76, 150, 0.42)',
  // Admin console and portal surfaces
  '--adm-border': `${withAlpha(colors.slate[900], 0.08)}`,
  '--adm-border-strong': `${withAlpha(colors.slate[900], 0.14)}`,
  '--adm-glass': `${withAlpha(colors.white, 0.72)}`,
  '--adm-shadow': `0 1px 2px ${withAlpha(colors.ink.DEFAULT, 0.04)}, 0 18px 40px -26px ${withAlpha(colors.blue[800], 0.35)}`,
  '--adm-shadow-hover': `0 1px 2px ${withAlpha(colors.ink.DEFAULT, 0.05)}, 0 28px 56px -28px ${withAlpha(colors.blue[800], 0.45)}`,
  '--adm-focus': `0 0 0 4px ${withAlpha(colors.blue[500], 0.16)}`,
  '--cx-radius': borderRadius[14],
  '--cx-radius-sm': borderRadius[10],
  '--cx-border': `${withAlpha(colors.slate[900], 0.09)}`,
  '--cx-border-strong': `${withAlpha(colors.slate[900], 0.16)}`,
  '--cx-hover-border': `${withAlpha(colors.slate[900], 0.26)}`,
  '--cx-surface': colors.white,
  '--cx-subtle': colors.slate[50],
  '--cx-track': colors.tint.blue[15],
  '--cx-muted': colors.ink.muted,
  '--cx-soft': colors.ink.soft,
  '--cx-shadow': `0 1px 2px ${withAlpha(colors.ink.DEFAULT, 0.04)}, 0 10px 28px -18px ${withAlpha(colors.blue[800], 0.22)}`,
  '--cx-focus': `0 0 0 3px ${withAlpha(colors.blue[500], 0.24)}`,
  '--cx-ease': 'cubic-bezier(0.22, 1, 0.36, 1)',
  ...typographyVariables,
  ...colorVariables,
};
