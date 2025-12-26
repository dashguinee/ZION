/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'guinea': {
          red: '#CE1126',
          yellow: '#FCD116',
          green: '#009460',
        }
      }
    },
  },
  plugins: [],
}
