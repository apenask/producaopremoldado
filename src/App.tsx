import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { Session } from '@supabase/supabase-js';
import { TelaAtiva } from './types';
import Auth from './components/Auth';
import Menu from './components/Menu';
import NovaProducao from './components/NovaProducao';
import Historico from './components/Historico';
import Configuracoes from './components/Configuracoes';
import Produtos from './components/Produtos';
import Diaristas from './components/Diaristas'; // INÍCIO DA ALTERAÇÃO: Importar o componente Diaristas

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [telaAtiva, setTelaAtiva] = useState<TelaAtiva>('menu');

  useEffect(() => {
    // Verificar sessão atual
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Escutar mudanças de autenticação
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const navegar = (tela: TelaAtiva) => {
    setTelaAtiva(tela);
  };

  const handleAuthSuccess = () => {
    setTelaAtiva('menu');
  };

  const renderizarTela = () => {
    switch (telaAtiva) {
      case 'menu':
        return <Menu onNavigate={navegar} />;
      case 'nova-producao':
        return <NovaProducao onNavigate={navegar} />;
      case 'historico':
        return <Historico onNavigate={navegar} />;
      case 'configuracoes':
        return <Configuracoes onNavigate={navegar} />;
      case 'produtos':
        return <Produtos onNavigate={navegar} />;
      // INÍCIO DA ALTERAÇÃO: Adicionar case para a tela de Diaristas
      case 'diaristas':
        return <Diaristas onNavigate={navegar} />;
      // FIM DA ALTERAÇÃO
      default:
        return <Menu onNavigate={navegar} />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return <Auth onAuthSuccess={handleAuthSuccess} />;
  }

  return (
    <div className="App">
      {renderizarTela()}
    </div>
  );
}

export default App;