// CRIE OU SUBSTITUA este ficheiro em src/app/components/PontoApp.jsx
//
// Este é o componente que gere o estado do utilizador (login, ponto, etc.)

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
// CORRIGIDO: handlePrimeiroAcesso foi alterado para handleSetupPassword
import { handleLogin, handleSetupPassword, handleLogout, getTodayUserPoints, handleBaterPonto } from '../actions';

// Estados possíveis da aplicação
const AppState = {
  LOADING: 'LOADING',
  LOGIN: 'LOGIN',
  SETUP_PASSWORD: 'SETUP_PASSWORD',
  TIME_TRACKING: 'TIME_TRACKING',
};

// Componente principal do aplicativo
export default function PontoApp({ initialDepartamentos, initialUsers }) {
  const [appState, setAppState] = useState(AppState.LOGIN);
  const [departamentoId, setDepartamentoId] = useState('');
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [nomeUsuario, setNomeUsuario] = useState('');
  const [statusMessage, setStatusMessage] = useState({ text: '', type: '' });
  const [relatorio, setRelatorio] = useState('');
  const [pontosHoje, setPontosHoje] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Filtra utilizadores pelo departamento selecionado
  const usersFiltrados = useMemo(() => {
    return initialUsers.filter(u => u.departamentoId === departamentoId);
  }, [departamentoId, initialUsers]);

  // Determina o estado atual do ponto (ENTRADA ou SAIDA)
  const pontoStatus = useMemo(() => {
    const lastPoint = pontosHoje.length > 0 ? pontosHoje[pontosHoje.length - 1] : null;
    // Se o último ponto foi ENTRADA, o próximo é SAIDA. Caso contrário, é ENTRADA.
    return lastPoint && lastPoint.tipo === 'ENTRADA' ? 'SAIDA' : 'ENTRADA';
  }, [pontosHoje]);

  // Função para buscar os pontos do dia (usada após login e após bater ponto)
  const fetchPoints = useCallback(async (id) => {
    if (!id) return;
    const points = await getTodayUserPoints(id);
    setPontosHoje(points);
  }, []);

  // --- HANDLERS ---

  // Lógica principal de login
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setStatusMessage({ text: '', type: '' });
    setIsLoading(true);

    if (!userId || !password) {
      setStatusMessage({ text: 'Por favor, selecione um utilizador e insira a senha.', type: 'error' });
      setIsLoading(false);
      return;
    }

    const result = await handleLogin({ userId, password });
    setIsLoading(false);

    if (result.success) {
      if (result.needsSetup) {
        setAppState(AppState.SETUP_PASSWORD);
      } else {
        setNomeUsuario(initialUsers.find(u => u.id === userId)?.nome || 'Utilizador');
        await fetchPoints(userId);
        setAppState(AppState.TIME_TRACKING);
      }
    } else {
      setStatusMessage({ text: result.message, type: 'error' });
      setPassword('');
    }
  };

  // Lógica para criar a senha (Primeiro Acesso)
  const handleSetupSubmit = async (e) => {
    e.preventDefault();
    setStatusMessage({ text: '', type: '' });
    setIsLoading(true);

    if (newPassword.length < 6) {
      setStatusMessage({ text: 'A senha deve ter pelo menos 6 caracteres.', type: 'error' });
      setIsLoading(false);
      return;
    }
    if (newPassword !== confirmPassword) {
      setStatusMessage({ text: 'As senhas não coincidem.', type: 'error' });
      setIsLoading(false);
      return;
    }

    const result = await handleSetupPassword({ userId, newPassword });
    setIsLoading(false);

    if (result.success) {
      setNomeUsuario(result.user.nome);
      await fetchPoints(userId);
      setAppState(AppState.TIME_TRACKING);
    } else {
      setStatusMessage({ text: result.message, type: 'error' });
    }
  };

  // Bater o Ponto (Check-in/Check-out)
  const handlePointSubmit = async (e) => {
    e.preventDefault();
    setStatusMessage({ text: '', type: '' });
    setIsLoading(true);

    if (pontoStatus === 'SAIDA' && relatorio.length < 10) {
      setStatusMessage({ text: 'Por favor, detalhe o seu relatório (mínimo 10 caracteres).', type: 'error' });
      setIsLoading(false);
      return;
    }

    const result = await handleBaterPonto({ userId, tipo: pontoStatus, relatorio });
    setIsLoading(false);

    if (result.success) {
      setStatusMessage({ text: `Ponto de ${pontoStatus} registado com sucesso!`, type: 'success' });
      setRelatorio('');
      await fetchPoints(userId);
    } else {
      setStatusMessage({ text: result.message, type: 'error' });
    }
  };

  // --- COMPONENTES DE RENDERIZAÇÃO ---

  // 1. Tela de Login/Seleção
  const renderLogin = () => (
    <form onSubmit={handleLoginSubmit} className="space-y-4">
      <h1 className="text-3xl font-title text-light mb-6">REGISTO DE PONTO</h1>

      <div className="space-y-2">
        <label htmlFor="departamento" className="text-sm font-bold text-light">Departamento</label>
        <select
          id="departamento"
          value={departamentoId}
          onChange={(e) => {
            setDepartamentoId(e.target.value);
            setUserId(''); // Limpa o usuário ao mudar o departamento
            setPassword('');
          }}
          className="w-full p-2 bg-accent-light text-light border-0 rounded-md focus:ring-primary focus:border-primary"
        >
          <option value="">-- Selecione o Departamento --</option>
          {initialDepartamentos.map(d => (
            <option key={d.id} value={d.id}>{d.nome}</option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label htmlFor="user" className="text-sm font-bold text-light">Utilizador</label>
        <select
          id="user"
          value={userId}
          onChange={(e) => {
            setUserId(e.target.value);
            setPassword(''); // Limpa a senha ao mudar o usuário
          }}
          disabled={!departamentoId}
          className="w-full p-2 bg-accent-light text-light border-0 rounded-md focus:ring-primary focus:border-primary disabled:opacity-50"
        >
          <option value="">-- Selecione o seu Nome --</option>
          {usersFiltrados.map(u => (
            <option key={u.id} value={u.id}>{u.nome}</option>
          ))}
        </select>
      </div>

      {userId && (
        <div className="space-y-2">
          <label htmlFor="password" className="text-sm font-bold text-light">Senha</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 bg-accent-light text-light border-0 rounded-md focus:ring-primary focus:border-primary"
            placeholder="Insira a sua senha"
          />
        </div>
      )}

      <button
        type="submit"
        disabled={!userId || isLoading}
        className="w-full py-3 mt-4 font-bold font-title uppercase tracking-wider bg-primary text-light rounded-md hover:bg-primary/80 transition disabled:opacity-50"
      >
        {isLoading ? 'A CARREGAR...' : 'ENTRAR'}
      </button>

      {statusMessage.text && (
        <p className={`text-center text-sm p-2 rounded-md ${statusMessage.type === 'error' ? 'bg-red-900 text-red-200' : 'bg-green-900 text-green-200'}`}>
          {statusMessage.text}
        </p>
      )}
    </form>
  );

  // 2. Tela de Criação de Senha (Primeiro Acesso)
  const renderSetupPassword = () => (
    <form onSubmit={handleSetupSubmit} className="space-y-4">
      <h1 className="text-3xl font-title text-light mb-4">PRIMEIRO ACESSO</h1>
      <p className="text-light/80 mb-6">Por favor, defina uma senha segura para a sua conta.</p>

      <div className="space-y-2">
        <label htmlFor="newPassword" className="text-sm font-bold text-light">Nova Senha (min. 6 caracteres)</label>
        <input
          id="newPassword"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="w-full p-2 bg-accent-light text-light border-0 rounded-md focus:ring-primary focus:border-primary"
          placeholder="Nova Senha"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="confirmPassword" className="text-sm font-bold text-light">Confirmar Senha</label>
        <input
          id="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="w-full p-2 bg-accent-light text-light border-0 rounded-md focus:ring-primary focus:border-primary"
          placeholder="Confirme a Senha"
        />
      </div>

      <button
        type="submit"
        disabled={isLoading || newPassword.length < 6 || newPassword !== confirmPassword}
        className="w-full py-3 mt-4 font-bold font-title uppercase tracking-wider bg-primary text-light rounded-md hover:bg-primary/80 transition disabled:opacity-50"
      >
        {isLoading ? 'A GUARDAR...' : 'CRIAR SENHA'}
      </button>

      {statusMessage.text && (
        <p className={`text-center text-sm p-2 rounded-md ${statusMessage.type === 'error' ? 'bg-red-900 text-red-200' : 'bg-green-900 text-green-200'}`}>
          {statusMessage.text}
        </p>
      )}
    </form>
  );

  // 3. Tela de Bater Ponto e Histórico
  const renderTimeTracking = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center pb-4 border-b border-accent-light">
        <h1 className="text-3xl font-title text-light">BEM-VINDO, {nomeUsuario.toUpperCase()}</h1>
        <button
          onClick={handleLogout}
          className="text-sm text-primary hover:text-primary/80 font-bold"
        >
          SAIR
        </button>
      </div>

      {/* Seção de Bater Ponto */}
      <form onSubmit={handlePointSubmit} className="space-y-4">
        <h2 className="text-2xl font-title text-light">Ação Atual: <span className={pontoStatus === 'ENTRADA' ? 'text-green-500' : 'text-red-500'}>{pontoStatus}</span></h2>

        {pontoStatus === 'SAIDA' && (
          <div className="space-y-2">
            <label htmlFor="relatorio" className="text-sm font-bold text-light">Relatório do Período (Obrigatório)</label>
            <textarea
              id="relatorio"
              value={relatorio}
              onChange={(e) => setRelatorio(e.target.value)}
              rows="4"
              className="w-full p-2 bg-accent-light text-light border-0 rounded-md focus:ring-primary focus:border-primary placeholder-gray-500"
              placeholder="Ex: Tarefas concluídas: Finalização do relatório X, Correção de bug Y, Reunião com a equipa."
            />
            <p className="text-xs text-light/50">Mínimo 10 caracteres.</p>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading || (pontoStatus === 'SAIDA' && relatorio.length < 10)}
          className={`w-full py-4 mt-4 font-bold font-title uppercase tracking-wider rounded-md transition disabled:opacity-50 ${pontoStatus === 'ENTRADA' ? 'bg-green-600 hover:bg-green-500' : 'bg-red-600 hover:bg-red-500'} text-light`}
        >
          {isLoading ? 'A REGISTRAR...' : `REGISTRAR ${pontoStatus}`}
        </button>

        {statusMessage.text && (
          <p className={`text-center text-sm p-2 rounded-md ${statusMessage.type === 'error' ? 'bg-red-900 text-red-200' : 'bg-green-900 text-green-200'}`}>
            {statusMessage.text}
          </p>
        )}
      </form>

      {/* Histórico de Pontos do Dia */}
      <div className="pt-4 border-t border-accent-light">
        <h2 className="text-2xl font-title text-light mb-4">PONTOS DE HOJE ({pontosHoje.length})</h2>
        {pontosHoje.length === 0 ? (
          <p className="text-light/70">Nenhum ponto registado hoje.</p>
        ) : (
          <ul className="space-y-3">
            {pontosHoje.map((p, index) => (
              <li key={p.id} className={`p-3 rounded-md shadow-md ${p.tipo === 'ENTRADA' ? 'bg-accent-light/50 border-l-4 border-green-500' : 'bg-accent-light/50 border-l-4 border-red-500'}`}>
                <div className="flex justify-between items-center text-sm font-bold">
                  <span className={p.tipo === 'ENTRADA' ? 'text-green-400' : 'text-red-400'}>{p.tipo}</span>
                  <span className="text-light/70">{new Date(p.horario).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                </div>
                {p.relatorio && (
                  <p className="text-xs text-light/50 mt-1 italic break-words">
                    Relatório: {p.relatorio.substring(0, 75)}...
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );

  // --- RENDERIZAÇÃO PRINCIPAL ---
  let content;

  // Lógica para determinar qual tela mostrar
  switch (appState) {
    case AppState.LOADING:
      content = <p className="text-light text-center font-title">A CARREGAR...</p>;
      break;
    case AppState.SETUP_PASSWORD:
      content = renderSetupPassword();
      break;
    case AppState.TIME_TRACKING:
      content = renderTimeTracking();
      break;
    case AppState.LOGIN:
    default:
      content = renderLogin();
      break;
  }

  return (
    <div className="w-full bg-accent text-light p-6 rounded-xl shadow-2xl">
      {content}
    </div>
  );
}
