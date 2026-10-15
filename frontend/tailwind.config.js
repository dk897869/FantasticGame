/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        theme: {
          bg: '#0f172a',
          surface: '#1e293b',
          card: '#161f33',
          border: '#334155',
          gold: '#f59e0b',
          goldHover: '#d97706',
          green: '#10b981',
          red: '#ef4444',
          violet: '#8b5cf6'
        }
      }
    },
  },
  plugins: [],
}
