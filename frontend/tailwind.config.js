import defaultTheme from 'tailwindcss/defaultTheme';

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
      colors: {
        // Logo-derived azure scale (replaces Tailwind's default royal blue).
        blue: {
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
        },
        ink: {
          DEFAULT: "#0E1A2E",
          soft: "#3B4A63",
          muted: "#64748B",
        },
        ice: {
          DEFAULT: "#F4FAFF",
          base: "#EFF5FD",
          deep: "#E3F0FB",
        },
        glow: "#60F7FC",
        canvas: {
          DEFAULT: "#FFFFFF",
          subtle: "#F8FAFC",
          muted: "#F1F5F9",
        },
        surface: {
          DEFAULT: "#FFFFFF",
          elevated: "#FFFFFF",
          card: "#FFFFFF",
          border: "#E2E8F0",
        },
        brand: {
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
        },
        accent: {
          teal: {
            DEFAULT: "#0D9488",
            hover: "#0F766E",
            light: "#F0FDFA",
            border: "#CCFBF1",
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
          }
        },
        slate: {
          950: "#020617",
          900: "#0F172A",
          800: "#1E293B",
          700: "#334155",
          600: "#475569",
          500: "#64748B",
          400: "#94A3B8",
          300: "#CBD5E1",
          200: "#E2E8F0",
          100: "#F1F5F9",
          50: "#F8FAFC",
        }
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        heading: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        subheading: ['"Edu QLD Hand"', 'cursive', 'sans-serif'],
        mono: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'subtle': '0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px -1px rgba(0, 0, 0, 0.04)',
        'elevated': '0 10px 30px -5px rgba(15, 23, 42, 0.06), 0 4px 6px -4px rgba(15, 23, 42, 0.03)',
        'elevated-hover': '0 20px 35px -10px rgba(13, 148, 136, 0.12), 0 8px 12px -3px rgba(15, 23, 42, 0.05)',
        'teal-glow': '0 10px 25px -4px rgba(13, 148, 136, 0.35)',
        'card-featured': '0 0 0 1px rgba(13, 148, 136, 0.2), 0 12px 30px -8px rgba(13, 148, 136, 0.12)',
        'pulse-glow': '0 0 20px 2px rgba(13, 148, 136, 0.4)',
      },
      animation: {
        'wave-bar': 'waveBar 1.2s ease-in-out infinite alternate',
        'pulse-ring': 'pulseRing 2.2s cubic-bezier(0.2, 0, 0.4, 1) infinite',
        'float-gentle': 'floatGentle 4.5s ease-in-out infinite',
        'shimmer': 'shimmer 2.5s infinite linear',
        'pulse-slow': 'pulseSlow 4s ease-in-out infinite',
        'ping-slow': 'pingSlow 3s cubic-bezier(0, 0, 0.2, 1) infinite',
        'slide-up': 'slideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'marquee': 'marquee 48s linear infinite',
        'spin-slow': 'spin 14s linear infinite',
      },
      keyframes: {
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
      }
    },
  },
  plugins: [],
}
