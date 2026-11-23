/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['variant', ['&:where(.dark, .dark *)', '&:where([data-theme="ink"], [data-theme="ink"] *)']],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {

      // ─────────────────────────────────────────────────────────────────────
      // CONTROLHUB BRAND COLOURS
      // These are the ControlHub identity colours.
      // Full shade scales generated from the three base values so you can
      // use ch-primary-100, ch-secondary-500, ch-tertiary-800 etc. anywhere.
      // ─────────────────────────────────────────────────────────────────────
      colors: {
        // 360IQ semantic tokens (design.md section 2.2). Product UI uses these, never raw hex.
        'surface-0': 'var(--surface-0)',
        'surface-1': 'var(--surface-1)',
        'surface-2': 'var(--surface-2)',
        line: { DEFAULT: 'var(--line)', strong: 'var(--line-strong)' },
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'text-muted': 'var(--text-muted)',
        signal: { DEFAULT: 'var(--signal)', hover: 'var(--signal-hover)', text: 'var(--signal-text)', tint: 'var(--signal-tint)' },
        'on-signal': 'var(--on-signal)',
        'sky-text': 'var(--sky-text)',
        risk: { DEFAULT: 'var(--risk)', tint: 'var(--risk-tint)' },
        caution: { DEFAULT: 'var(--caution)', tint: 'var(--caution-tint)' },
        positive: { DEFAULT: 'var(--positive)', tint: 'var(--positive-tint)' },
        grade: { platinum: 'var(--grade-platinum)', gold: 'var(--grade-gold)', silver: 'var(--grade-silver)', bronze: 'var(--grade-bronze)' },
        'on-grade': 'var(--on-grade)',
        focus: 'var(--focus)',
        // Brand palette: logo files, heroes and slides only
        brand: { ink: '#0B1B2B', blue: '#2A7FD4', sky: '#4FB8E8', signal: '#19C3A6', paper: '#F4F7F9' },

        'ch-primary': 'hsl(var(--ch-primary-500))',
        'ch-primary-50': 'hsl(var(--ch-primary-50))',
        'ch-primary-100': 'hsl(var(--ch-primary-100))',
        'ch-primary-200': 'hsl(var(--ch-primary-200))',
        'ch-primary-300': 'hsl(var(--ch-primary-300))',
        'ch-primary-400': 'hsl(var(--ch-primary-400))',
        'ch-primary-500': 'hsl(var(--ch-primary-500))',
        'ch-primary-600': 'hsl(var(--ch-primary-600))',
        'ch-primary-700': 'hsl(var(--ch-primary-700))',
        'ch-primary-800': 'hsl(var(--ch-primary-800))',
        'ch-primary-900': 'hsl(var(--ch-primary-900))',
        'ch-primary-950': 'hsl(var(--ch-primary-950))',
        'ch-secondary': 'hsl(var(--ch-secondary-500))',
        'ch-secondary-50': 'hsl(var(--ch-secondary-50))',
        'ch-secondary-100': 'hsl(var(--ch-secondary-100))',
        'ch-secondary-200': 'hsl(var(--ch-secondary-200))',
        'ch-secondary-300': 'hsl(var(--ch-secondary-300))',
        'ch-secondary-400': 'hsl(var(--ch-secondary-400))',
        'ch-secondary-500': 'hsl(var(--ch-secondary-500))',
        'ch-secondary-600': 'hsl(var(--ch-secondary-600))',
        'ch-secondary-700': 'hsl(var(--ch-secondary-700))',
        'ch-secondary-800': 'hsl(var(--ch-secondary-800))',
        'ch-secondary-900': 'hsl(var(--ch-secondary-900))',
        'ch-secondary-950': 'hsl(var(--ch-secondary-950))',
        'ch-tertiary': 'hsl(var(--ch-tertiary-500))',
        'ch-tertiary-50': 'hsl(var(--ch-tertiary-50))',
        'ch-tertiary-100': 'hsl(var(--ch-tertiary-100))',
        'ch-tertiary-200': 'hsl(var(--ch-tertiary-200))',
        'ch-tertiary-300': 'hsl(var(--ch-tertiary-300))',
        'ch-tertiary-400': 'hsl(var(--ch-tertiary-400))',
        'ch-tertiary-500': 'hsl(var(--ch-tertiary-500))',
        'ch-tertiary-600': 'hsl(var(--ch-tertiary-600))',
        'ch-tertiary-700': 'hsl(var(--ch-tertiary-700))',
        'ch-tertiary-800': 'hsl(var(--ch-tertiary-800))',
        'ch-tertiary-900': 'hsl(var(--ch-tertiary-900))',
        'ch-tertiary-950': 'hsl(var(--ch-tertiary-950))',
        primary: {
          DEFAULT: "var(--tenant-primary)",
          foreground: "hsl(var(--primary-foreground))",
          hover: "var(--tenant-primary-hover)",
          light: "var(--tenant-primary-light)",
        },
        secondary: {
          DEFAULT: "var(--tenant-secondary)",
          foreground: "hsl(var(--secondary-foreground))",
          hover: "var(--tenant-secondary-hover)",
        },
        tertiary: {
          DEFAULT: "var(--tenant-accent)",
        },
        /** Tenant on-primary / on-secondary (hex); synced by useTenantBranding */
        'primary-fg': 'var(--tenant-primary-fg)',
        'secondary-fg': 'var(--tenant-secondary-fg)',
        destructive: "hsl(var(--destructive))",
        success: "hsl(var(--tenant-success))",
        warning: "hsl(var(--tenant-warning))",
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar-background))',
          foreground: 'hsl(var(--sidebar-foreground))',
          primary: 'hsl(var(--sidebar-primary))',
          'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
          accent: 'hsl(var(--sidebar-accent))',
          'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
          border: 'hsl(var(--sidebar-border))',
          ring: 'hsl(var(--sidebar-ring))',
        }
      },

      // ─────────────────────────────────────────────────────────────────────
      // TYPOGRAPHY
      // Outfit           — headings, display, section titles, stat numbers
      // Plus Jakarta Sans — body text, UI labels, form inputs, descriptions
      // JetBrains Mono   — document IDs, timestamps, hashes, code snippets
      // ─────────────────────────────────────────────────────────────────────
      fontFamily: {
        display: ['Urbanist', '"Segoe UI"', 'system-ui', 'sans-serif'],
        sans:    ['Urbanist', '"Segoe UI"', 'system-ui', 'sans-serif'],
        mono:    ['"JetBrains Mono"', 'ui-monospace', 'Menlo', 'Consolas', 'monospace'],
      },

      fontSize: {
        // Display scale — Outfit, large headings
        'display-2xl': ['4.5rem', { lineHeight: '1.1', fontWeight: '700' }],
        'display-xl':  ['3.75rem', { lineHeight: '1.1', fontWeight: '700' }],
        'display-lg':  ['3rem', { lineHeight: '1.1', fontWeight: '700' }],
        'display-md':  ['2.25rem', { lineHeight: '1.1', fontWeight: '700' }],
        'display-sm':  ['1.875rem', { lineHeight: '1.1', fontWeight: '700' }],
        'display-xs':  ['1.5rem', { lineHeight: '1.1', fontWeight: '700' }],

        // Text scale — Plus Jakarta Sans, body text
        'text-xl': ['1.25rem', { lineHeight: '1.5', fontWeight: '400' }],
        'text-lg': ['1.125rem', { lineHeight: '1.5', fontWeight: '400' }],
        'text-md': ['1rem', { lineHeight: '1.5', fontWeight: '400' }],
        'text-sm': ['0.875rem', { lineHeight: '1.5', fontWeight: '400' }],
        'text-xs': ['0.75rem', { lineHeight: '1.125rem', fontWeight: '400' }],
      },

      // ─────────────────────────────────────────────────────────────────────
      // SPACING — 4px base grid
      // Tailwind's default scale covers most cases (1=4px, 2=8px, 4=16px…)
      // Only extend values the default scale doesn't cover.
      // ─────────────────────────────────────────────────────────────────────
      spacing: {
        '4.5': '1.125rem',  // 18px — icon container sizing
        '15':  '3.75rem',   // 60px — card padding
        '18':  '4.5rem',    // 72px — large gaps
        '72':  '18rem',     // 288px — sidebar expanded width
      },

      // ─────────────────────────────────────────────────────────────────────
      // ANIMATIONS & KEYFRAMES
      // ─────────────────────────────────────────────────────────────────────
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in-down': {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-left': {
          '0%': { opacity: '0', transform: 'translateX(-10px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'slide-in-right': {
          '0%': { opacity: '0', transform: 'translateX(10px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'skeleton': {
          '0%': { opacity: '1' },
          '50%': { opacity: '0.4' },
          '100%': { opacity: '1' },
        },
        'pulse-ring': {
          '0%': { transform: 'scale(0.33)', opacity: '1' },
          '40%,50%': { opacity: '0.7' },
          '100%': { transform: 'scale(0.9)', opacity: '0' },
        },
      },

      animation: {
        'fade-in': 'fade-in 0.5s ease-out',
        'fade-in-up': 'fade-in-up 0.5s ease-out',
        'fade-in-down': 'fade-in-down 0.5s ease-out',
        'slide-in-left': 'slide-in-left 0.5s ease-out',
        'slide-in-right': 'slide-in-right 0.5s ease-out',
        'scale-in': 'scale-in 0.5s ease-out',
        'skeleton': 'skeleton 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'pulse-ring': 'pulse-ring 1.5s cubic-bezier(0.455, 0.03, 0.515, 0.955) infinite',
      },

      // ─────────────────────────────────────────────────────────────────────
      // SHADOWS
      // ─────────────────────────────────────────────────────────────────────
      boxShadow: {
        'xs':  '0 1px 2px rgba(16, 24, 40, 0.05)',
        'sm':  '0 1px 3px rgba(16, 24, 40, 0.1), 0 1px 2px rgba(16, 24, 40, 0.06)',
        'md':  '0 4px 8px -2px rgba(16, 24, 40, 0.1), 0 2px 4px -2px rgba(16, 24, 40, 0.06)',
        'lg':  '0 12px 16px -4px rgba(16, 24, 40, 0.1), 0 4px 6px -2px rgba(16, 24, 40, 0.05)',
        'xl':  '0 20px 25px -5px rgba(16, 24, 40, 0.1), 0 10px 10px -5px rgba(16, 24, 40, 0.04)',
        '2xl': '0 25px 50px -12px rgba(16, 24, 40, 0.25)',
        'raised': 'var(--shadow-raised)',
        'overlay': 'var(--shadow-overlay)',
        'focus-ring': '0 0 0 4px hsl(var(--ch-primary-500) / 0.14)',
        'cyan-glow': 'none',
        'purple-glow': 'none',
        'inner': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
        'none': '0 0 #0000',
      },

      // ─────────────────────────────────────────────────────────────────────
      // BORDER RADIUS — ControlHub design system scale
      // ─────────────────────────────────────────────────────────────────────
      borderRadius: {
        'none': '0px',
        'sm': '0.125rem',   // 2px
        'DEFAULT': '0.25rem', // 4px
        'md': '0.375rem',   // 6px
        'lg': '0.5rem',     // 8px
        'xl': '0.75rem',    // 12px
        '2xl': '1rem',      // 16px
        '3xl': '1.5rem',    // 24px
        'full': '9999px',
      },

      // ─────────────────────────────────────────────────────────────────────
      // EASING
      // ─────────────────────────────────────────────────────────────────────
      transitionTimingFunction: {
        'spring': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },

    },
  },
  plugins: [],
}