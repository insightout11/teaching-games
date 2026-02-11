import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/games/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/activities/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        'lc-bg': '#070B14',
        'lc-surface': '#0B1220',
        'lc-card': '#101A2E',
        'lc-border': '#1C2A44',
        'lc-border-subtle': '#132033',
        'lc-text': '#EAF1FF',
        'lc-text2': '#A9B7D0',
        'lc-text3': '#6F7F9C',
        'lc-blue': '#4DA3FF',
        'lc-blue-hover': '#78BCFF',
        'lc-blue-glow': 'rgba(77,163,255,0.22)',
        'lc-success': '#2FE59B',
        'lc-warn': '#F6C177',
        'lc-danger': '#FF4D4D',
      },
    },
  },
  plugins: [],
};
export default config;
