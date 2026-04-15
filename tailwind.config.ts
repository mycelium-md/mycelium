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
        // Banner-extracted palette
        bg:           "#08081a",   // near-black navy
        surface:      "#0d0d2b",   // dark indigo-black
        "surface-2":  "#1a1a3a",   // slightly lighter indigo
        border:       "#2a1a4a",   // dark purple border
        muted:        "#6b6b88",   // muted blue-grey
        text:         "#f0eeff",   // off-white with violet tint
        "text-muted": "#9999bb",   // muted violet-grey
        accent:       "#9B5FE3",   // core violet-purple
        "accent-bright": "#C084F5", // light purple highlight
        "accent-deep":   "#6A1FA8", // deep purple
        "accent-glow":   "#B066FF", // bloom glow
        "spark-orange":  "#FF8C42", // warm spark
        "spark-cyan":    "#4FC3F7", // cool spark
      },
      fontFamily: {
        syne: ["var(--font-syne)", "sans-serif"],
        serif: ["var(--font-instrument-serif)", "Georgia", "serif"],
      },
      fontSize: {
        "hero":    ["clamp(3rem,8vw,5.5rem)",  { lineHeight: "0.95", letterSpacing: "-0.02em" }],
        "display": ["clamp(2rem,5vw,3.5rem)",  { lineHeight: "1.0",  letterSpacing: "-0.02em" }],
        "headline":["clamp(1.5rem,3vw,2.25rem)",{ lineHeight: "1.1", letterSpacing: "-0.01em" }],
      },
      spacing: {
        "section":    "8rem",
        "section-sm": "5rem",
      },
      animation: {
        "pulse-glow":   "pulseGlow 3s ease-in-out infinite",
        "purple-glow":  "purpleGlow 3s ease-in-out infinite",
        "counter":      "counterIn 0.6s ease-out forwards",
        "line-reveal":  "lineReveal 0.8s ease-out forwards",
        "fade-up":      "fadeUp 0.7s ease-out forwards",
      },
      keyframes: {
        pulseGlow: {
          "0%, 100%": { transform: "scale(1)", opacity: "1" },
          "50%": { transform: "scale(1.15)", opacity: "0.85" },
        },
        purpleGlow: {
          "0%, 100%": { boxShadow: "0 0 20px rgba(155,95,227,0.3)" },
          "50%": { boxShadow: "0 0 40px rgba(176,102,255,0.6)" },
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
