import typography from "@tailwindcss/typography";
import containerQueries from "@tailwindcss/container-queries";
import animate from "tailwindcss-animate";

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["index.html", "src/**/*.{js,ts,jsx,tsx,html,css}"],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: { "2xl": "1400px" },
    },
    extend: {
      fontFamily: {
        display: ["Fraunces", "serif"],
        serif: ["Crimson Pro", "serif"],
        body: ["General Sans", "sans-serif"],
      },
      colors: {
        border: "oklch(var(--border))",
        input: "oklch(var(--input))",
        ring: "oklch(var(--ring) / <alpha-value>)",
        background: "oklch(var(--background))",
        foreground: "oklch(var(--foreground))",
        primary: {
          DEFAULT: "oklch(var(--primary) / <alpha-value>)",
          foreground: "oklch(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "oklch(var(--secondary) / <alpha-value>)",
          foreground: "oklch(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "oklch(var(--destructive) / <alpha-value>)",
          foreground: "oklch(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "oklch(var(--muted) / <alpha-value>)",
          foreground: "oklch(var(--muted-foreground) / <alpha-value>)",
        },
        accent: {
          DEFAULT: "oklch(var(--accent) / <alpha-value>)",
          foreground: "oklch(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "oklch(var(--popover))",
          foreground: "oklch(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "oklch(var(--card))",
          foreground: "oklch(var(--card-foreground))",
        },
        maroon: {
          DEFAULT: "oklch(var(--maroon))",
          dark: "oklch(var(--maroon-dark))",
          light: "oklch(var(--maroon-light))",
        },
        gold: {
          DEFAULT: "oklch(var(--gold))",
          bright: "oklch(var(--gold-bright))",
          dim: "oklch(var(--gold-dim))",
        },
        cream: {
          DEFAULT: "oklch(var(--cream))",
          dark: "oklch(var(--cream-dark))",
        },
        chart: {
          1: "oklch(var(--chart-1, 65 0.15 30))",
          2: "oklch(var(--chart-2, 72 0.16 75))",
          3: "oklch(var(--chart-3, 60 0.1 220))",
          4: "oklch(var(--chart-4, 75 0.12 150))",
          5: "oklch(var(--chart-5, 55 0.08 280))",
        },
        sidebar: {
          DEFAULT: "oklch(var(--sidebar, 97 0.012 85))",
          foreground: "oklch(var(--sidebar-foreground, 22 0.05 30))",
          primary: "oklch(var(--sidebar-primary, 33 0.16 18))",
          "primary-foreground": "oklch(var(--sidebar-primary-foreground, 97 0.012 85))",
          accent: "oklch(var(--sidebar-accent, 93 0.01 80))",
          "accent-foreground": "oklch(var(--sidebar-accent-foreground, 22 0.05 30))",
          border: "oklch(var(--sidebar-border, 88 0.015 78))",
          ring: "oklch(var(--sidebar-ring, 72 0.12 60))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        card: "0 2px 12px oklch(var(--maroon) / 0.08), 0 1px 3px oklch(var(--maroon) / 0.05)",
        "card-hover": "0 8px 30px oklch(var(--maroon) / 0.15), 0 2px 8px oklch(var(--maroon) / 0.08)",
        gold: "0 0 20px oklch(var(--gold) / 0.45)",
        "gold-sm": "0 0 10px oklch(var(--gold) / 0.3)",
        header: "0 2px 20px oklch(var(--maroon-dark) / 0.4)",
        xs: "0 1px 2px 0 rgba(0,0,0,0.05)",
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
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        shimmer: "shimmer 2s infinite linear",
      },
    },
  },
  plugins: [typography, containerQueries, animate],
};
