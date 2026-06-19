import tailwindcssAnimate from "tailwindcss-animate"

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
    './app/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        /* Brand scales (Layer 1 primitives in globals.css).
           Note: var-backed hex does not support Tailwind opacity
           modifiers (bg-gold-400/20) — use the --gold-a* tint tokens. */
        gold: {
          50: "var(--gold-50)",
          100: "var(--gold-100)",
          200: "var(--gold-200)",
          300: "var(--gold-300)",
          400: "var(--gold-400)",
          500: "var(--gold-500)",
          600: "var(--gold-600)",
          700: "var(--gold-700)",
          800: "var(--gold-800)",
          900: "var(--gold-900)",
          950: "var(--gold-950)",
          DEFAULT: "var(--gold-400)",
        },
        petrol: {
          50: "var(--petrol-50)",
          100: "var(--petrol-100)",
          200: "var(--petrol-200)",
          300: "var(--petrol-300)",
          400: "var(--petrol-400)",
          500: "var(--petrol-500)",
          600: "var(--petrol-600)",
          700: "var(--petrol-700)",
          800: "var(--petrol-800)",
          900: "var(--petrol-900)",
          950: "var(--petrol-950)",
          DEFAULT: "var(--petrol-800)",
        },
        neutral: {
          50: "var(--neutral-50)",
          100: "var(--neutral-100)",
          200: "var(--neutral-200)",
          300: "var(--neutral-300)",
          400: "var(--neutral-400)",
          500: "var(--neutral-500)",
          600: "var(--neutral-600)",
          700: "var(--neutral-700)",
          800: "var(--neutral-800)",
          900: "var(--neutral-900)",
          950: "var(--neutral-950)",
        },
        success: "var(--success-600)",
        warning: "var(--warning-600)",
        error: "var(--error-600)",
        info: "var(--info-600)",
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive) / <alpha-value>)",
          foreground: "hsl(var(--destructive-foreground) / <alpha-value>)",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "Georgia", "serif"],
        data: ["var(--font-data)", "sans-serif"],
      },
      fontSize: {
        /* Fluid type scale — clamp(min, preferred, max). Mobile floor never
           drops below 0.875rem (14px). fluid-5xl/6xl intentionally mirror
           the literal clamp() values already shipped in globals.css (h1)
           and HeroSection.tsx (H1), so there is one growth curve, not two. */
        "fluid-xs": ["clamp(0.75rem, 0.6rem + 0.7vw, 0.8125rem)", { lineHeight: "1.5" }],
        "fluid-sm": ["clamp(0.875rem, 0.78rem + 0.5vw, 0.9375rem)", { lineHeight: "1.5" }],
        "fluid-base": ["clamp(0.875rem, 0.78rem + 0.6vw, 1rem)", { lineHeight: "1.6" }],
        "fluid-lg": ["clamp(1rem, 0.85rem + 0.8vw, 1.125rem)", { lineHeight: "1.5" }],
        "fluid-xl": ["clamp(1.125rem, 0.95rem + 1vw, 1.375rem)", { lineHeight: "1.4" }],
        "fluid-2xl": ["clamp(1.375rem, 1.05rem + 1.5vw, 1.75rem)", { lineHeight: "1.3" }],
        "fluid-3xl": ["clamp(1.75rem, 1.2rem + 2.2vw, 2.25rem)", { lineHeight: "1.2" }],
        "fluid-4xl": ["clamp(2rem, 4vw, 3.5rem)", { lineHeight: "1.15" }],
        "fluid-5xl": ["clamp(2.5rem, 6vw, 4.5rem)", { lineHeight: "1.05" }],
        "fluid-6xl": ["clamp(3rem, 7vw, 6rem)", { lineHeight: "1.05" }],
      },
      spacing: {
        /* Fluid spacing tokens for padding/gap. fluid-xl/2xl mirror the
           existing .page-padding / .section-gap utilities in globals.css. */
        "fluid-xs": "clamp(0.5rem, 0.6vw, 0.75rem)",
        "fluid-sm": "clamp(0.75rem, 1vw, 1rem)",
        "fluid-md": "clamp(1rem, 1.5vw, 1.5rem)",
        "fluid-lg": "clamp(1.5rem, 3vw, 2.5rem)",
        "fluid-xl": "clamp(2rem, 4vw, 4rem)",
        "fluid-2xl": "clamp(4rem, 8vw, 8rem)",
        /* Logo morph dock tokens — dedicated and exclusive. Do NOT reuse
           the fluid-* tokens above here: useScrollLogoMorph.ts measures
           these three rects live and depends on them staying in lockstep
           with each other and with MorphingLogo.tsx's own width. */
        "logo-hero": "clamp(22rem, 38vw, 32rem)",
        "logo-nav-desktop": "clamp(5rem, 7vw, 7rem)",
        "logo-nav-mobile": "clamp(4.5rem, 10vw, 6rem)",
      },
      borderRadius: {
        xl: "calc(var(--radius) + 4px)",
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xs: "calc(var(--radius) - 6px)",
      },
      boxShadow: {
        xs: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "caret-blink": {
          "0%,70%,100%": { opacity: "1" },
          "20%,50%": { opacity: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "caret-blink": "caret-blink 1.25s ease-out infinite",
      },
    },
  },
  plugins: [tailwindcssAnimate],
}