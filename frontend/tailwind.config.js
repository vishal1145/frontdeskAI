import defaultTheme from 'tailwindcss/defaultTheme';
import {
  animation,
  borderRadius,
  boxShadow,
  colors,
  cssVariables,
  fontFamily,
  fontSize,
  fontWeight,
  keyframes,
  letterSpacing,
  lineHeight,
  spacing,
  typographyRules,
} from './design-tokens.js';

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    // `xs` was referenced across components but never defined; register it ahead of `sm`.
    screens: {
      xs: '420px',
      ...defaultTheme.screens,
    },
    extend: {
      colors,
      fontFamily,
      fontSize,
      fontWeight,
      boxShadow,
      animation,
      keyframes,
      letterSpacing,
      lineHeight,
      spacing,
      borderRadius,
    },
  },
  plugins: [
    ({ addBase }) => addBase([{ ':root': cssVariables }, typographyRules]),
  ],
}
