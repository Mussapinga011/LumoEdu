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
        primary: {
          DEFAULT: '#6366F1', // Indigo/Purple do ícone
          hover: '#4F46E5',
          shade: '#4338CA', // Darker shade para efeito 3D
        },
        secondary: {
          DEFAULT: '#8B5CF6', // Purple/Violet do ícone
          hover: '#7C3AED',
          shade: '#6D28D9',
        },
        accent: {
          DEFAULT: '#EC4899', // Pink/Magenta do ícone
          hover: '#DB2777',
          shade: '#BE185D',
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
