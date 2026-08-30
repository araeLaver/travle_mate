/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Fryndo design system (claude.ai/design "Mobile app design brief")
        primary: {
          50: '#F8F7FF',
          100: '#ECEBFF',
          200: '#D6D2FF',
          300: '#B3ABFF',
          400: '#8E7BFF',
          500: '#4A3AFF',
          600: '#4A3AFF',
          700: '#2A1BC7',
          800: '#2317A3',
          900: '#1C1281',
        },
        ink: '#101014',
        sand: {
          50: '#FAFAF8',
          100: '#F5F4F1',
          200: '#F0EFEB',
          300: '#EFEEEA',
          400: '#E1E0DB',
          500: '#DEDDD8',
        },
        rarity: {
          common: '#8A8A95',
          rare: '#2E7DF6',
          epic: '#8B45E8',
          legendary: '#E0952A',
        },
        success: '#3F8F5F',
        danger: '#B4453B',
      },
      fontFamily: {
        sans: ['Manrope', 'Noto Sans KR', 'sans-serif'],
        display: ['Playfair Display', 'serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-down': 'slideDown 0.5s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
        float: 'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-20px)' },
        },
      },
    },
  },
  plugins: [],
};
