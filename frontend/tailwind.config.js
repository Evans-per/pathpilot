/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        accent: {
          light: '#818cf8', // Indigo 400
          DEFAULT: '#6366f1', // Indigo 500 (Primary)
          dark: '#4f46e5' // Indigo 600
        },
        secondary: {
          light: '#a78bfa', // Violet 400
          DEFAULT: '#8b5cf6', // Violet 500 (Secondary)
          dark: '#7c3aed' // Violet 600
        },
        success: {
          DEFAULT: '#22c55e' // Green 500 (Accent)
        },
        warning: {
          DEFAULT: '#f59e0b' // Amber 500
        },
        danger: {
          DEFAULT: '#ef4444' // Red 500
        },
        darkbg: {
          DEFAULT: '#0f172a', // Slate 900 (Dark Background)
          card: '#111827', // Gray 900 (Card Background)
          border: '#1e293b' // Slate 800 (Surface)
        }
      },
      fontFamily: {
        sans: ['Inter', 'Outfit', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}
