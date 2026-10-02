/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      colors: {
        brand: {
          50: 'var(--brand-50, #EEF2FF)',
          100: 'var(--brand-100, #E0E7FF)',
          200: 'var(--brand-200, #C7D2FE)',
          300: 'var(--brand-300, #A5B4FC)',
          400: 'var(--brand-400, #818CF8)',
          500: 'var(--brand-500, #6366F1)',
          600: 'var(--brand-600, #4F46E5)',
          700: 'var(--brand-700, #4338CA)',
          800: 'var(--brand-800, #3730A3)',
          900: 'var(--brand-900, #312E81)',
        },
        surface: {
          light: '#FFFFFF',
          dark: '#1A1C22',
          'light-elevated': '#FFFFFF',
          'dark-elevated': '#22252D',
        },
        canvas: {
          light: '#F8F8F5',
          dark: '#111216',
        },
        border: {
          light: '#E6E6E1',
          dark: '#2A2E39',
        }
      },
      boxShadow: {
        'subtle': '0 1px 2px 0 rgba(0, 0, 0, 0.04), 0 1px 3px 1px rgba(0, 0, 0, 0.02)',
        'elevated': '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.03)',
        'modal': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)',
      },
      borderRadius: {
        'card': '14px',
        'modal': '16px',
        'input': '10px',
      }
    },
  },
  plugins: [],
}
