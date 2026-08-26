/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
        },
        surface: {
          0: '#06080f',
          1: '#0b0f1a',
          2: '#0f1420',
          3: '#141a2a',
          4: '#1a2035',
        },
      },
      animation: {
        'fade-in': 'fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'fade-in-slow': 'fadeInUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
        'gradient-shift': 'gradient-shift 4s ease infinite',
      },
      backgroundImage: {
        'grid-pattern': 'linear-gradient(rgba(99, 102, 241, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(99, 102, 241, 0.03) 1px, transparent 1px)',
      },
      backgroundSize: {
        'grid': '32px 32px',
      },
      boxShadow: {
        'glow-sm': '0 0 15px -3px rgba(99, 102, 241, 0.15)',
        'glow-md': '0 0 25px -5px rgba(99, 102, 241, 0.2)',
        'glow-lg': '0 0 40px -5px rgba(99, 102, 241, 0.25)',
        'inner-glow': 'inset 0 1px 0 0 rgba(148, 163, 184, 0.05)',
      },
    },
  },
  plugins: [],
};
