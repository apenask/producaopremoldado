import React from 'react';
import { Factory, History, Settings, Calendar, Package, LogOut } from 'lucide-react';
import { TelaAtiva } from '../types';
import { supabase } from '../lib/supabase';

interface MenuProps {
  onNavigate: (tela: TelaAtiva) => void;
}

const Menu: React.FC<MenuProps> = ({ onNavigate }) => {
  const handleLogout = async () => {
    if (window.confirm('Tem certeza que deseja sair da conta?')) {
      try {
        await supabase.auth.signOut();
      } catch (error) {
        console.error('Erro ao fazer logout:', error);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-3 sm:p-6">
      <div className="max-w-md mx-auto pt-8 sm:pt-16">
        <div className="text-center mb-8 sm:mb-12">
          <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-blue-600 rounded-full mb-4">
            <Factory className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">
            Controle de Produção
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            Sistema para fábrica de pré-moldados
          </p>
        </div>

        <div className="space-y-3 sm:space-y-4">
          <button
            onClick={() => onNavigate('nova-producao')}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 sm:py-4 px-4 sm:px-6 rounded-xl font-semibold flex items-center justify-center space-x-3 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1 text-sm sm:text-base"
          >
            <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
            <span>Nova Produção</span>
          </button>

          <button
            onClick={() => onNavigate('historico')}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 sm:py-4 px-4 sm:px-6 rounded-xl font-semibold flex items-center justify-center space-x-3 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1 text-sm sm:text-base"
          >
            <History className="h-4 w-4 sm:h-5 sm:w-5" />
            <span>Histórico</span>
          </button>

          <button
            onClick={() => onNavigate('produtos')}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white py-3 sm:py-4 px-4 sm:px-6 rounded-xl font-semibold flex items-center justify-center space-x-3 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1 text-sm sm:text-base"
          >
            <Package className="h-4 w-4 sm:h-5 sm:w-5" />
            <span>Produtos</span>
          </button>

          <button
            onClick={() => onNavigate('configuracoes')}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 sm:py-4 px-4 sm:px-6 rounded-xl font-semibold flex items-center justify-center space-x-3 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1 text-sm sm:text-base"
          >
            <Settings className="h-4 w-4 sm:h-5 sm:w-5" />
            <span>Configurações</span>
          </button>

          <button
            onClick={handleLogout}
            className="w-full bg-red-600 hover:bg-red-700 text-white py-3 sm:py-4 px-4 sm:px-6 rounded-xl font-semibold flex items-center justify-center space-x-3 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1 text-sm sm:text-base"
          >
            <LogOut className="h-4 w-4 sm:h-5 sm:w-5" />
            <span>Sair da Conta</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Menu;