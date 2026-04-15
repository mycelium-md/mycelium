import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#0a0a0a",
        surface: "#111114",
        "surface-2": "#1a1a1f",
        border: "#2a2a30",
        muted: "#6b6b78",
        text: "#f5f5f0",
        "text-muted": "#9999aa",
        accent: "#5DCAA5",
        "accent-dim": "#3d8a72",
      },
      fontFamily: {
        syne: ["var(--font-syne)", "sans-serif"],
        serif: ["var(--font-instrument-serif)", "Georgia", "serif"],
      },
      fontSize: {
        "hero": ["clamp(3rem,8vw,5.5rem)", { lineHeight: "0.95", letterSpacing: "-0.02em" }],
        "display": ["clamp(2rem,5vw,3.5rem)", { lineHeight: "1.0", letterSpacing: "-0.02em" }],
        "headline": ["clamp(1.5rem,3vw,2.25rem)", { lineHeight: "1.1", letterSpacing: "-0.01em" }],
      },
      spacing: {
        "section": "8rem",
        "section-sm": "5rem",
      },
      animation: {
        "pulse-glow": "pulseGlow 3s ease-in-out infinite",
        "counter": "counterIn 0.6s ease-out forwards",
        "line-reveal": "lineReveal 0.8s ease-out forwards",
        "fade-up": "fadeUp 0.7s ease-out forwards",
      },
      keyframes: {
        pulseGlow: {
          "0%, 100%": { transform: "scale(1)", opacity: "1" },
          "50%": { transform: "scale(1.15)", opacity: "0.85" },
        },
        lineReveal: {
          "0%": { clipPath: "inset(0 100% 0 0)" },
          "100%": { clipPath: "inset(0 0% 0 0)" },
        },
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(24px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
