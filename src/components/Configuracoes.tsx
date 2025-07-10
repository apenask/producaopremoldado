import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Settings, Trash2, AlertCircle, Edit3, Save, X, Upload, Users, Check } from 'lucide-react';
import { TelaAtiva, ConfiguracaoProduto, CategoriaProducao } from '../types';
import { 
  getConfiguracoes, 
  salvarConfiguracao, 
  getProdutos, 
  buscarProdutos, 
  produtoExiste,
  adicionarProduto,
  getCategorias,
  salvarCategoria,
  removerCategoria,
  getProdutosCategorias,
  salvarProdutoCategoria
} from '../services/supabaseService';
import AlertPersonalizado from './AlertPersonalizado';
import { useAlert } from '../hooks/useAlert';

interface ConfiguracoesProps {
  onNavigate: (tela: TelaAtiva) => void;
}

interface ProdutoLote {
  nome: string;
  unidadesPorTabua: string;
  unidadesPorForma: string;
  sugestoes: string[];
  mostrarSugestoes: boolean;
  produtoNovo: boolean;
}

const Configuracoes: React.FC<ConfiguracoesProps> = ({ onNavigate }) => {
  const [produto, setProduto] = useState('');
  const [unidadesPorTabua, setUnidadesPorTabua] = useState('');
  const [unidadesPorForma, setUnidadesPorForma] = useState('');
  const [configuracoes, setConfiguracoes] = useState<ConfiguracaoProduto[]>([]);
  const [produtos, setProdutos] = useState<string[]>([]);
  const [produtosFiltrados, setProdutosFiltrados] = useState<string[]>([]);
  const [mostrarSugestoes, setMostrarSugestoes] = useState(false);
  const [produtoNovo, setProdutoNovo] = useState(false);
  const [abaSelecionada, setAbaSelecionada] = useState<'produtos' | 'categorias' | 'lote' | 'produto-categorias'>('produtos');
  const [loading, setLoading] = useState(true);
  
  // Estados para categorias
  const [categorias, setCategorias] = useState<CategoriaProducao[]>([]);
  const [novaCategoria, setNovaCategoria] = useState({ nome: '', tipos: ['unidades'] as ('tabuas' | 'formas' | 'unidades')[], descricao: '' });
  const [editandoCategoria, setEditandoCategoria] = useState<string | null>(null);
  const [categoriaEditando, setCategoriaEditando] = useState<CategoriaProducao | null>(null);
  
  // Estados para configuração em lote
  const [produtosLote, setProdutosLote] = useState<ProdutoLote[]>([
    { nome: '', unidadesPorTabua: '', unidadesPorForma: '', sugestoes: [], mostrarSugestoes: false, produtoNovo: false }
  ]);
  
  // Estados para configuração produto-categorias
  const [produtoSelecionado, setProdutoSelecionado] = useState('');
  const [categoriasSelecionadas, setCategoriasSelecionadas] = useState<string[]>([]);
  const [produtosCategorias, setProdutosCategorias] = useState<Record<string, string[]>>({});
  const [mostrarSugestoesProdCat, setMostrarSugestoesProdCat] = useState(false);
  const [produtosFiltradosProdCat, setProdutosFiltradosProdCat] = useState<string[]>([]);
  
  const { alert, mostrarAlert, fecharAlert } = useAlert();

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      setLoading(true);
      const [configsData, produtosData, categoriasData, produtosCatData] = await Promise.all([
        getConfiguracoes(),
        getProdutos(),
        getCategorias(),
        getProdutosCategorias()
      ]);
      
      setConfiguracoes(configsData);
      setProdutos(produtosData);
      setCategorias(categoriasData);
      setProdutosCategorias(produtosCatData);
    } catch (error: any) {
      mostrarAlert('erro', 'Erro ao carregar dados', error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (produto) {
      buscarProdutosAsync(produto);
    } else {
      setProdutosFiltrados([]);
      setProdutoNovo(false);
    }
  }, [produto, produtos]);

  const buscarProdutosAsync = async (termo: string) => {
    try {
      const filtrados = await buscarProdutos(termo);
      setProdutosFiltrados(filtrados);
      
      const existe = await produtoExiste(termo);
      setProdutoNovo(!existe && termo.trim().length > 0);
    } catch (error: any) {
      console.error('Erro ao buscar produtos:', error);
    }
  };

  // Função para buscar produtos para um item específico do lote
  const buscarProdutosLote = async (index: number, termo: string) => {
    try {
      const filtrados = await buscarProdutos(termo);
      const existe = await produtoExiste(termo);
      
      setProdutosLote(prev => prev.map((item, i) => 
        i === index 
          ? { 
              ...item, 
              sugestoes: filtrados,
              produtoNovo: !existe && termo.trim().length > 0
            }
          : item
      ));
    } catch (error: any) {
      console.error('Erro ao buscar produtos:', error);
    }
  };

  // Funções para configuração produto-categorias
  const buscarProdutosProdCat = async (termo: string) => {
    try {
      const filtrados = await buscarProdutos(termo);
      setProdutosFiltradosProdCat(filtrados);
    } catch (error: any) {
      console.error('Erro ao buscar produtos:', error);
    }
  };

  useEffect(() => {
    if (produtoSelecionado) {
      buscarProdutosProdCat(produtoSelecionado);
      // Carrega categorias já selecionadas para este produto
      const categoriasExistentes = produtosCategorias[produtoSelecionado] || [];
      setCategoriasSelecionadas(categoriasExistentes);
    } else {
      setProdutosFiltradosProdCat([]);
      setCategoriasSelecionadas([]);
    }
  }, [produtoSelecionado, produtosCategorias]);

  const toggleCategoria = (categoriaId: string) => {
    setCategoriasSelecionadas(prev => 
      prev.includes(categoriaId) 
        ? prev.filter(id => id !== categoriaId)
        : [...prev, categoriaId]
    );
  };

  const salvarProdutoCategoria = async () => {
    if (!produtoSelecionado.trim()) {
      mostrarAlert('aviso', 'Campo obrigatório', 'Selecione um produto.');
      return;
    }

    if (categoriasSelecionadas.length === 0) {
      mostrarAlert('aviso', 'Categoria necessária', 'Selecione pelo menos uma categoria.');
      return;
    }

    try {
      const produtoTrimmed = produtoSelecionado.trim().toUpperCase().replace(/\s+/g, ' ');
      await salvarProdutoCategoria(produtoTrimmed, categoriasSelecionadas);
      
      // Recarrega os dados
      const novosProdutosCat = await getProdutosCategorias();
      setProdutosCategorias(novosProdutosCat);
      
      setProdutoSelecionado('');
      setCategoriasSelecionadas([]);
      setMostrarSugestoesProdCat(false);
      
      mostrarAlert('sucesso', 'Configuração salva', `Categorias configuradas para "${produtoTrimmed}".`);
    } catch (error: any) {
      mostrarAlert('erro', 'Erro ao salvar configuração', error.message);
    }
  };

  const salvarConfig = async () => {
    if (!produto) {
      mostrarAlert('aviso', 'Campo obrigatório', 'Preencha o nome do produto.');
      return;
    }

    if (!unidadesPorTabua && !unidadesPorForma) {
      mostrarAlert('aviso', 'Configuração necessária', 'Configure pelo menos unidades por tábua ou por forma.');
      return;
    }

    const unidadesTabua = unidadesPorTabua ? parseInt(unidadesPorTabua) : undefined;
    const unidadesForma = unidadesPorForma ? parseInt(unidadesPorForma) : undefined;

    if ((unidadesTabua && (isNaN(unidadesTabua) || unidadesTabua <= 0)) ||
        (unidadesForma && (isNaN(unidadesForma) || unidadesForma <= 0))) {
      mostrarAlert('erro', 'Quantidade inválida', 'As quantidades devem ser números maiores que zero.');
      return;
    }

    const produtoTrimmed = produto.trim().toUpperCase().replace(/\s+/g, ' ');

    try {
      // Verifica se já existe configuração para este produto
      const configExistente = configuracoes.find(c => 
        c.produto.toUpperCase().replace(/\s+/g, ' ') === produtoTrimmed
      );
      
      const novaConfig: ConfiguracaoProduto = {
        produto: produtoTrimmed,
        unidadesPorTabua: unidadesTabua,
        unidadesPorForma: unidadesForma
      };

      // Adiciona o produto automaticamente se for novo
      if (produtoNovo) {
        await adicionarProduto(produtoTrimmed);
        const novosProdutos = await getProdutos();
        setProdutos(novosProdutos);
      }

      await salvarConfiguracao(novaConfig);
      const novasConfigs = await getConfiguracoes();
      setConfiguracoes(novasConfigs);
      
      setProduto('');
      setUnidadesPorTabua('');
      setUnidadesPorForma('');
      setMostrarSugestoes(false);
      setProdutoNovo(false);
      
      if (configExistente) {
        mostrarAlert('sucesso', 'Configuração atualizada', `Configuração do produto "${produtoTrimmed}" foi atualizada.`);
      } else {
        mostrarAlert('sucesso', 'Configuração salva', `Configuração do produto "${produtoTrimmed}" foi salva com sucesso.`);
      }
    } catch (error: any) {
      mostrarAlert('erro', 'Erro ao salvar configuração', error.message);
    }
  };

  const salvarConfiguracoesLote = async () => {
    const produtosValidos = produtosLote.filter(p => 
      p.nome.trim() && (p.unidadesPorTabua || p.unidadesPorForma)
    );

    if (produtosValidos.length === 0) {
      mostrarAlert('aviso', 'Nenhum produto válido', 'Adicione pelo menos um produto com configuração válida.');
      return;
    }

    try {
      let produtosAdicionados = 0;
      let configuracoesAdicionadas = 0;

      for (const produtoLote of produtosValidos) {
        const produtoTrimmed = produtoLote.nome.trim().toUpperCase().replace(/\s+/g, ' ');
        
        // Verifica se o produto existe, se não, adiciona
        const existe = await produtoExiste(produtoTrimmed);
        if (!existe) {
          await adicionarProduto(produtoTrimmed);
          produtosAdicionados++;
        }

        // Salva a configuração
        const config: ConfiguracaoProduto = {
          produto: produtoTrimmed,
          unidadesPorTabua: produtoLote.unidadesPorTabua ? parseInt(produtoLote.unidadesPorTabua) : undefined,
          unidadesPorForma: produtoLote.unidadesPorForma ? parseInt(produtoLote.unidadesPorForma) : undefined
        };

        await salvarConfiguracao(config);
        configuracoesAdicionadas++;
      }

      // Recarrega os dados
      await carregarDados();

      // Limpa o formulário
      setProdutosLote([{ nome: '', unidadesPorTabua: '', unidadesPorForma: '', sugestoes: [], mostrarSugestoes: false, produtoNovo: false }]);

      mostrarAlert(
        'sucesso', 
        'Configurações salvas', 
        `${configuracoesAdicionadas} configurações salvas. ${produtosAdicionados} produtos novos adicionados.`
      );
    } catch (error: any) {
      mostrarAlert('erro', 'Erro ao salvar configurações', error.message);
    }
  };

  const adicionarLinhaLote = () => {
    setProdutosLote([...produtosLote, { nome: '', unidadesPorTabua: '', unidadesPorForma: '', sugestoes: [], mostrarSugestoes: false, produtoNovo: false }]);
  };

  const removerLinhaLote = (index: number) => {
    if (produtosLote.length > 1) {
      setProdutosLote(produtosLote.filter((_, i) => i !== index));
    }
  };

  const atualizarProdutoLote = (index: number, campo: keyof ProdutoLote, valor: string | boolean) => {
    const novosProdutos = [...produtosLote];
    
    if (campo === 'nome' && typeof valor === 'string') {
      novosProdutos[index][campo] = valor;
      // Busca produtos quando o nome muda
      if (valor.trim()) {
        buscarProdutosLote(index, valor);
      } else {
        novosProdutos[index].sugestoes = [];
        novosProdutos[index].produtoNovo = false;
      }
    } else if (typeof valor === 'string') {
      novosProdutos[index][campo as 'unidadesPorTabua' | 'unidadesPorForma'] = valor;
    } else if (typeof valor === 'boolean') {
      novosProdutos[index][campo as 'mostrarSugestoes'] = valor;
    }
    
    setProdutosLote(novosProdutos);
  };

  const selecionarProdutoLote = (index: number, produto: string) => {
    const novosProdutos = [...produtosLote];
    novosProdutos[index].nome = produto;
    novosProdutos[index].mostrarSugestoes = false;
    novosProdutos[index].produtoNovo = false;
    setProdutosLote(novosProdutos);
  };

  const adicionarNovaCategoria = async () => {
    if (!novaCategoria.nome.trim()) {
      mostrarAlert('aviso', 'Campo obrigatório', 'Digite o nome da categoria.');
      return;
    }

    if (novaCategoria.tipos.length === 0) {
      mostrarAlert('aviso', 'Tipo obrigatório', 'Selecione pelo menos um tipo de medida.');
      return;
    }

    try {
      const categoria: CategoriaProducao = {
        id: Date.now().toString(),
        nome: novaCategoria.nome.trim(),
        tipos: novaCategoria.tipos,
        descricao: novaCategoria.descricao.trim()
      };

      await salvarCategoria(categoria);
      const novasCategorias = await getCategorias();
      setCategorias(novasCategorias);
      setNovaCategoria({ nome: '', tipos: ['unidades'], descricao: '' });
      mostrarAlert('sucesso', 'Categoria adicionada', `Categoria "${categoria.nome}" foi adicionada com sucesso.`);
    } catch (error: any) {
      mostrarAlert('erro', 'Erro ao adicionar categoria', error.message);
    }
  };

  const iniciarEdicaoCategoria = (categoria: CategoriaProducao) => {
    setEditandoCategoria(categoria.id);
    setCategoriaEditando({ ...categoria });
  };

  const salvarEdicaoCategoria = async () => {
    if (!categoriaEditando || !categoriaEditando.nome.trim()) {
      mostrarAlert('aviso', 'Campo obrigatório', 'Digite o nome da categoria.');
      return;
    }

    try {
      await salvarCategoria(categoriaEditando);
      const novasCategorias = await getCategorias();
      setCategorias(novasCategorias);
      setEditandoCategoria(null);
      setCategoriaEditando(null);
      mostrarAlert('sucesso', 'Categoria atualizada', `Categoria "${categoriaEditando.nome}" foi atualizada.`);
    } catch (error: any) {
      mostrarAlert('erro', 'Erro ao atualizar categoria', error.message);
    }
  };

  const cancelarEdicaoCategoria = () => {
    setEditandoCategoria(null);
    setCategoriaEditando(null);
  };

  const removerCategoriaConfirmada = async (categoria: CategoriaProducao) => {
    if (window.confirm(`Tem certeza que deseja remover a categoria "${categoria.nome}"?`)) {
      try {
        await removerCategoria(categoria.id);
        const novasCategorias = await getCategorias();
        setCategorias(novasCategorias);
        mostrarAlert('info', 'Categoria removida', `Categoria "${categoria.nome}" foi removida.`);
      } catch (error: any) {
        mostrarAlert('erro', 'Erro ao remover categoria', error.message);
      }
    }
  };

  const getTipoTexto = (tipo: string) => {
    switch (tipo) {
      case 'tabuas': return 'Tábuas';
      case 'formas': return 'Formas';
      case 'unidades': return 'Unidades';
      default: return tipo;
    }
  };

  const getTiposTexto = (tipos: string[]) => {
    return tipos.map(tipo => getTipoTexto(tipo)).join(', ');
  };

  const toggleTipoNovaCategoria = (tipo: 'tabuas' | 'formas' | 'unidades') => {
    setNovaCategoria(prev => ({
      ...prev,
      tipos: prev.tipos.includes(tipo) 
        ? prev.tipos.filter(t => t !== tipo)
        : [...prev.tipos, tipo]
    }));
  };

  const toggleTipoCategoriaEditando = (tipo: 'tabuas' | 'formas' | 'unidades') => {
    if (!categoriaEditando) return;
    
    setCategoriaEditando(prev => prev ? {
      ...prev,
      tipos: prev.tipos.includes(tipo) 
        ? prev.tipos.filter(t => t !== tipo)
        : [...prev.tipos, tipo]
    } : null);
  };
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 p-3 sm:p-6">
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
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Configurações</h1>
        </div>

        {/* Abas */}
        <div className="bg-white rounded-xl shadow-lg mb-6">
          <div className="flex border-b">
            <button
              onClick={() => setAbaSelecionada('produtos')}
              className={`flex-1 py-3 px-2 text-center font-medium transition-colors text-xs sm:text-sm ${
                abaSelecionada === 'produtos'
                  ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50'
                  : 'text-gray-600 hover:text-purple-600'
              }`}
            >
              Produtos
            </button>
            <button
              onClick={() => setAbaSelecionada('produto-categorias')}
              className={`flex-1 py-3 px-2 text-center font-medium transition-colors text-xs sm:text-sm ${
                abaSelecionada === 'produto-categorias'
                  ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50'
                  : 'text-gray-600 hover:text-purple-600'
              }`}
            >
              Quem Produz
            </button>
            <button
              onClick={() => setAbaSelecionada('lote')}
              className={`flex-1 py-3 px-2 text-center font-medium transition-colors text-xs sm:text-sm ${
                abaSelecionada === 'lote'
                  ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50'
                  : 'text-gray-600 hover:text-purple-600'
              }`}
            >
              Lote
            </button>
            <button
              onClick={() => setAbaSelecionada('categorias')}
              className={`flex-1 py-3 px-2 text-center font-medium transition-colors text-xs sm:text-sm ${
                abaSelecionada === 'categorias'
                  ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50'
                  : 'text-gray-600 hover:text-purple-600'
              }`}
            >
              Categorias
            </button>
          </div>
        </div>

        {abaSelecionada === 'produtos' ? (
          <>
            {/* Configuração de Produtos */}
            <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-6">
              <h2 className="text-base sm:text-lg font-semibold text-gray-800 mb-4">
                Configurar Produto
              </h2>
              <p className="text-xs sm:text-sm text-gray-600 mb-6">
                Configure quantas unidades cada produto possui por tábua ou por forma para cálculos automáticos.
              </p>

              <div className="space-y-4">
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Produto
                  </label>
                  <input
                    type="text"
                    value={produto}
                    onChange={(e) => setProduto(e.target.value)}
                    onFocus={() => setMostrarSugestoes(true)}
                    onBlur={() => setTimeout(() => setMostrarSugestoes(false), 200)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm sm:text-base"
                    placeholder="Digite o nome do produto"
                  />
                  
                  {produtoNovo && (
                    <div className="mt-2 p-3 bg-purple-50 rounded-lg flex items-start space-x-2">
                      <AlertCircle className="h-4 w-4 text-purple-600 flex-shrink-0 mt-0.5" />
                      <p className="text-xs sm:text-sm text-purple-700 font-medium">
                        Produto novo será adicionado automaticamente ao catálogo
                      </p>
                    </div>
                  )}
                  
                  {mostrarSugestoes && produtosFiltrados.length > 0 && (
                    <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-lg shadow-lg z-10 max-h-40 overflow-y-auto">
                      {produtosFiltrados.map((p, index) => (
                        <button
                          key={index}
                          onClick={() => {
                            setProduto(p);
                            setMostrarSugestoes(false);
                          }}
                          className="w-full px-4 py-2 text-left hover:bg-gray-100 first:rounded-t-lg last:rounded-b-lg text-sm"
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Unidades por Tábua
                    </label>
                    <input
                      type="number"
                      value={unidadesPorTabua}
                      onChange={(e) => setUnidadesPorTabua(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm sm:text-base"
                      placeholder="Ex: 12"
                      min="1"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Unidades por Forma
                    </label>
                    <input
                      type="number"
                      value={unidadesPorForma}
                      onChange={(e) => setUnidadesPorForma(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm sm:text-base"
                      placeholder="Ex: 2"
                      min="1"
                    />
                  </div>
                </div>

                <button
                  onClick={salvarConfig}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 px-4 sm:px-6 rounded-lg font-semibold flex items-center justify-center space-x-2 transition-all duration-200 text-sm sm:text-base"
                >
                  <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span>Salvar Configuração</span>
                </button>
              </div>
            </div>

            {/* Lista de Produtos Configurados */}
            <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-4">
                Produtos Configurados
              </h3>
              
              {configuracoes.length === 0 ? (
                <div className="text-center py-8">
                  <Settings className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-sm sm:text-base text-gray-500">Nenhum produto configurado ainda</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {configuracoes.map((config, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-lg"
                    >
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-800 text-sm sm:text-base truncate">
                          {config.produto}
                        </h4>
                        <div className="text-xs sm:text-sm text-gray-600 space-y-1">
                          {config.unidadesPorTabua && (
                            <p>{config.unidadesPorTabua} unidades por tábua</p>
                          )}
                          {config.unidadesPorForma && (
                            <p>{config.unidadesPorForma} unidades por forma</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : abaSelecionada === 'produto-categorias' ? (
          <>
            {/* Configuração de Quem Produz */}
            <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-6">
              <h2 className="text-base sm:text-lg font-semibold text-gray-800 mb-4">
                Configurar Quem Produz Cada Produto
              </h2>
              <p className="text-xs sm:text-sm text-gray-600 mb-6">
                Defina quais categorias de produção podem fabricar cada produto. Por exemplo, um produto pode ser feito tanto pelo Rodrigo (tábuas) quanto pelos Diaristas (formas).
              </p>

              <div className="space-y-4">
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Produto
                  </label>
                  <input
                    type="text"
                    value={produtoSelecionado}
                    onChange={(e) => setProdutoSelecionado(e.target.value)}
                    onFocus={() => setMostrarSugestoesProdCat(true)}
                    onBlur={() => setTimeout(() => setMostrarSugestoesProdCat(false), 200)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm sm:text-base"
                    placeholder="Digite o nome do produto"
                  />
                  
                  {mostrarSugestoesProdCat && produtosFiltradosProdCat.length > 0 && (
                    <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-lg shadow-lg z-10 max-h-40 overflow-y-auto">
                      {produtosFiltradosProdCat.map((p, index) => (
                        <button
                          key={index}
                          onClick={() => {
                            setProdutoSelecionado(p);
                            setMostrarSugestoesProdCat(false);
                          }}
                          className="w-full px-4 py-2 text-left hover:bg-gray-100 first:rounded-t-lg last:rounded-b-lg text-sm"
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Categorias que podem produzir este produto
                  </label>
                  <div className="space-y-2">
                    {categorias.map((categoria) => (
                      <label
                        key={categoria.id}
                        className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={categoriasSelecionadas.includes(categoria.id)}
                          onChange={() => toggleCategoria(categoria.id)}
                          className="sr-only"
                        />
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center mr-3 transition-colors ${
                          categoriasSelecionadas.includes(categoria.id)
                            ? 'bg-purple-600 border-purple-600'
                            : 'border-gray-300'
                        }`}>
                          {categoriasSelecionadas.includes(categoria.id) && (
                            <Check className="h-3 w-3 text-white" />
                          )}
                        </div>
                        <div className="flex-1">
                          <span className="font-medium text-gray-800">{categoria.nome}</span>
                          <p className="text-sm text-gray-600">
                            Tipos: {getTiposTexto(categoria.tipos)}
                            {categoria.descricao && ` • ${categoria.descricao}`}
                          </p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <button
                  onClick={salvarProdutoCategoria}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 px-4 sm:px-6 rounded-lg font-semibold flex items-center justify-center space-x-2 transition-all duration-200 text-sm sm:text-base"
                >
                  <Users className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span>Salvar Configuração</span>
                </button>
              </div>
            </div>

            {/* Lista de Produtos e suas Categorias */}
            <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-4">
                Produtos e Quem Pode Produzir
              </h3>
              
              {Object.keys(produtosCategorias).length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-sm sm:text-base text-gray-500">Nenhuma configuração de categoria por produto ainda</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {Object.entries(produtosCategorias).map(([produto, categoriaIds]) => (
                    <div key={produto} className="p-3 sm:p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-medium text-gray-800 text-sm sm:text-base mb-2">
                        {produto}
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {categoriaIds.map(categoriaId => {
                          const categoria = categorias.find(c => c.id === categoriaId);
                          return categoria ? (
                            <span
                              key={categoriaId}
                              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800"
                            >
                              {categoria.nome} ({getTiposTexto(categoria.tipos)})
                            </span>
                          ) : null;
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : abaSelecionada === 'lote' ? (
          <>
            {/* Configuração em Lote */}
            <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-6">
              <h2 className="text-base sm:text-lg font-semibold text-gray-800 mb-4">
                Configuração em Lote
              </h2>
              <p className="text-xs sm:text-sm text-gray-600 mb-6">
                Configure múltiplos produtos de uma vez. Digite o nome para ver sugestões ou criar produtos novos automaticamente.
              </p>

              <div className="space-y-4">
                {produtosLote.map((produtoLote, index) => (
                  <div key={index} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-700">Produto {index + 1}</h4>
                      {produtosLote.length > 1 && (
                        <button
                          onClick={() => removerLinhaLote(index)}
                          className="p-1 hover:bg-red-100 rounded text-red-600 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="relative">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Nome do Produto
                        </label>
                        <input
                          type="text"
                          value={produtoLote.nome}
                          onChange={(e) => atualizarProdutoLote(index, 'nome', e.target.value)}
                          onFocus={() => atualizarProdutoLote(index, 'mostrarSugestoes', true)}
                          onBlur={() => setTimeout(() => atualizarProdutoLote(index, 'mostrarSugestoes', false), 200)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                          placeholder="Digite o nome do produto"
                        />
                        
                        {produtoLote.produtoNovo && (
                          <div className="mt-1 p-2 bg-purple-50 rounded flex items-start space-x-1">
                            <AlertCircle className="h-3 w-3 text-purple-600 flex-shrink-0 mt-0.5" />
                            <p className="text-xs text-purple-700 font-medium">
                              Produto novo será criado
                            </p>
                          </div>
                        )}
                        
                        {produtoLote.mostrarSugestoes && produtoLote.sugestoes.length > 0 && (
                          <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-lg shadow-lg z-10 max-h-32 overflow-y-auto">
                            {produtoLote.sugestoes.map((sugestao, suggestionIndex) => (
                              <button
                                key={suggestionIndex}
                                onClick={() => selecionarProdutoLote(index, sugestao)}
                                className="w-full px-3 py-2 text-left hover:bg-gray-100 first:rounded-t-lg last:rounded-b-lg text-sm"
                              >
                                {sugestao}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Unidades por Tábua
                        </label>
                        <input
                          type="number"
                          value={produtoLote.unidadesPorTabua}
                          onChange={(e) => atualizarProdutoLote(index, 'unidadesPorTabua', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                          placeholder="Ex: 12"
                          min="1"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Unidades por Forma
                        </label>
                        <input
                          type="number"
                          value={produtoLote.unidadesPorForma}
                          onChange={(e) => atualizarProdutoLote(index, 'unidadesPorForma', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                          placeholder="Ex: 2"
                          min="1"
                        />
                      </div>
                    </div>
                  </div>
                ))}

                <div className="flex gap-3">
                  <button
                    onClick={adicionarLinhaLote}
                    className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-3 px-4 rounded-lg font-semibold flex items-center justify-center space-x-2 transition-all duration-200 text-sm"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Adicionar Produto</span>
                  </button>
                  
                  <button
                    onClick={salvarConfiguracoesLote}
                    className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-3 px-4 rounded-lg font-semibold flex items-center justify-center space-x-2 transition-all duration-200 text-sm"
                  >
                    <Upload className="h-4 w-4" />
                    <span>Salvar Todas</span>
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Configuração de Categorias */}
            <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-6">
              <h2 className="text-base sm:text-lg font-semibold text-gray-800 mb-4">
                Adicionar Nova Categoria
              </h2>
              <p className="text-xs sm:text-sm text-gray-600 mb-6">
                Crie novas categorias de produção para organizar melhor seus produtos.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome da Categoria
                  </label>
                  <input
                    type="text"
                    value={novaCategoria.nome}
                    onChange={(e) => setNovaCategoria({ ...novaCategoria, nome: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm sm:text-base"
                    placeholder="Ex: Produção João"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipos de Medida (pode selecionar múltiplos)
                  </label>
                  <div className="space-y-2">
                    {(['unidades', 'tabuas', 'formas'] as const).map((tipo) => (
                      <label
                        key={tipo}
                        className="flex items-center p-2 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={novaCategoria.tipos.includes(tipo)}
                          onChange={() => toggleTipoNovaCategoria(tipo)}
                          className="sr-only"
                        />
                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center mr-3 transition-colors ${
                          novaCategoria.tipos.includes(tipo)
                            ? 'bg-purple-600 border-purple-600'
                            : 'border-gray-300'
                        }`}>
                          {novaCategoria.tipos.includes(tipo) && (
                            <Check className="h-2.5 w-2.5 text-white" />
                          )}
                        </div>
                        <span className="text-sm font-medium text-gray-700">
                          {getTipoTexto(tipo)}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descrição (opcional)
                  </label>
                  <input
                    type="text"
                    value={novaCategoria.descricao}
                    onChange={(e) => setNovaCategoria({ ...novaCategoria, descricao: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm sm:text-base"
                    placeholder="Descrição da categoria"
                  />
                </div>

                <button
                  onClick={adicionarNovaCategoria}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 px-4 sm:px-6 rounded-lg font-semibold flex items-center justify-center space-x-2 transition-all duration-200 text-sm sm:text-base"
                >
                  <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span>Adicionar Categoria</span>
                </button>
              </div>
            </div>

            {/* Lista de Categorias */}
            <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-4">
                Categorias de Produção
              </h3>
              
              <div className="space-y-3">
                {categorias.map((categoria) => (
                  <div
                    key={categoria.id}
                    className="p-3 sm:p-4 bg-gray-50 rounded-lg"
                  >
                    {editandoCategoria === categoria.id ? (
                      <div className="space-y-3">
                        <input
                          type="text"
                          value={categoriaEditando?.nome || ''}
                          onChange={(e) => setCategoriaEditando(prev => prev ? { ...prev, nome: e.target.value } : null)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                        />
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">Tipos de Medida</label>
                          {(['unidades', 'tabuas', 'formas'] as const).map((tipo) => (
                            <label
                              key={tipo}
                              className="flex items-center p-2 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                            >
                              <input
                                type="checkbox"
                                checked={categoriaEditando?.tipos.includes(tipo) || false}
                                onChange={() => toggleTipoCategoriaEditando(tipo)}
                                className="sr-only"
                              />
                              <div className={`w-4 h-4 rounded border-2 flex items-center justify-center mr-3 transition-colors ${
                                categoriaEditando?.tipos.includes(tipo)
                                  ? 'bg-purple-600 border-purple-600'
                                  : 'border-gray-300'
                              }`}>
                                {categoriaEditando?.tipos.includes(tipo) && (
                                  <Check className="h-2.5 w-2.5 text-white" />
                                )}
                              </div>
                              <span className="text-sm font-medium text-gray-700">
                                {getTipoTexto(tipo)}
                              </span>
                            </label>
                          ))}
                        </div>
                        <input
                          type="text"
                          value={categoriaEditando?.descricao || ''}
                          onChange={(e) => setCategoriaEditando(prev => prev ? { ...prev, descricao: e.target.value } : null)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                          placeholder="Descrição"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={salvarEdicaoCategoria}
                            className="bg-green-600 hover:bg-green-700 text-white py-2 px-3 rounded-lg text-sm flex items-center space-x-1"
                          >
                            <Save className="h-3 w-3" />
                            <span>Salvar</span>
                          </button>
                          <button
                            onClick={cancelarEdicaoCategoria}
                            className="bg-gray-600 hover:bg-gray-700 text-white py-2 px-3 rounded-lg text-sm flex items-center space-x-1"
                          >
                            <X className="h-3 w-3" />
                            <span>Cancelar</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-800 text-sm sm:text-base">
                            {categoria.nome}
                          </h4>
                          <p className="text-xs sm:text-sm text-gray-600">
                            Tipo: {getTipoTexto(categoria.tipo)}
                            {categoria.descricao && ` • ${categoria.descricao}`}
                          </p>
                        </div>
                        <div className="flex gap-2 ml-2">
                          <button
                            onClick={() => iniciarEdicaoCategoria(categoria)}
                            className="p-2 hover:bg-blue-100 rounded text-blue-600 transition-colors"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => removerCategoriaConfirmada(categoria)}
                            className="p-2 hover:bg-red-100 rounded text-red-600 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Configuracoes;