import React, { useState, useEffect } from 'react';
import { ArrowLeft, Package, Search, Trash2, Plus, AlertCircle, CheckCircle, Settings } from 'lucide-react';
import { TelaAtiva, ConfiguracaoProduto } from '../types';
import { 
  getProdutos, 
  adicionarProduto, 
  removerProduto,
  buscarProdutos,
  produtoExiste,
  getConfiguracoes,
  getConfiguracaoProduto
} from '../services/supabaseService';
import AlertPersonalizado from './AlertPersonalizado';
import { useAlert } from '../hooks/useAlert';

interface ProdutosProps {
  onNavigate: (tela: TelaAtiva) => void;
}

const Produtos: React.FC<ProdutosProps> = ({ onNavigate }) => {
  const [produtos, setProdutos] = useState<string[]>([]);
  const [produtosFiltrados, setProdutosFiltrados] = useState<string[]>([]);
  const [termoBusca, setTermoBusca] = useState('');
  const [novoProduto, setNovoProduto] = useState('');
  const [mostrandoFormulario, setMostrandoFormulario] = useState(false);
  const [configuracoes, setConfiguracoes] = useState<ConfiguracaoProduto[]>([]);
  const [loading, setLoading] = useState(true);
  
  const { alert, mostrarAlert, fecharAlert } = useAlert();

  useEffect(() => {
    carregarDados();
  }, []);

  useEffect(() => {
    if (termoBusca) {
      buscarProdutosAsync(termoBusca);
    } else {
      setProdutosFiltrados(produtos);
    }
  }, [termoBusca, produtos]);

  const carregarDados = async () => {
    try {
      setLoading(true);
      const [listaProdutos, configsData] = await Promise.all([
        getProdutos(),
        getConfiguracoes()
      ]);
      setProdutos(listaProdutos);
      setProdutosFiltrados(listaProdutos);
      setConfiguracoes(configsData);
    } catch (error: any) {
      mostrarAlert('erro', 'Erro ao carregar produtos', error.message);
    } finally {
      setLoading(false);
    }
  };

  const buscarProdutosAsync = async (termo: string) => {
    try {
      const filtrados = await buscarProdutos(termo);
      setProdutosFiltrados(filtrados);
    } catch (error: any) {
      console.error('Erro ao buscar produtos:', error);
      setProdutosFiltrados([]);
    }
  };

  const adicionarNovoProduto = async () => {
    if (!novoProduto.trim()) {
      mostrarAlert('aviso', 'Campo obrigatório', 'Digite o nome do produto.');
      return;
    }

    const produtoTrimmed = novoProduto.trim().toUpperCase().replace(/\s+/g, ' ');

    try {
      const existe = await produtoExiste(produtoTrimmed);
      if (existe) {
        mostrarAlert('aviso', 'Produto já existe', 'Este produto já está cadastrado.');
        return;
      }

      await adicionarProduto(produtoTrimmed);
      await carregarDados();
      setNovoProduto('');
      setMostrandoFormulario(false);
      mostrarAlert('sucesso', 'Produto adicionado', `"${produtoTrimmed}" foi adicionado com sucesso.`);
    } catch (error: any) {
      mostrarAlert('erro', 'Erro ao adicionar produto', error.message);
    }
  };

  const removerProdutoConfirmado = async (produto: string) => {
    if (window.confirm(`Tem certeza que deseja remover o produto "${produto}"?`)) {
      try {
        await removerProduto(produto);
        await carregarDados();
        mostrarAlert('info', 'Produto removido', `"${produto}" foi removido do catálogo.`);
      } catch (error: any) {
        mostrarAlert('erro', 'Erro ao remover produto', error.message);
      }
    }
  };

  const getStatusConfiguracao = (produto: string) => {
    const config = configuracoes.find(c => c.produto === produto);
    
    if (!config) {
      return { 
        texto: 'Não configurado', 
        cor: 'text-gray-500', 
        bg: 'bg-gray-50',
        icon: AlertCircle,
        detalhes: 'Configure nas Configurações'
      };
    }
    
    const temTabua = config.unidadesPorTabua && config.unidadesPorTabua > 0;
    const temForma = config.unidadesPorForma && config.unidadesPorForma > 0;
    
    if (temTabua && temForma) {
      return { 
        texto: 'Configurado (Tábuas + Formas)', 
        cor: 'text-green-600', 
        bg: 'bg-green-50',
        icon: CheckCircle,
        detalhes: `${config.unidadesPorTabua} un/tábua, ${config.unidadesPorForma} un/forma`
      };
    } else if (temTabua) {
      return { 
        texto: 'Configurado (Tábuas)', 
        cor: 'text-blue-600', 
        bg: 'bg-blue-50',
        icon: CheckCircle,
        detalhes: `${config.unidadesPorTabua} unidades por tábua`
      };
    } else if (temForma) {
      return { 
        texto: 'Configurado (Formas)', 
        cor: 'text-purple-600', 
        bg: 'bg-purple-50',
        icon: CheckCircle,
        detalhes: `${config.unidadesPorForma} unidades por forma`
      };
    } else {
      return { 
        texto: 'Não configurado', 
        cor: 'text-gray-500', 
        bg: 'bg-gray-50',
        icon: AlertCircle,
        detalhes: 'Configure nas Configurações'
      };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-100 p-3 sm:p-6">
      <AlertPersonalizado
        tipo={alert.tipo}
        titulo={alert.titulo}
        mensagem={alert.mensagem}
        visivel={alert.visivel}
        onFechar={fecharAlert}
      />
      
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center mb-4 sm:mb-6">
          <button
            onClick={() => onNavigate('menu')}
            className="mr-3 sm:mr-4 p-2 hover:bg-white/50 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5 sm:h-6 sm:w-6 text-gray-600" />
          </button>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800 flex-1">Produtos</h1>
          <button
            onClick={() => onNavigate('configuracoes')}
            className="p-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
            title="Ir para Configurações"
          >
            <Settings className="h-5 w-5" />
          </button>
        </div>

        {/* Barra de busca e botão adicionar */}
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={termoBusca}
                onChange={(e) => setTermoBusca(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm sm:text-base"
                placeholder="Buscar produtos..."
              />
            </div>
            <button
              onClick={() => setMostrandoFormulario(!mostrandoFormulario)}
              className="bg-orange-600 hover:bg-orange-700 text-white py-3 px-4 sm:px-6 rounded-lg font-semibold flex items-center justify-center space-x-2 transition-all duration-200 text-sm sm:text-base"
            >
              <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
              <span>Adicionar Produto</span>
            </button>
          </div>

          {/* Formulário para adicionar produto */}
          {mostrandoFormulario && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  value={novoProduto}
                  onChange={(e) => setNovoProduto(e.target.value)}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm sm:text-base"
                  placeholder="Nome do novo produto"
                  onKeyPress={(e) => e.key === 'Enter' && adicionarNovoProduto()}
                />
                <div className="flex gap-2">
                  <button
                    onClick={adicionarNovoProduto}
                    className="bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg font-semibold transition-all duration-200 text-sm"
                  >
                    Salvar
                  </button>
                  <button
                    onClick={() => {
                      setMostrandoFormulario(false);
                      setNovoProduto('');
                    }}
                    className="bg-gray-600 hover:bg-gray-700 text-white py-3 px-4 rounded-lg font-semibold transition-all duration-200 text-sm"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Lista de produtos */}
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base sm:text-lg font-semibold text-gray-800">
              Catálogo de Produtos
            </h3>
            <span className="text-sm text-gray-500">
              {produtosFiltrados.length} produto{produtosFiltrados.length !== 1 ? 's' : ''}
            </span>
          </div>
          
          {produtosFiltrados.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-sm sm:text-base text-gray-500">
                {termoBusca ? 'Nenhum produto encontrado' : 'Nenhum produto cadastrado ainda'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {produtosFiltrados.map((produto, index) => {
                const status = getStatusConfiguracao(produto);
                const IconComponent = status.icon;
                
                return (
                  <div key={index} className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-800 text-sm sm:text-base truncate">
                        {produto}
                      </h4>
                      <div className="flex items-center mt-1 space-x-2">
                        <div className={`flex items-center space-x-1 text-xs px-2 py-1 rounded-full ${status.bg} ${status.cor} font-medium`}>
                          <IconComponent className="h-3 w-3" />
                          <span>{status.texto}</span>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{status.detalhes}</p>
                    </div>
                    <button
                      onClick={() => removerProdutoConfirmado(produto)}
                      className="p-2 hover:bg-red-100 rounded text-red-600 transition-colors ml-2 flex-shrink-0"
                      title="Remover produto"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Informações adicionais */}
        <div className="mt-6 bg-blue-50 rounded-xl p-4 sm:p-6">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-blue-800 mb-2">Dicas sobre produtos</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• <CheckCircle className="h-3 w-3 inline mr-1" /> Produtos configurados mostram quantidades por tábua/forma</li>
                <li>• <AlertCircle className="h-3 w-3 inline mr-1" /> Produtos não configurados precisam ser configurados nas Configurações</li>
                <li>• Use a busca para encontrar produtos rapidamente</li>
                <li>• Clique no ícone de configurações no topo para gerenciar configurações</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Produtos;