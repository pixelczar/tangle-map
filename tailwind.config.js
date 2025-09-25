/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Instrument Sans"', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', '"Apple Color Emoji"', '"Segoe UI Emoji"', '"Segoe UI Symbol"'],
        serif: ['"Instrument Serif"', 'ui-serif', 'Georgia', 'Cambria', '"Times New Roman"', 'Times', 'serif']
      },
      colors: {
        primary: {
          50: '#faf8f5',
          100: '#f0ebe0',
          200: '#e1d5c0',
          300: '#d0bd9a',
          400: '#bfa474',
          500: '#a48a5a',
          600: '#8a7049',
          700: '#6d5439',
          800: '#4a3a2a',
          900: '#2a221a'
        }
      }
    },
  },
  plugins: [],
}
