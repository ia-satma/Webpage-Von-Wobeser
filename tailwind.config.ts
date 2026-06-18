import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./client/index.html", "./client/src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    /* ── Breakpoints del sitio viejo (max-width → mobile-first reverse).
       El mirror usa 980/800/680/480 como cortes. Los exponemos como min-width
       para Tailwind manteniendo los defaults sm/md/lg/xl/2xl. ── */
    screens: {
      sm: "480px",
      md: "680px",
      lg: "800px",
      xl: "980px",
      "2xl": "1340px",
    },
    container: {
      center: true,
      screens: {
        "2xl": "1340px",
      },
    },
    extend: {
      borderRadius: {
        lg: ".5625rem", /* 9px */
        md: ".375rem", /* 6px */
        sm: ".1875rem", /* 3px */
      },
      colors: {
        // Flat / base colors (regular buttons)
        background: "hsl(var(--background) / <alpha-value>)",
        foreground: "hsl(var(--foreground) / <alpha-value>)",
        border: "hsl(var(--border) / <alpha-value>)",
        input: "hsl(var(--input) / <alpha-value>)",
        card: {
          DEFAULT: "hsl(var(--card) / <alpha-value>)",
          foreground: "hsl(var(--card-foreground) / <alpha-value>)",
          border: "hsl(var(--card-border) / <alpha-value>)",
        },
        popover: {
          DEFAULT: "hsl(var(--popover) / <alpha-value>)",
          foreground: "hsl(var(--popover-foreground) / <alpha-value>)",
          border: "hsl(var(--popover-border) / <alpha-value>)",
        },
        primary: {
          DEFAULT: "hsl(var(--primary) / <alpha-value>)",
          foreground: "hsl(var(--primary-foreground) / <alpha-value>)",
          border: "var(--primary-border)",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary) / <alpha-value>)",
          foreground: "hsl(var(--secondary-foreground) / <alpha-value>)",
          border: "var(--secondary-border)",
        },
        muted: {
          DEFAULT: "hsl(var(--muted) / <alpha-value>)",
          foreground: "hsl(var(--muted-foreground) / <alpha-value>)",
          border: "var(--muted-border)",
        },
        accent: {
          DEFAULT: "hsl(var(--accent) / <alpha-value>)",
          foreground: "hsl(var(--accent-foreground) / <alpha-value>)",
          border: "var(--accent-border)",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive) / <alpha-value>)",
          foreground: "hsl(var(--destructive-foreground) / <alpha-value>)",
          border: "var(--destructive-border)",
        },
        ring: "hsl(var(--ring) / <alpha-value>)",
        chart: {
          "1": "hsl(var(--chart-1) / <alpha-value>)",
          "2": "hsl(var(--chart-2) / <alpha-value>)",
          "3": "hsl(var(--chart-3) / <alpha-value>)",
          "4": "hsl(var(--chart-4) / <alpha-value>)",
          "5": "hsl(var(--chart-5) / <alpha-value>)",
        },
        sidebar: {
          ring: "hsl(var(--sidebar-ring) / <alpha-value>)",
          DEFAULT: "hsl(var(--sidebar) / <alpha-value>)",
          foreground: "hsl(var(--sidebar-foreground) / <alpha-value>)",
          border: "hsl(var(--sidebar-border) / <alpha-value>)",
        },
        "sidebar-primary": {
          DEFAULT: "hsl(var(--sidebar-primary) / <alpha-value>)",
          foreground: "hsl(var(--sidebar-primary-foreground) / <alpha-value>)",
          border: "var(--sidebar-primary-border)",
        },
        "sidebar-accent": {
          DEFAULT: "hsl(var(--sidebar-accent) / <alpha-value>)",
          foreground: "hsl(var(--sidebar-accent-foreground) / <alpha-value>)",
          border: "var(--sidebar-accent-border)"
        },
        status: {
          online: "rgb(34 197 94)",
          away: "rgb(245 158 11)",
          busy: "rgb(239 68 68)",
          offline: "rgb(156 163 175)",
        },
        // ── Von Wobeser OLD DESIGN tokens (mirror Joomla beez3) ──
        "vw-red": "#ac162c",        // rojo corporativo (links/underlines)
        "vw-gray": "#5e5e5e",       // gris oscuro / texto base / footer
        "vw-graylight": "#c4c4c4",  // gris claro / fondo nav overlay
        "vw-white": "#ffffff",
        "vw-black": "#1d1d1b",
      },
      fontFamily: {
        // OLD-DESIGN families (self-hosted .woff del mirror beez3).
        // body / running text:
        sans: ["'OptimaLTStd'", "'Optima'", "'Lato'", "Calibri", "sans-serif"],
        // headings / hero:
        serif: ["'Publico-Roman'", "Georgia", "'Times New Roman'", "serif"],
        // labels / menu / uppercase:
        label: ["'Geomanist-Book'", "'Century Gothic'", "'Lato'", "sans-serif"],
        // Explicit aliases (sin ambigüedad) para los workers:
        "publico-roman": ["'Publico-Roman'", "Georgia", "serif"],
        "optima-old": ["'OptimaLTStd'", "'Optima'", "'Lato'", "sans-serif"],
        "geomanist-book": ["'Geomanist-Book'", "'Century Gothic'", "'Lato'", "sans-serif"],
        // Familias previas conservadas (compat con el design system existente):
        heading: ["var(--font-heading)"],
        support: ["var(--font-support)"],
        mono: ["var(--font-mono)"],
        publico: ["'Playfair Display'", "Georgia", "serif"],
        optima: ["'Optima'", "'Lato'", "Calibri", "sans-serif"],
        geomanist: ["'Geomanist'", "'Century Gothic'", "'Lato'", "sans-serif"],
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
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
} satisfies Config;
