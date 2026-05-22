/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/client/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // 0xRIP — pure monochrome ASCII terminal
        term: {
          black:  '#000000',
          bg:     '#0a0a0a',
          fg:     '#ffffff',
          dim:    '#888888',
          faint:  '#444444',
          inv:    '#ffffff',  // inverted: white bg
        },
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', '"Courier New"', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
}
