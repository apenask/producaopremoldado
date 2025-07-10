import { useState, useCallback } from 'react';

interface AlertState {
  tipo: 'sucesso' | 'erro' | 'aviso' | 'info';
  titulo: string;
  mensagem: string;
  visivel: boolean;
}

export const useAlert = () => {
  const [alert, setAlert] = useState<AlertState>({
    tipo: 'info',
    titulo: '',
    mensagem: '',
    visivel: false
  });

  const mostrarAlert = useCallback((
    tipo: 'sucesso' | 'erro' | 'aviso' | 'info',
    titulo: string,
    mensagem: string,
    duracao: number = 4000
  ) => {
    setAlert({
      tipo,
      titulo,
      mensagem,
      visivel: true
    });

    setTimeout(() => {
      setAlert(prev => ({ ...prev, visivel: false }));
    }, duracao);
  }, []);

  const fecharAlert = useCallback(() => {
    setAlert(prev => ({ ...prev, visivel: false }));
  }, []);

  return {
    alert,
    mostrarAlert,
    fecharAlert
  };
};