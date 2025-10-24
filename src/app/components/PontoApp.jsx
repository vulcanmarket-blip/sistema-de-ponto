// CRIE este ficheiro em src/app/components/PontoApp.jsx
//
// Este é o "Client Component" - a parte visual e interativa
// que corre no navegador do seu colaborador.

"use client"; // <-- Isto marca-o como um "Client Component"

import { useState, useMemo } from 'react';
// Importamos as nossas "Server Actions" (o backend)
import { 
  handlePrimeiroAcesso, 
  handleLogin, 
  handleBaterPonto 
} from '../actions';

// --- O Componente Principal do Aplicativo ---
export default function PontoApp({ initialDepartamentos, initialUsers }) {
  
  // --- Estados de Controlo ---
  const [departamentos, setDepartamentos] = useState(initialDepartamentos);
  const [users, setUsers] = useState(initialUsers);

  // --- Estados de Seleção do Utilizador ---
  const [selectedDep, setSelectedDep] = useState('');
  const [selectedUser, setSelectedUser] = useState('');
  const [password, setPassword] = useState('');
  
  // --- Estados de "Ecrã" ---
  // A 'etapa' controla qual o ecrã que o utilizador vê:
  // 1. 'LOGIN' (selecionar dep/user)
  // 2. 'REGISTER_PASS' (primeiro acesso, criar senha)
  // 3. 'LOGGED_IN' (ecrã principal de bater o ponto)
  const [etapa, setEtapa] = useState('LOGIN'); 
  
  // --- Estados de Dados Pós-Login ---
  const [currentUser, setCurrentUser] = useState(null);
  const [registros, setRegistros] = useState([]);
  const [relatorio, setRelatorio] = useState(''); // O texto do relatório de saída

  // --- Estados de UI ---
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // --- Lógica de UI ---

  // Filtra a lista de utilizadores SÓ do departamento selecionado
  const usersFiltrados = useMemo(() => {
    if (!selectedDep) return [];
    return users.filter(u => u.departamentoId === selectedDep);
  }, [selectedDep, users]);

  // Verifica se o utilizador selecionado já tem senha ou não
  const isPrimeiroAcesso = useMemo(() => {
    if (!selectedUser) return false;
    const user = users.find(u => u.id === selectedUser);
    // Verificamos o 'password: false' que veio do 'getInitialData'
    // Se o backend não nos enviou um 'password' (que é o caso, pois é 'false'),
    // mas nós ainda não verificámos, assumimos que é o primeiro acesso.
    // O 'user.password' aqui *não* é a senha, é só um campo.
    // O fluxo é: o 'actions.js' nunca manda a senha. O 'page.js' passa
    // os utilizadores para aqui. A lógica de "tem senha?" é feita
    // 100% no backend (no handleLogin/handlePrimeiroAcesso).
    // A nossa lógica aqui é mais simples: se o user selecionou,
    // mostramos o campo de senha.
    
    // A lógica de "primeiro acesso" vs "login normal" será
    // tratada pelo 'handleSubmitLogin'
    return null; // A lógica de primeiro acesso será feita no backend
  }, [selectedUser, users]);

  // Define qual o próximo tipo de batida (Entrada ou Saída)
  const proximoTipoPonto = useMemo(() => {
    if (registros.length === 0) return 'ENTRADA';
    const ultimoRegistro = registros[registros.length - 1];
    return ultimoRegistro.tipo === 'ENTRADA' ? 'SAIDA' : 'ENTRADA';
  }, [registros]);
  

  // --- Funções de Ação (que chamam o Backend) ---

  // Chamada quando o utilizador clica em "Entrar" ou "Criar Senha"
  const handleSubmitLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Vamos tentar fazer o login normal primeiro
    const loginResult = await handleLogin(selectedUser, password);
    
    // SUCESSO NO LOGIN!
    if (loginResult.user) {
      setCurrentUser(loginResult.user);
      setRegistros(loginResult.registros || []);
      setEtapa('LOGGED_IN');
    } 
    // O utilizador não tem senha (primeiro acesso)
    else if (loginResult.error.includes("não configurado")) {
      setEtapa('REGISTER_PASS');
    } 
    // Senha incorreta ou outro erro
    else {
      setError(loginResult.error);
    }
    
    setIsLoading(false);
  };
  
  // Chamada SÓ no ecrã de "Criar Senha"
  const handleSubmitPrimeiroAcesso = async (e) => {
    e.preventDefault();
    if (password.length < 4) {
      setError("A senha deve ter pelo menos 4 caracteres.");
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    const registerResult = await handlePrimeiroAcesso(selectedUser, password);
    
    if (registerResult.user) {
      // Sucesso! Agora fazemos o login automaticamente
      await handleSubmitLogin(e); 
    } else {
      setError(registerResult.error);
    }
    
    setIsLoading(false);
  };

  // Chamada quando clica em "Bater Ponto"
  const handleBaterPontoClick = async () => {
    setIsLoading(true);
    setError('');
    
    const result = await handleBaterPonto(
      currentUser.id, 
      proximoTipoPonto, 
      proximoTipoPonto === 'SAIDA' ? relatorio : null
    );
    
    if (result.error) {
      setError(result.error);
    } else {
      // Sucesso!
      // A página vai recarregar automaticamente por causa do 'revalidatePath'
      // que o 'handleBaterPonto' chamou.
      // Por agora, apenas limpamos o relatório.
      setRelatorio('');
      
      // Numa v2, poderíamos atualizar o estado 'registros' localmente
      // em vez de forçar um recarregamento.
      
      // Forçamos o recarregamento da página para buscar os novos dados
      window.location.reload();
    }
    
    setIsLoading(false);
  };
  
  // --- Funções de Logout/Trocar Utilizador ---
  const handleLogout = () => {
    setCurrentUser(null);
    setSelectedUser('');
    setSelectedDep('');
    setPassword('');
    setRegistros([]);
    setError('');
    setEtapa('LOGIN');
  };

  // --- Renderização dos Ecrãs ---

  // Ecrã 1: LOGIN
  if (etapa === 'LOGIN') {
    return (
      <div className="bg-accent text-light p-8 rounded-lg shadow-2xl animate-fade-in">
        <h1 className="font-title text-4xl text-center mb-2">SISTEMA DE PONTO</h1>
        <h2 className="font-title text-2xl text-primary text-center mb-8">VULCANO v1.0</h2>
        
        <form onSubmit={handleSubmitLogin}>
          <div className="mb-4">
            <label htmlFor="departamento" className="block text-sm font-medium text-light mb-1">Departamento</label>
            <select 
              id="departamento"
              value={selectedDep}
              onChange={(e) => {
                setSelectedDep(e.target.value);
                setSelectedUser(''); // Limpa o utilizador ao trocar de dep
              }}
              className="w-full p-3 bg-accent-dark border border-accent-light rounded-md text-light focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Selecione o departamento...</option>
              {departamentos.map(dep => (
                <option key={dep.id} value={dep.id}>{dep.nome}</option>
              ))}
            </select>
          </div>

          {selectedDep && (
            <div className="mb-4 animate-fade-in">
              <label htmlFor="usuario" className="block text-sm font-medium text-light mb-1">Utilizador</label>
              <select 
                id="usuario"
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                disabled={!selectedDep}
                className="w-full p-3 bg-accent-dark border border-accent-light rounded-md text-light focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Selecione o seu nome...</option>
                {usersFiltrados.map(user => (
                  <option key={user.id} value={user.id}>{user.nome}</option>
                ))}
              </select>
            </div>
          )}

          {selectedUser && (
            <div className="mb-6 animate-fade-in">
              <label htmlFor="password" className="block text-sm font-medium text-light mb-1">Senha</label>
              <input 
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 bg-accent-dark border border-accent-light rounded-md text-light focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="****"
              />
            </div>
          )}
          
          {error && (
            <p className="text-red-400 text-center mb-4 animate-shake">{error}</p>
          )}

          <button 
            type="submit"
            disabled={!selectedUser || !password || isLoading}
            className="w-full bg-primary text-light font-bold p-4 rounded-md font-title text-lg
                       hover:bg-primary-dark transition-all duration-300
                       disabled:bg-accent-light disabled:cursor-not-allowed"
          >
            {isLoading ? "Aguarde..." : "ENTRAR"}
          </button>
        </form>
      </div>
    );
  }

  // Ecrã 2: REGISTAR SENHA (Primeiro Acesso)
  if (etapa === 'REGISTER_PASS') {
    return (
      <div className="bg-accent text-light p-8 rounded-lg shadow-2xl animate-fade-in">
        <h1 className="font-title text-3xl text-center mb-4">PRIMEIRO ACESSO</h1>
        <p className="text-center mb-6">Olá, {users.find(u => u.id === selectedUser)?.nome}. Vimos que é o seu primeiro acesso. Por favor, crie uma senha.</p>
        
        <form onSubmit={handleSubmitPrimeiroAcesso}>
          <div className="mb-6">
            <label htmlFor="new_password" className="block text-sm font-medium text-light mb-1">Nova Senha (mín. 4 caracteres)</label>
            <input 
              type="password"
              id="new_password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 bg-accent-dark border border-accent-light rounded-md text-light focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="****"
            />
          </div>
          
          {error && (
            <p className="text-red-400 text-center mb-4 animate-shake">{error}</p>
          )}

          <button 
            type="submit"
            disabled={!password || isLoading}
            className="w-full bg-primary text-light font-bold p-4 rounded-md font-title text-lg
                       hover:bg-primary-dark transition-all duration-300
                       disabled:bg-accent-light disabled:cursor-not-allowed"
          >
            {isLoading ? "A guardar..." : "CRIAR SENHA E ENTRAR"}
          </button>
          
          <button 
            type="button"
            onClick={handleLogout} // Volta ao ecrã de login
            className="w-full text-center text-primary-light mt-4 text-sm"
          >
            Cancelar
          </button>
        </form>
      </div>
    );
  }

  // Ecrã 3: LOGADO (Bater Ponto)
  if (etapa === 'LOGGED_IN' && currentUser) {
    const isSaida = proximoTipoPonto === 'SAIDA';
    
    return (
      <div className="bg-accent text-light p-8 rounded-lg shadow-2xl animate-fade-in w-full">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="font-title text-3xl text-light">{currentUser.nome}</h1>
            <p className="text-primary-light -mt-1">{currentUser.cargo === 'DIRETOR' ? 'Diretor(a)' : 'Membro'}</p>
          </div>
          <button 
            onClick={handleLogout}
            className="text-accent-light hover:text-primary transition-colors"
            title="Sair / Trocar Utilizador"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
          </button>
        </div>

        {/* --- Formulário de Bater Ponto --- */}
        <div className="space-y-4">
          {isSaida && (
            <div className="animate-fade-in">
              <label htmlFor="relatorio" className="block text-sm font-medium text-light mb-1">
                Relatório de Saída (Opcional)
              </label>
              <textarea
                id="relatorio"
                rows="3"
                value={relatorio}
                onChange={(e) => setRelatorio(e.target.value)}
                className="w-full p-3 bg-accent-dark border border-accent-light rounded-md text-light focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="O que produziu hoje?"
              ></textarea>
            </div>
          )}

          {error && (
            <p className="text-red-400 text-center mb-4 animate-shake">{error}</p>
          )}

          <button 
            type="button"
            onClick={handleBaterPontoClick}
            disabled={isLoading}
            className={`w-full text-light font-bold p-6 rounded-md font-title text-2xl
                       transition-all duration-300
                       disabled:bg-accent-light disabled:cursor-not-allowed
                       ${isSaida 
                         ? 'bg-red-600 hover:bg-red-700' 
                         : 'bg-green-600 hover:bg-green-700'
                       }`}
          >
            {isLoading 
              ? "A registar..." 
              : (isSaida ? "REGISTAR SAÍDA" : "REGISTAR ENTRADA")
            }
          </button>
        </div>
        
        {/* --- Registos de Hoje --- */}
        <div className="mt-8">
          <h3 className="font-title text-xl text-primary mb-3">Registos de Hoje</h3>
          <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
            {registros.length === 0 && (
              <p className="text-accent-light text-sm">Ainda não há registos hoje.</p>
            )}
            {registros.map((ponto) => (
              <div 
                key={ponto.id} 
                className={`flex justify-between items-center p-3 rounded
                           ${ponto.tipo === 'ENTRADA' ? 'bg-green-900/50' : 'bg-red-900/50'}`}
              >
                <span className="font-bold">{ponto.tipo}</span>
                <span className="text-sm">
                  {new Date(ponto.horario).toLocaleTimeString('pt-BR', {
                    hour: '2-digit', minute: '2-digit'
                  })}
                </span>
              </div>
            ))}
          </div>
        </div>
        
      </div>
    );
  }

  // Ecrã de Fallback (não deve acontecer)
  return <p>A carregar...</p>;
}

