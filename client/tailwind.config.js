/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          900: '#0d1829',
          800: '#132238',
          700: '#1b2a4a',
        },
        brand: {
          blue: '#0d5f96',
          darkBlue: '#094773',
          yellow: '#f59e0b',
          purple: '#6366f1',
          crimson: '#b91c1c',
        },
      },
    },
  },
  plugins: [],
};

