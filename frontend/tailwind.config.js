/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'chess-bg':   '#0A0805',
        'chess-dark': '#0E0C0A',
        cream:        '#DEDBC8',
        amber:        '#E27D38',
        'amber-lt':   '#F0AB6C',
        sand:         '#F7DAC4',
        obsidian:     '#1A1208',
        ivory:        '#F4EFE6',
      },
      fontFamily: {
        outfit:  ['Outfit', 'sans-serif'],
        jakarta: ['Plus Jakarta Sans', 'sans-serif'],
        mono:    ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'float':      'float 8s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 2.5s ease-in-out infinite',
        'slide-up':   'slide-up 0.7s cubic-bezier(0.16,1,0.3,1) forwards',
      },
      keyframes: {
        float:       { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-14px)' } },
        'pulse-glow':{ '0%,100%': { opacity: '0.5' }, '50%': { opacity: '1' } },
        'slide-up':  { from: { opacity: '0', transform: 'translateY(40px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
      },
    },
  },
  plugins: [],
};
