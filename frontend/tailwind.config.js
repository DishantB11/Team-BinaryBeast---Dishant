/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        notion: {
          bg: '#1e1e1e',
          card: '#2d2d2d',
          border: '#3d3d3d',
          hover: '#3d3d3d',
          accent: '#fbbf24', // yellow-400
          textPrimary: '#ffffff',
          textSecondary: '#a0a0a0',
          textMuted: '#6b6b6b',
        }
      }
    },
  },
  plugins: [],
}
