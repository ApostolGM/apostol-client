/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        wasteland: {
          900: '#0d0d0d',
          800: '#1a1a1a',
          700: '#262626',
          600: '#333333',
          500: '#4d4d4d',
          400: '#808080',
          300: '#b3b3b3',
          200: '#cccccc',
          100: '#e6e6e6',
        },
        accent: {
          red: '#cc3333',
          orange: '#cc6600',
          yellow: '#cccc00',
          green: '#33cc33',
        }
      },
      fontFamily: {
        mono: ['Courier New', 'monospace'],
        stylized: ['Georgia', 'serif'],
      }
    },
  },
  plugins: [],
};
