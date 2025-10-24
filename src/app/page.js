    // SUBSTITUA o seu page.jsx (ou .js) por isto.
    //
    // Esta é a sua página principal. Ela é um "Server Component".
    // Ela busca os dados no servidor e passa-os para o "PontoApp".

    import { getInitialData } from './actions';
    import PontoApp from './components/PontoApp';

    export default async function HomePage() {
      // Busca os dados no servidor antes de a página carregar
      const { departamentos, users, error } = await getInitialData();

      if (error) {
        return <p className="text-red-500 text-center">{error}</p>;
      }

      // Renderiza o componente "Client" e passa os dados para ele
      // Nota: Adicionamos um 'key' para forçar a recarga se os dados mudarem.
      return (
        <PontoApp 
          key={Date.now()} // Garante que o estado reinicia se a página for recarregada
          initialDepartamentos={departamentos || []} 
          initialUsers={users || []} 
        />
      );
    }