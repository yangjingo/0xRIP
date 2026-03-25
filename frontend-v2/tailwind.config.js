/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        mv: {
          bg: '#fafafa',
          white: '#ffffff',
          'gray-light': '#e8e8e8',
          gray: '#c0c0c0',
          'gray-dark': '#808080',
          charcoal: '#404040',
          text: '#1a1a1a',
          'text-dim': '#666666',
        },
        sheikah: {
          blue: '#00d4ff',
        }
      },
      fontFamily: {
        serif: ['"Cormorant Garamond"', 'serif'],
        mono: ['"Space Mono"', 'monospace'],
      }
    },
  },
  plugins: [],
}