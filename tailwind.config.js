/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Cores sincronizadas com o ícone da aplicação
        // LumoEdu Brand Colors
        primary: {
          DEFAULT: '#3B82F6', // Blue "Lumo"
          hover: '#2563EB',
          shade: '#1D4ED8',
        },
        secondary: {
          DEFAULT: '#22C55E', // Green "Edu"
          hover: '#16A34A',
          shade: '#15803D',
        },
        accent: {
          DEFAULT: '#FFB800', // Yellow Mascot
          hover: '#E5A600',
          shade: '#CC9400',
        },
        danger: {
          DEFAULT: '#EF4444', // Red
          hover: '#DC2626',
          shade: '#B91C1C',
        },
        gray: {
          100: '#F7F7F7',
          200: '#E5E5E5',
          300: '#D4D4D4',
          400: '#A3A3A3',
          500: '#737373',
          700: '#4B4B4B',
          900: '#3C3C3C',
        }
      },
      fontFamily: {
        sans: ['"Nunito"', 'sans-serif'], // Rounded font often used in gamified apps
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
      }
    },
  },
  plugins: [],
}
