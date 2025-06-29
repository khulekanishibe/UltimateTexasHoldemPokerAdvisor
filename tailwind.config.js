/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        poker: {
          felt: '#0f5132',
          feltDark: '#0a3d26',
          gold: '#ffd700',
          silver: '#c0c0c0'
        }
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-subtle': 'bounce 1s ease-in-out 3'
      }
    },
  },
  plugins: [],
};