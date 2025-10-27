// Verifique se o conteúdo é EXATAMENTE este
import defaultTheme from 'tailwindcss/defaultTheme';

/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#800020',
        accent: '#221f1f',
        'accent-light': '#3a3a3a',
        light: '#f4efe7',
      },
      fontFamily: {
        sans: ['var(--font-poppins)', ...defaultTheme.fontFamily.sans],
        title: ['var(--font-bebas-neue)', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
