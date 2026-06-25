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
      keyframes: {
        'cell-claim': {
          '0%':   { transform: 'scale(0.4)', opacity: '0' },
          '60%':  { transform: 'scale(1.2)' },
          '100%': { transform: 'scale(1)',   opacity: '1' },
        },
        'cell-shake': {
          '0%, 100%': { transform: 'translateX(0)   scale(0.88)' },
          '20%':      { transform: 'translateX(-5px) scale(0.82)' },
          '40%':      { transform: 'translateX(5px)  scale(0.82)' },
          '60%':      { transform: 'translateX(-3px) scale(0.85)' },
          '80%':      { transform: 'translateX(3px)  scale(0.85)' },
        },
        'cell-flash': {
          '0%, 100%': { opacity: '1',   transform: 'scale(1.08)' },
          '50%':      { opacity: '0.4', transform: 'scale(1)' },
        },
        'radar-sweep': {
          from: { transform: 'rotate(0deg)' },
          to:   { transform: 'rotate(360deg)' },
        },
        'target-lock': {
          '0%':   { transform: 'scale(1.6)', opacity: '0' },
          '60%':  { transform: 'scale(0.92)', opacity: '1' },
          '100%': { transform: 'scale(1)',   opacity: '1' },
        },
      },
      animation: {
        'cell-claim': 'cell-claim 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        'cell-shake': 'cell-shake 0.55s ease-in-out forwards',
        'cell-flash': 'cell-flash 0.5s ease-in-out infinite',
        'radar-sweep': 'radar-sweep 4s linear infinite',
        'target-lock': 'target-lock 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
      },
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
        'lc-info': 'var(--lc-info)',
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
