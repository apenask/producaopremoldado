import React, { useState, useEffect } from 'react';
import { ArrowLeft, Calendar, Eye, Edit3, Trash2, Save, X } from 'lucide-react';
import { TelaAtiva, ProducaoDiaria, ItemProducao } from '../types';
import { getProducoes, formatarData, removerProducao, salvarProducao, getCategorias } from '../services/supabaseService';
import AlertPersonalizado from './AlertPersonalizado';
import { useAlert } from '../hooks/useAlert';

interface HistoricoProps {
  onNavigate: (tela: TelaAtiva) => void;
}

const Historico: React.FC<HistoricoProps> = ({ onNavigate }) => {
  const [producoes, setProducoes] = useState<ProducaoDiaria[]>([]);
  const [producaoSelecionada, setProducaoSelecionada] = useState<ProducaoDiaria | null>(null);
  const [editando, setEditando] = useState(false);
  const [itensEditando, setItensEditando] = useState<ItemProducao[]>([]);
  const [loading, setLoading] = useState(true);
  
  const { alert, mostrarAlert, fecharAlert } = useAlert();

  useEffect(() => {
    carregarProducoes();
  }, []);

  const carregarProducoes = async () => {
    try {
      setLoading(true);
      const dadosProducoes = await getProducoes();
      const listaProducoes = Object.values(dadosProducoes).sort((a, b) => 
        new Date(b.data).getTime() - new Date(a.data).getTime()
      );
      setProducoes(listaProducoes);
    } catch (error: any) {
      mostrarAlert('erro', 'Erro ao carregar produções', error.message);
    } finally {
      setLoading(false);
    }
  };

  const formatarDataExibicao = (dataString: string) => {
    const data = new Date(dataString + 'T00:00:00');
    return formatarData(data);
  };

  const removerProducaoConfirmada = async (producao: ProducaoDiaria) => {
    if (window.confirm(`Tem certeza que deseja remover a produção de ${formatarDataExibicao(producao.data)}?`)) {
      try {
        await removerProducao(producao.data);
        await carregarProducoes();
        setProducaoSelecionada(null);
        mostrarAlert('info', 'Produção removida', 'Produção foi removida com sucesso.');
      } catch (error: any) {
        mostrarAlert('erro', 'Erro ao remover produção', error.message);
      }
    }
  };

  const iniciarEdicao = () => {
    if (producaoSelecionada) {
      setItensEditando([...producaoSelecionada.itens]);
      setEditando(true);
    }
  };

  const cancelarEdicao = () => {
    setEditando(false);
    setItensEditando([]);
  };

  const salvarEdicao = async () => {
    if (!producaoSelecionada) return;

    try {
      // Regenera o texto baseado nos itens editados
      const categorias = await getCategorias();
      const hoje = new Date(producaoSelecionada.data + 'T00:00:00');
      const dataFormatada = hoje.toLocaleDateString('pt-BR');

      // Agrupa itens por categoria
      const itensPorCategoria = itensEditando.reduce((acc, item) => {
        if (!acc[item.categoria]) {
          acc[item.categoria] = [];
        }
        acc[item.categoria].push(item);
        return acc;
      }, {} as Record<string, ItemProducao[]>);

      let texto = `Produção do dia ${dataFormatada}\n\n`;

      Object.entries(itensPorCategoria).forEach(([nomeCategoria, itensCategoria]) => {
        const categoria = categorias.find(c => c.nome === nomeCategoria);
        texto += `${nomeCategoria}:\n`;
        
        itensCategoria.forEach(item => {
          const tipoItem = item.tipoMedida || 'unidades';
          if (tipoItem === 'tabuas') {
            texto += `* ${item.produto}:\n* ${item.quantidade} tabuas = ${item.unidadesTotal} unidades\n\n`;
          } else if (tipoItem === 'formas') {
            texto += `* ${item.produto}: ${item.quantidade} formas = ${item.unidadesTotal} unidades\n`;
          } else {
            texto += `* ${item.produto}: ${item.quantidade} unidades\n`;
          }
        });
        texto += '\n';
      });

      const producaoAtualizada = {
        ...producaoSelecionada,
        itens: itensEditando,
        textoGerado: texto
      };

      await salvarProducao(producaoAtualizada);
      setProducaoSelecionada(producaoAtualizada);
      await carregarProducoes();
      setEditando(false);
      setItensEditando([]);
      mostrarAlert('sucesso', 'Produção atualizada', 'Produção foi atualizada com sucesso.');
    } catch (error: any) {
      mostrarAlert('erro', 'Erro ao atualizar produção', error.message);
    }
  };

  const removerItem = (id: string) => {
    setItensEditando(itensEditando.filter(item => item.id !== id));
  };

  const atualizarQuantidade = async (id: string, novaQuantidade: number) => {
    try {
      const categorias = await getCategorias();
      
      setItensEditando(itensEditando.map(item => {
        if (item.id === id) {
          const categoria = categorias.find(c => c.nome === item.categoria);
          const tipoItem = item.tipoMedida || 'unidades';
          
          let unidadesTotal = novaQuantidade;
          if (tipoItem === 'tabuas' && item.unidadesTotal) {
            const unidadesPorTabua = Math.round(item.unidadesTotal / item.quantidade);
            unidadesTotal = novaQuantidade * unidadesPorTabua;
          } else if (tipoItem === 'formas' && item.unidadesTotal) {
            const unidadesPorForma = Math.round(item.unidadesTotal / item.quantidade);
            unidadesTotal = novaQuantidade * unidadesPorForma;
          }
          
          return {
            ...item,
            quantidade: novaQuantidade,
            unidadesTotal
          };
        }
        return item;
      }));
    } catch (error: any) {
      mostrarAlert('erro', 'Erro ao atualizar quantidade', error.message);
    }
  };

  const getTextoExibicao = async (item: ItemProducao): Promise<string> => {
    try {
      const categorias = await getCategorias();
      const categoria = categorias.find(c => c.nome === item.categoria);
      const tipoItem = item.tipoMedida || 'unidades';
      
      if (tipoItem === 'tabuas') {
        return `${item.quantidade} tábuas (${item.unidadesTotal} unidades)`;
      } else if (tipoItem === 'formas') {
        return `${item.quantidade} formas (${item.unidadesTotal} unidades)`;
      } else {
        return `${item.quantidade} unidades`;
      }
    } catch {
      return `${item.quantidade} unidades`;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-green-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (producaoSelecionada) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-green-100 p-3 sm:p-6">
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
              onClick={() => setProducaoSelecionada(null)}
              className="mr-3 sm:mr-4 p-2 hover:bg-white/50 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5 sm:h-6 sm:w-6 text-gray-600" />
            </button>
            <h1 className="text-lg sm:text-2xl font-bold text-gray-800 flex-1">
              Produção de {formatarDataExibicao(producaoSelecionada.data)}
            </h1>
            <div className="flex gap-2">
              {editando ? (
                <>
                  <button
                    onClick={salvarEdicao}
                    className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                    title="Salvar alterações"
                  >
                    <Save className="h-4 w-4 sm:h-5 sm:w-5" />
                  </button>
                  <button
                    onClick={cancelarEdicao}
                    className="p-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                    title="Cancelar edição"
                  >
                    <X className="h-4 w-4 sm:h-5 sm:w-5" />
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={iniciarEdicao}
                    className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                    title="Editar produção"
                  >
                    <Edit3 className="h-4 w-4 sm:h-5 sm:w-5" />
                  </button>
                  <button
                    onClick={() => removerProducaoConfirmada(producaoSelecionada)}
                    className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                    title="Remover produção"
                  >
                    <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" />
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-6">
            <div className="space-y-6">
              {/* Aqui você pode agrupar por categoria se necessário */}
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3">
                  Itens da Produção
                </h3>
                <div className="space-y-2">
                  {(editando ? itensEditando : producaoSelecionada.itens).map(item => (
                    <div key={item.id} className="p-3 bg-gray-50 rounded-lg">
                      {editando ? (
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <span className="font-medium text-gray-800 text-sm sm:text-base block">
                              {item.produto}
                            </span>
                            <div className="flex items-center mt-2 space-x-2">
                              <input
                                type="number"
                                value={item.quantidade}
                                onChange={(e) => atualizarQuantidade(item.id, parseInt(e.target.value) || 0)}
                                className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                                min="1"
                              />
                              <span className="text-gray-600 text-sm">
                                {item.categoria}
                                {item.unidadesTotal && ` = ${item.unidadesTotal} unidades`}
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() => removerItem(item.id)}
                            className="p-1 hover:bg-red-100 rounded text-red-600 transition-colors ml-2"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <span className="font-medium text-gray-800 text-sm sm:text-base block sm:inline">
                            {item.produto}:
                          </span>
                          <span className="text-gray-600 ml-0 sm:ml-2 text-sm sm:text-base block sm:inline">
                            {item.quantidade} {item.tipoMedida || 'unidades'}
                            {item.unidadesTotal && ` (${item.unidadesTotal} unidades)`}
                          </span>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-4">
              Texto Gerado
            </h3>
            <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
              <pre className="whitespace-pre-wrap text-xs sm:text-sm text-gray-700 font-mono overflow-x-auto">
                {producaoSelecionada.textoGerado}
              </pre>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-green-100 p-3 sm:p-6">
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
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Histórico</h1>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
          {producoes.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-sm sm:text-base text-gray-500">Nenhuma produção registrada ainda</p>
            </div>
          ) : (
            <div className="space-y-3">
              {producoes.map((producao, index) => (
                <div
                  key={producao.data}
                  className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                  onClick={() => setProducaoSelecionada(producao)}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-medium text-gray-800 text-sm sm:text-base">
                        {formatarDataExibicao(producao.data)}
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-500">
                        {producao.itens.length} itens registrados
                      </p>
                    </div>
                  </div>
                  <Eye className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 flex-shrink-0" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Historico;