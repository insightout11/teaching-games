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
        'lc-bg': 'var(--lc-bg)',
        'lc-surface': 'var(--lc-surface)',
        'lc-card': 'var(--lc-card)',
        'lc-border': 'var(--lc-border)',
        'lc-border-subtle': 'var(--lc-border-subtle)',
        'lc-text': 'var(--lc-text)',
        'lc-text2': 'var(--lc-text2)',
        'lc-text3': 'var(--lc-text3)',
        'lc-blue': 'var(--lc-blue)',
        'lc-blue-hover': 'var(--lc-blue-hover)',
        'lc-blue-glow': 'var(--lc-blue-glow)',
        'lc-success': '#2FE59B',
        'lc-warn': '#F6C177',
        'lc-danger': '#FF4D4D',
        'lc-amber': 'var(--lc-amber)',
        'lc-amber-glow': 'var(--lc-amber-glow)',
        'lc-amber-muted': 'var(--lc-amber-muted)',
      },
    },
  },
  plugins: [],
};
export default config;
