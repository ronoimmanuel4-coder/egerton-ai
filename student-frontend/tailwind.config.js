/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'egerton-green': '#00a651',
        'egerton-dark-green': '#007624',
        'egerton-red': '#ed1c24',
        'egerton-gold': '#d2ac67',
        'egerton-light-gray': '#bcbec1',
        'egerton-light-green-bg': '#e0eee1',
      },
      fontFamily: {
        sans: ['Inter', 'Helvetica Neue', 'Arial', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
