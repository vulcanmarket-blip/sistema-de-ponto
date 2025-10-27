    // Versão final usando @tailwindcss/postcss
    import tailwindcss from '@tailwindcss/postcss'; // <- Alterado aqui
    import autoprefixer from 'autoprefixer';

    export default {
      plugins: [tailwindcss, autoprefixer],
    };
    

