import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Search, Copy, Check, Trash2, AlertCircle, Settings, CheckCircle } from 'lucide-react';
import { TelaAtiva, ItemProducao, CategoriaProducao } from '../types';
import { 
  getProdutos, 
  adicionarProduto, 
  salvarProducao, 
  formatarData, 
  formatarDataChave,
  buscarProdutos,
  produtoExiste,
  getCategorias,
  calcularUnidadesTotal,
  getConfiguracaoProduto,
  temConfiguracaoTabua, // INÍCIO DA ALTERAÇÃO: Nova importação
  temConfiguracaoForma // FIM DA ALTERAÇÃO: Nova importação
} from '../services/supabaseService';
import AlertPersonalizado from './AlertPersonalizado';
import { useAlert } from '../hooks/useAlert';

interface NovaProducaoProps {
  onNavigate: (tela: TelaAtiva) => void;
}

const NovaProducao: React.FC<NovaProducaoProps> = ({ onNavigate }) => {
  const [produto, setProduto] = useState('');
  const [quantidade, setQuantidade] = useState('');
  const [categoriaId, setCategoriaId] = useState('');
  const [itens, setItens] = useState<ItemProducao[]>([]);
  const [produtos, setProdutos] = useState<string[]>([]);
  const [categorias, setCategorias] = useState<CategoriaProducao[]>([]);
  const [produtosFiltrados, setProdutosFiltrados] = useState<string[]>([]);
  const [mostrarSugestoes, setMostrarSugestoes] = useState(false);
  const [textoGerado, setTextoGerado] = useState('');
  const [copiado, setCopiado] = useState(false);
  const [producaoConcluida, setProducaoConcluida] = useState(false);
  const [produtoNovo, setProdutoNovo] = useState(false);
  // INÍCIO DA ALTERAÇÃO: Novos estados para configuração de produto
  const [loading, setLoading] = useState(true);
  const [configuracaoProduto, setConfiguracaoProduto] = useState<any>(null);
  const [temConfiguracaoTabuaParaProduto, setTemConfiguracaoTabuaParaProduto] = useState(false); 
  const [temConfiguracaoFormaParaProduto, setTemConfiguracaoFormaParaProduto] = useState(false); 
  const [tipoSelecionado, setTipoSelecionado] = useState<'tabuas' | 'formas' | 'unidades'>('unidades');
  // FIM DA ALTERAÇÃO: Novos estados para configuração de produto
  
  const { alert, mostrarAlert, fecharAlert } = useAlert();

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      setLoading(true);
      const [produtosData, categoriasData] = await Promise.all([
        getProdutos(),
        getCategorias()
      ]);
      
      setProdutos(produtosData);
      setCategorias(categoriasData);
      
      if (categoriasData.length > 0) {
        setCategoriaId(categoriasData[0].id);
      }
    } catch (error: any) {
      mostrarAlert('erro', 'Erro ao carregar dados', error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (produto) {
      buscarProdutosAsync(produto);
      // INÍCIO DA ALTERAÇÃO: Chamar verificação de configuração ao mudar o produto
      verificarConfiguracaoProduto(produto);
      // FIM DA ALTERAÇÃO
    } else {
      setProdutosFiltrados([]);
      setProdutoNovo(false);
      // INÍCIO DA ALTERAÇÃO: Resetar estados de configuração ao limpar produto
      setConfiguracaoProduto(null);
      setTemConfiguracaoTabuaParaProduto(false); 
      setTemConfiguracaoFormaParaProduto(false); 
      // FIM DA ALTERAÇÃO
    }
  }, [produto]);

  // INÍCIO DA ALTERAÇÃO: Remova ou comente este useEffect, pois o tipo de medida será selecionado manualmente.
  /*
  useEffect(() => {
    const categoria = getCategoriaAtual();
    if (categoria) {
      setTipoSelecionado(categoria.tipo);
    }
  }, [categoriaId]);
  */
  // FIM DA ALTERAÇÃO

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

  // INÍCIO DA ALTERAÇÃO: Nova função para verificar configuração do produto
  const verificarConfiguracaoProduto = async (nomeProduto: string) => {
    try {
      const produtoTrimmed = nomeProduto.trim().toUpperCase().replace(/\s+/g, ' ');
      
      const [config, temTabua, temForma] = await Promise.all([
        getConfiguracaoProduto(produtoTrimmed),
        temConfiguracaoTabua(produtoTrimmed),
        temConfiguracaoForma(produtoTrimmed)
      ]);
      
      setConfiguracaoProduto(config);
      setTemConfiguracaoTabuaParaProduto(temTabua);
      setTemConfiguracaoFormaParaProduto(temForma);
    } catch (error: any) {
      console.error('Erro ao verificar configuração:', error);
      setConfiguracaoProduto(null);
      setTemConfiguracaoTabuaParaProduto(false);
      setTemConfiguracaoFormaParaProduto(false);
    }
  };
  // FIM DA ALTERAÇÃO

  const getCategoriaAtual = (): CategoriaProducao | undefined => {
    return categorias.find(c => c.id === categoriaId);
  };

  // INÍCIO DA ALTERAÇÃO: Lógica para calcular preview de unidades baseada no tipo selecionado
  const calcularPreviewUnidades = (): number | undefined => {
    const qtd = parseInt(quantidade);
    
    if (!configuracaoProduto || isNaN(qtd)) return undefined;
    
    if (tipoSelecionado === 'tabuas' && configuracaoProduto.unidadesPorTabua) {
      return qtd * configuracaoProduto.unidadesPorTabua;
    } else if (tipoSelecionado === 'formas' && configuracaoProduto.unidadesPorForma) {
      return qtd * configuracaoProduto.unidadesPorForma;
    } else if (tipoSelecionado === 'unidades') {
      return qtd;
    }
    
    return undefined;
  };
  // FIM DA ALTERAÇÃO

  const adicionarItem = async () => {
    if (!produto || !quantidade) {
      mostrarAlert('aviso', 'Campos obrigatórios', 'Preencha o produto e a quantidade.');
      return;
    }

    const qtd = parseInt(quantidade);
    if (isNaN(qtd) || qtd <= 0) {
      mostrarAlert('erro', 'Quantidade inválida', 'A quantidade deve ser um número maior que zero.');
      return;
    }

    const produtoTrimmed = produto.trim().toUpperCase().replace(/\s+/g, ' ');
    const categoria = getCategoriaAtual();
    
    if (!categoria) {
      mostrarAlert('erro', 'Categoria inválida', 'Selecione uma categoria válida.');
      return;
    }

    try {
      // INÍCIO DA ALTERAÇÃO: Passar o tipoSelecionado para calcularUnidadesTotal e verificar configuração
      const unidadesTotal = await calcularUnidadesTotal(produtoTrimmed, qtd, categoria, tipoSelecionado);
      
      if (tipoSelecionado === 'tabuas' && !temConfiguracaoTabuaParaProduto) {
        mostrarAlert(
          'aviso', 
          'Configuração necessária', 
          `Configure a quantidade por tábua para este produto nas Configurações antes de adicionar.`
        );
        return;
      }
      if (tipoSelecionado === 'formas' && !temConfiguracaoFormaParaProduto) {
        mostrarAlert(
          'aviso', 
          'Configuração necessária', 
          `Configure a quantidade por forma para este produto nas Configurações antes de adicionar.`
        );
        return;
      }
      // FIM DA ALTERAÇÃO

      const novoItem: ItemProducao = {
        id: Date.now().toString(),
        produto: produtoTrimmed,
        quantidade: qtd,
        categoria: categoria.nome,
        unidadesTotal,
        tipoMedida: tipoSelecionado // LINHA ALTERADA: Salvar o tipo de medida selecionado
      };

      setItens([...itens, novoItem]);
      
      if (produtoNovo) {
        await adicionarProduto(produtoTrimmed);
        const novoProdutos = await getProdutos();
        setProdutos(novoProdutos);
        mostrarAlert('sucesso', 'Produto adicionado', `"${produtoTrimmed}" foi adicionado ao catálogo.`);
      }
      
      setProduto('');
      setQuantidade('');
      setMostrarSugestoes(false);
      setProdutoNovo(false);
      // INÍCIO DA ALTERAÇÃO: Resetar estados de configuração e tipo selecionado
      setConfiguracaoProduto(null);
      setTemConfiguracaoTabuaParaProduto(false); 
      setTemConfiguracaoFormaParaProduto(false); 
      setTipoSelecionado('unidades'); 
      // FIM DA ALTERAÇÃO
      
      mostrarAlert('sucesso', 'Item adicionado', 'Item adicionado à produção com sucesso.');
    } catch (error: any) {
      mostrarAlert('erro', 'Erro ao adicionar item', error.message);
    }
  };

  const removerItem = (id: string) => {
    setItens(itens.filter(item => item.id !== id));
    mostrarAlert('info', 'Item removido', 'Item removido da produção.');
  };

  const concluirProducao = async () => {
    if (itens.length === 0) {
      mostrarAlert('aviso', 'Produção vazia', 'Adicione pelo menos um item antes de concluir a produção.');
      return;
    }

    try {
      const hoje = new Date();
      const dataFormatada = hoje.toLocaleDateString('pt-BR');
      const dataChave = formatarDataChave(hoje);

      const itensPorCategoria = itens.reduce((acc, item) => {
        if (!acc[item.categoria]) {
          acc[item.categoria] = [];
        }
        acc[item.categoria].push(item);
        return acc;
      }, {} as Record<string, ItemProducao[]>);

      let texto = `Produção do dia ${dataFormatada}\n\n`;

      Object.entries(itensPorCategoria).forEach(([nomeCategoria, itensCategoria]) => {
        texto += `${nomeCategoria}:\n`;
        
        itensCategoria.forEach(item => {
          const tipoItem = item.tipoMedida || 'unidades'; // LINHA ALTERADA: Usar tipoMedida do item
          if (tipoItem === 'tabuas') { // LINHA ALTERADA: Usar tipoItem para formar o texto
            texto += `* ${item.produto}: ${item.quantidade} tábuas`;
            if (item.unidadesTotal) {
              texto += ` = ${item.unidadesTotal} unidades`;
            }
            texto += '\n';
          } else if (tipoItem === 'formas') { // LINHA ALTERADA: Usar tipoItem para formar o texto
            texto += `* ${item.produto}: ${item.quantidade} formas`;
            if (item.unidadesTotal) {
              texto += ` = ${item.unidadesTotal} unidades`;
            }
            texto += '\n';
          } else { // unidades
            texto += `* ${item.produto}: ${item.quantidade} unidades\n`;
          }
        });
        texto += '\n'; // Adiciona uma linha em branco entre as categorias
      });
      // LINHA ALTERADA: Remove a última linha em branco se houver
      texto = texto.trimEnd();


      setTextoGerado(texto);
      setProducaoConcluida(true);

      const producao = {
        data: dataChave,
        itens,
        textoGerado: texto
      };

      await salvarProducao(producao);
      mostrarAlert('sucesso', 'Produção concluída', 'Produção salva com sucesso!');
    } catch (error: any) {
      mostrarAlert('erro', 'Erro ao salvar produção', error.message);
    }
  };

  const copiarTexto = async () => {
    try {
      await navigator.clipboard.writeText(textoGerado);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
      mostrarAlert('sucesso', 'Texto copiado', 'Texto copiado para a área de transferência!');
    } catch (err) {
      mostrarAlert('erro', 'Erro ao copiar', 'Não foi possível copiar o texto. Tente novamente.');
    }
  };

  const reiniciarProducao = () => {
    setItens([]);
    setTextoGerado('');
    setProducaoConcluida(false);
    setCopiado(false);
    mostrarAlert('info', 'Nova produção', 'Pronto para registrar uma nova produção.');
  };

  // INÍCIO DA ALTERAÇÃO: Função para obter o rótulo da quantidade com base no tipo selecionado
  const getTextoQuantidadeLabel = (currentTipoSelecionado: 'tabuas' | 'formas' | 'unidades'): string => {
    switch(currentTipoSelecionado) {
      case 'tabuas': return 'Quantidade (tábuas)';
      case 'formas': return 'Quantidade (formas)';
      case 'unidades': return 'Quantidade (unidades)';
      default: return 'Quantidade';
    }
  };
  // FIM DA ALTERAÇÃO

  // INÍCIO DA ALTERAÇÃO: Ajusta a exibição dos itens para considerar o tipoMedida salvo
  const getTextoExibicao = (item: ItemProducao): string => {
    const tipoItem = item.tipoMedida || 'unidades';
    
    if (tipoItem === 'tabuas') {
      return `${item.quantidade} tábuas${item.unidadesTotal ? ` (${item.unidadesTotal} unidades)` : ''}`;
    } else if (tipoItem === 'formas') {
      return `${item.quantidade} formas${item.unidadesTotal ? ` (${item.unidadesTotal} unidades)` : ''}`;
    } else {
      return `${item.quantidade} unidades`;
    }
  };
  // FIM DA ALTERAÇÃO

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

  if (producaoConcluida) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 p-3 sm:p-6">
        <AlertPersonalizado
          tipo={alert.tipo}
          titulo={alert.titulo}
          mensagem={alert.mensagem}
          visivel={alert.visivel}
          onFechar={fecharAlert}
        />
        
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-6">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-green-600 rounded-full mb-4">
                <Check className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">
                Produção Concluída!
              </h2>
              <p className="text-sm sm:text-base text-gray-600">
                Texto gerado automaticamente
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-3 sm:p-4 mb-6">
              <pre className="whitespace-pre-wrap text-xs sm:text-sm text-gray-700 font-mono overflow-x-auto">
                {textoGerado}
              </pre>
            </div>

            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
              <button
                onClick={copiarTexto}
                className={`flex-1 ${copiado ? 'bg-green-600' : 'bg-blue-600'} hover:bg-blue-700 text-white py-3 px-4 sm:px-6 rounded-lg font-semibold flex items-center justify-center space-x-2 transition-all duration-200 text-sm sm:text-base`}
              >
                {copiado ? <Check className="h-4 w-4 sm:h-5 sm:w-5" /> : <Copy className="h-4 w-4 sm:h-5 sm:w-5" />}
                <span>{copiado ? 'Copiado!' : 'Copiar texto para WhatsApp'}</span>
              </button>
            </div>

            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 mt-4">
              <button
                onClick={reiniciarProducao}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-3 px-4 sm:px-6 rounded-lg font-semibold transition-all duration-200 text-sm sm:text-base"
              >
                Nova Produção
              </button>
              <button
                onClick={() => onNavigate('menu')}
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-3 px-4 sm:px-6 rounded-lg font-semibold transition-all duration-200 text-sm sm:text-base"
              >
                Voltar ao Menu
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const categoriaAtual = getCategoriaAtual();
  const previewUnidades = calcularPreviewUnidades();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-3 sm:p-6">
      <AlertPersonalizado
        tipo={alert.tipo}
        titulo={alert.titulo}
        mensagem={alert.mensagem}
        visivel={alert.visivel}
        onFechar={fecharAlert}
      />
      
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center mb-4 sm:mb-6">
          <button
            onClick={() => onNavigate('menu')}
            className="mr-3 sm:mr-4 p-2 hover:bg-white/50 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5 sm:h-6 sm:w-6 text-gray-600" />
          </button>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Nova Produção</h1>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-6">
          <div className="space-y-4">
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Produto
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={produto}
                  onChange={(e) => setProduto(e.target.value)}
                  onFocus={() => setMostrarSugestoes(true)}
                  onBlur={() => setTimeout(() => setMostrarSugestoes(false), 200)}
                  className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                  placeholder="Digite o nome do produto"
                />
                <Search className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
              </div>
              
              {produtoNovo && (
                <div className="mt-2 p-3 bg-blue-50 rounded-lg flex items-start space-x-2">
                  <AlertCircle className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs sm:text-sm text-blue-700 font-medium">
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categoria
              </label>
              <select
                value={categoriaId}
                onChange={(e) => setCategoriaId(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
              >
                {categorias.map((categoria) => (
                  <option key={categoria.id} value={categoria.id}>
                    {categoria.nome}
                  </option>
                ))}
              </select>
            </div>

            {/* INÍCIO DA ALTERAÇÃO: Novo seletor de tipo de medida */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Medida
              </label>
              <select
                value={tipoSelecionado}
                onChange={(e) => setTipoSelecionado(e.target.value as 'tabuas' | 'formas' | 'unidades')}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
              >
                <option value="unidades">Unidades</option>
                <option value="tabuas">Tábuas</option>
                <option value="formas">Formas</option>
              </select>
            </div>
            {/* FIM DA ALTERAÇÃO */}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {/* LINHA ALTERADA: Usar o novo rótulo da função */}
                {getTextoQuantidadeLabel(tipoSelecionado)}
              </label>
              <input
                type="number"
                value={quantidade}
                onChange={(e) => setQuantidade(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                placeholder="Digite a quantidade"
                min="1"
              />
              
              {/* INÍCIO DA ALTERAÇÃO: Lógica de status de configuração ajustada */}
              {produto && configuracaoProduto && (tipoSelecionado === 'tabuas' || tipoSelecionado === 'formas') ? (
                <div className="mt-2">
                  {(tipoSelecionado === 'tabuas' && temConfiguracaoTabuaParaProduto) || 
                   (tipoSelecionado === 'formas' && temConfiguracaoFormaParaProduto) ? (
                    <div className="p-3 bg-green-50 rounded-lg flex items-start space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-xs sm:text-sm text-green-700 font-medium">
                          Produto configurado para {tipoSelecionado === 'tabuas' ? 'tábuas' : 'formas'}
                        </p>
                        {previewUnidades && quantidade && (
                          <p className="text-xs text-green-600 mt-1">
                            {quantidade} {tipoSelecionado} = {previewUnidades} unidades
                          </p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-orange-50 rounded-lg">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                        <p className="text-xs sm:text-sm text-orange-700 font-medium">
                          Configure a quantidade por {tipoSelecionado === 'tabuas' ? 'tábua' : 'forma'} para este produto.
                        </p>
                        <button
                          onClick={() => onNavigate('configuracoes')}
                          className="self-start sm:ml-3 px-3 py-1 bg-orange-100 hover:bg-orange-200 text-orange-700 rounded-md text-xs font-medium flex items-center space-x-1 transition-colors"
                        >
                          <Settings className="h-3 w-3" />
                          <span>Configurar</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
            {/* FIM DA ALTERAÇÃO */}

            <button
              onClick={adicionarItem}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 sm:px-6 rounded-lg font-semibold flex items-center justify-center space-x-2 transition-all duration-200 text-sm sm:text-base"
            >
              <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
              <span>Adicionar Item</span>
            </button>
          </div>
        </div>

        {itens.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Itens da Produção
            </h3>
            
            {categorias.map(categoria => {
              const itensCategoria = itens.filter(item => item.categoria === categoria.nome);
              if (itensCategoria.length === 0) return null;

              return (
                <div key={categoria.id} className="mb-6 last:mb-0">
                  <h4 className="font-medium text-gray-700 mb-3 text-sm sm:text-base">{categoria.nome}:</h4>
                  <div className="space-y-2">
                    {itensCategoria.map(item => (
                      <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1 min-w-0">
                          <span className="font-medium text-gray-800 text-sm sm:text-base block sm:inline">
                            {item.produto}:
                          </span>
                          <span className="text-gray-600 ml-0 sm:ml-2 text-sm block sm:inline">
                            {/* LINHA ALTERADA: Usar a função de exibição atualizada */}
                            {getTextoExibicao(item)}
                          </span>
                        </div>
                        <button
                          onClick={() => removerItem(item.id)}
                          className="p-1 hover:bg-red-100 rounded text-red-600 transition-colors ml-2 flex-shrink-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            <button
              onClick={concluirProducao}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-4 sm:px-6 rounded-lg font-semibold transition-all duration-200 text-sm sm:text-base"
            >
              Concluir Produção
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default NovaProducao;