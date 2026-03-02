/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'blue-950': '#0a1929',
      },
      backdropBlur: {
        'xs': '2px',
      }
    },
  },
  plugins: [],
}