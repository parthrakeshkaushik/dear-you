import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ['class', '[data-platform-theme="dark"]'],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        platform: {
          bg: "var(--platform-bg)",
          card: "var(--platform-card)",
          cardSubtle: "var(--platform-card-subtle)",
          text: "var(--platform-text)",
          muted: "var(--platform-muted)",
          lavender: "var(--platform-lavender)",
          violet: "var(--platform-violet)",
          gold: "var(--platform-gold)",
          border: "var(--platform-border)",
          borderStrong: "var(--platform-border-strong)",
          inputBg: "var(--platform-input-bg)",
          inputBorder: "var(--platform-input-border)",
          elevated: "var(--platform-elevated)",
          hover: "var(--platform-hover)",
          dark: "var(--platform-btn-bg)",
          btnBg: "var(--platform-btn-bg)",
          btnText: "var(--platform-btn-text)",
          btnHover: "var(--platform-btn-hover)",
          textOnLight: "var(--platform-text-on-light)",
          textOnDark: "var(--platform-text-on-dark)",
          textMutedOnLight: "var(--platform-text-muted-on-light)",
          textMutedOnDark: "var(--platform-text-muted-on-dark)",
          modalBg: "var(--platform-modal-bg)",
          placeholder: "var(--platform-placeholder)",
          ivory: "var(--platform-bg)",
          blush: "#F4DCD6",
        },
        gift: {
          bg: "var(--theme-bg)",
          surface: "var(--theme-surface)",
          text: "var(--theme-text)",
          muted: "var(--theme-muted)",
          primary: "var(--theme-primary)",
          secondary: "var(--theme-secondary)",
          accent: "var(--theme-accent)",
          border: "var(--theme-border)",
        },
      },
      fontFamily: {
        serif: ["var(--font-playfair)", "Playfair Display", "serif"],
        sans: ["var(--font-inter)", "Inter", "sans-serif"],
        handwriting: ["var(--font-caveat)", "Caveat", "cursive"],
      },
      animation: {
        "float-slow": "float 6s ease-in-out infinite",
        "pulse-gentle": "pulseGentle 3s ease-in-out infinite",
        "sparkle": "sparkle 2s ease-in-out infinite",
        "shimmer": "shimmer 2.5s linear infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        pulseGentle: {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.85", transform: "scale(1.02)" },
        },
        sparkle: {
          "0%, 100%": { opacity: "0.2", transform: "scale(0.8)" },
          "50%": { opacity: "1", transform: "scale(1.2)" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
