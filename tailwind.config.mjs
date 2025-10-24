// CRIE OU SUBSTITUA este ficheiro na raiz do seu projeto.
//
// Este ficheiro define as SUAS cores e fontes.

import defaultTheme from 'tailwindcss/defaultTheme'; // ESTA É A IMPORTAÇÃO CORRETA

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
        // --- SUAS CORES PERSONALIZADAS ---
        primary: '#800020', // Vinho / Borgonha (Botões de Ação)
        accent: '#221f1f',  // Quase Preto / Carvão (Fundo dos cartões)
        'accent-light': '#3a3a3a', // Um cinza um pouco mais claro para inputs
        light: '#f4efe7',   // Branco "Casca de Ovo" (Fundo principal)
      },
      fontFamily: {
        // --- SUAS FONTES (Substitutos do Google Fonts) ---
        // Bebas Neue para títulos e Poppins para corpo
        sans: ['var(--font-poppins)', ...defaultTheme.fontFamily.sans],
        title: ['var(--font-bebas-neue)', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;