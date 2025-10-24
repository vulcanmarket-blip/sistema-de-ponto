// SUBSTITUA o seu layout.jsx (ou .js) por isto.
    //
    // Importamos as fontes Bebas Neue (títulos) e Poppins (corpo)

    import { Bebas_Neue, Poppins } from "next/font/google";
    import "./globals.css";

    // Configuração da Poppins (Corpo)
    const poppins = Poppins({
      subsets: ["latin"],
      weight: ['400', '700'], // Pesos que vamos usar
      variable: '--font-poppins', // Nome da variável CSS
    });

    // Configuração da Bebas Neue (Títulos)
    const bebasNeue = Bebas_Neue({
      subsets: ["latin"],
      weight: '400',
      variable: '--font-bebas-neue', // Nome da variável CSS
    });

    export const metadata = {
      title: "Sistema de Ponto",
      description: "Sistema de Ponto v1.0",
    };

    export default function RootLayout({ children }) {
      return (
        <html lang="pt-br">
          {/* Aplicamos as duas variáveis de fonte ao <html>
            e definimos a 'poppins' (font-sans) como a fonte padrão do body 
          */}
          <body className={`${poppins.variable} ${bebasNeue.variable} font-sans`}>
            <main className="flex min-h-screen flex-col items-center justify-center p-4">
              <div className="w-full max-w-md">
                {children}
              </div>
            </main>
          </body>
        </html>
      );
    }
    
