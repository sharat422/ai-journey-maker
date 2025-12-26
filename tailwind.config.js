
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'step-complete': 'stepComplete 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        stepComplete: {
          '0%': { transform: 'scale(1)' },
          '40%': { transform: 'scale(1.02)', borderColor: '#10b981', backgroundColor: '#f0fdf4' },
          '100%': { transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
}
