/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Legacy notion tokens (kept for other views)
        notion: {
          bg: '#1e1e1e',
          card: '#2d2d2d',
          border: '#3d3d3d',
          hover: '#3d3d3d',
          accent: '#fbbf24',
          textPrimary: '#ffffff',
          textSecondary: '#a0a0a0',
          textMuted: '#6b6b6b',
        },
        // Academic Pro design tokens
        ap: {
          bg:        '#121212',   // root background
          surface:   '#131412',   // sidebar / topbar
          level1:    '#1e1e1e',   // card background
          level2:    '#2a2a2a',   // hover / input / inner card
          border:    '#2a2a2a',   // default border
          border2:   '#333333',   // inner borders
          sage:      '#8ea091',   // primary accent (CTA, active nav)
          sageDark:  '#27372b',   // text on sage
          muted:     '#a0a0a0',   // secondary text
          faint:     '#6b6b6b',   // placeholder / very muted
          error:     '#ffb4ab',   // error text
          errorBg:   '#ffdad6',   // error badge bg
          errorText: '#690005',   // error badge text
          success:   '#d5e7d7',   // success badge bg
          successText:'#0f1f15', // success badge text
          bronze:    '#cd7f32',
          silver:    '#c0c0c0',
          gold:      '#ffd700',
        }
      },
      fontFamily: {
        headline: ['"Hanken Grotesk"', 'sans-serif'],
        body:     ['Inter', 'sans-serif'],
        label:    ['Geist', 'Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
