import React, { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, UserPlus, Users, Edit3, Trash2, Calendar, Check, X, Circle, Save, CornerUpLeft } from 'lucide-react'; // INÍCIO DA ALTERAÇÃO: Importar novos ícones
import { TelaAtiva, Diarista, ControleDiaria } from '../types'; // INÍCIO DA ALTERAÇÃO: Importar Diarista e ControleDiaria
import { 
  getDiaristas, 
  addDiarista, 
  updateDiarista, 
  removeDiarista,
  upsertControleDiaria,
  getControleDiariasByPeriod // INÍCIO DA ALTERAÇÃO: Nova função de serviço
} from '../services/supabaseService';
import AlertPersonalizado from './AlertPersonalizado';
import { useAlert } from '../hooks/useAlert';

interface DiaristasProps {
  onNavigate: (tela: TelaAtiva) => void;
}

const Diaristas: React.FC<DiaristasProps> = ({ onNavigate }) => {
  const [diaristas, setDiaristas] = useState<Diarista[]>([]);
  const [novoDiaristaNome, setNovoDiaristaNome] = useState('');
  const [editandoDiaristaId, setEditandoDiaristaId] = useState<string | null>(null);
  const [editandoDiaristaNome, setEditandoDiaristaNome] = useState('');
  const [loading, setLoading] = useState(true);

  // Estados para controle de diárias
  const [dataSelecionada, setDataSelecionada] = useState<string>(new Date().toISOString().split('T')[0]); // Data atual no formato YYYY-MM-DD
  const [presencasDoMes, setPresencasDoMes] = useState<ControleDiaria[]>([]);
  
  const { alert, mostrarAlert, fecharAlert } = useAlert();

  useEffect(() => {
    carregarDiaristas();
  }, []);

  useEffect(() => {
    carregarPresencasDoMes(dataSelecionada);
  }, [dataSelecionada, diaristas]); // Recarregar quando a data ou a lista de diaristas muda

  const carregarDiaristas = async () => {
    try {
      setLoading(true);
      const data = await getDiaristas();
      setDiaristas(data);
    } catch (error: any) {
      mostrarAlert('erro', 'Erro ao carregar diaristas', error.message);
    } finally {
      setLoading(false);
    }
  };

  const carregarPresencasDoMes = async (dataStr: string) => {
    try {
      setLoading(true);
      const dataObj = new Date(dataStr + 'T00:00:00');
      const ano = dataObj.getFullYear();
      const mes = dataObj.getMonth(); // 0-11

      const primeiroDiaDoMes = new Date(ano, mes, 1);
      const ultimoDiaDoMes = new Date(ano, mes + 1, 0); // O dia 0 do próximo mês é o último dia do mês atual

      const startDate = primeiroDiaDoMes.toISOString().split('T')[0];
      const endDate = ultimoDiaDoMes.toISOString().split('T')[0];

      const presencas = await getControleDiariasByPeriod(startDate, endDate);
      setPresencasDoMes(presencas);
    } catch (error: any) {
      console.error('Erro ao carregar presenças do mês:', error);
      mostrarAlert('erro', 'Erro ao carregar presenças', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddDiarista = async () => {
    if (!novoDiaristaNome.trim()) {
      mostrarAlert('aviso', 'Nome vazio', 'O nome do diarista não pode ser vazio.');
      return;
    }
    try {
      await addDiarista(novoDiaristaNome);
      setNovoDiaristaNome('');
      await carregarDiaristas();
      mostrarAlert('sucesso', 'Diarista adicionado', `"${novoDiaristaNome}" adicionado com sucesso.`);
    } catch (error: any) {
      mostrarAlert('erro', 'Erro ao adicionar', error.message);
    }
  };

  const handleEditDiarista = (diarista: Diarista) => {
    setEditandoDiaristaId(diarista.id);
    setEditandoDiaristaNome(diarista.nome);
  };

  const handleSaveEditDiarista = async (id: string) => {
    if (!editandoDiaristaNome.trim()) {
      mostrarAlert('aviso', 'Nome vazio', 'O nome do diarista não pode ser vazio.');
      return;
    }
    try {
      await updateDiarista({ id, nome: editandoDiaristaNome });
      setEditandoDiaristaId(null);
      setEditandoDiaristaNome('');
      await carregarDiaristas();
      mostrarAlert('sucesso', 'Diarista atualizado', `"${editandoDiaristaNome}" atualizado com sucesso.`);
    } catch (error: any) {
      mostrarAlert('erro', 'Erro ao atualizar', error.message);
    }
  };

  const handleCancelEditDiarista = () => {
    setEditandoDiaristaId(null);
    setEditandoDiaristaNome('');
  };

  const handleRemoveDiarista = async (id: string, nome: string) => {
    if (window.confirm(`Tem certeza que deseja remover o diarista "${nome}"?`)) {
      try {
        await removeDiarista(id);
        await carregarDiaristas();
        mostrarAlert('info', 'Diarista removido', `"${nome}" removido.`);
      } catch (error: any) {
        mostrarAlert('erro', 'Erro ao remover', error.message);
      }
    }
  };

  const handleMarcarPresenca = async (diaristaId: string, status: 'presente' | 'falta' | 'meia_diaria') => {
    try {
      await upsertControleDiaria(diaristaId, dataSelecionada, status);
      await carregarPresencasDoMes(dataSelecionada); // Recarregar presenças para a data selecionada
      mostrarAlert('sucesso', 'Presença atualizada', 'Status de presença salvo.');
    } catch (error: any) {
      mostrarAlert('erro', 'Erro ao salvar presença', error.message);
    }
  };

  const getStatusDiaristaNoDia = (diaristaId: string): 'presente' | 'falta' | 'meia_diaria' | null => {
    const registro = presencasDoMes.find(p => p.diarista_id === diaristaId && p.data === dataSelecionada);
    return registro ? registro.status : null;
  };

  // Funções para lidar com a navegação do calendário
  const mudarMes = (offset: number) => {
    const dataAtual = new Date(dataSelecionada + 'T00:00:00');
    dataAtual.setMonth(dataAtual.getMonth() + offset);
    setDataSelecionada(dataAtual.toISOString().split('T')[0]);
  };

  const formatarDataCabecalho = (dataStr: string) => {
    const data = new Date(dataStr + 'T00:00:00');
    return data.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  };

  const obterDiasDoMes = useMemo(() => {
    const dataObj = new Date(dataSelecionada + 'T00:00:00');
    const ano = dataObj.getFullYear();
    const mes = dataObj.getMonth();
    const diasNoMes = new Date(ano, mes + 1, 0).getDate();
    const dias = [];
    for (let i = 1; i <= diasNoMes; i++) {
      dias.push(new Date(ano, mes, i).toISOString().split('T')[0]);
    }
    return dias;
  }, [dataSelecionada]);

  // Função para formatar o cabeçalho do dia da semana e dia do mês
  const formatarDiaExibicao = (dataStr: string) => {
    const data = new Date(dataStr + 'T00:00:00');
    const diaDaSemana = data.toLocaleDateString('pt-BR', { weekday: 'short' });
    const diaDoMes = data.getDate();
    return `${diaDaSemana.charAt(0).toUpperCase() + diaDaSemana.slice(1)} ${diaDoMes}`;
  };

  if (loading && diaristas.length === 0) { // Mostra loading inicial
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-lime-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-lime-100 p-3 sm:p-6">
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
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800 flex-1">Controle de Diaristas</h1>
        </div>

        {/* Adicionar Diarista */}
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-6">
          <h2 className="text-base sm:text-lg font-semibold text-gray-800 mb-4">Adicionar Diarista</h2>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={novoDiaristaNome}
              onChange={(e) => setNovoDiaristaNome(e.target.value)}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm sm:text-base"
              placeholder="Nome do novo diarista"
              onKeyPress={(e) => e.key === 'Enter' && handleAddDiarista()}
            />
            <button
              onClick={handleAddDiarista}
              className="bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg font-semibold flex items-center justify-center space-x-2 transition-all duration-200 text-sm sm:text-base"
            >
              <UserPlus className="h-4 w-4 sm:h-5 sm:w-5" />
              <span>Adicionar</span>
            </button>
          </div>
        </div>

        {/* Lista de Diaristas */}
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-4">Diaristas Cadastrados</h3>
          {diaristas.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-sm sm:text-base text-gray-500">Nenhum diarista cadastrado ainda.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {diaristas.map((diarista) => (
                <div key={diarista.id} className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-lg">
                  {editandoDiaristaId === diarista.id ? (
                    <div className="flex-1 flex flex-col sm:flex-row items-center gap-2">
                      <input
                        type="text"
                        value={editandoDiaristaNome}
                        onChange={(e) => setEditandoDiaristaNome(e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSaveEditDiarista(diarista.id)}
                          className="p-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
                          title="Salvar"
                        >
                          <Save className="h-4 w-4" />
                        </button>
                        <button
                          onClick={handleCancelEditDiarista}
                          className="p-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
                          title="Cancelar"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <h4 className="font-medium text-gray-800 text-sm sm:text-base flex-1 min-w-0 truncate">
                        {diarista.nome}
                      </h4>
                      <div className="flex gap-2 ml-2 flex-shrink-0">
                        <button
                          onClick={() => handleEditDiarista(diarista)}
                          className="p-2 hover:bg-blue-100 rounded text-blue-600 transition-colors"
                          title="Editar"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleRemoveDiarista(diarista.id, diarista.nome)}
                          className="p-2 hover:bg-red-100 rounded text-red-600 transition-colors"
                          title="Remover"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Controle de Presença */}
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-4">Controle de Presença</h3>
          
          {/* Navegação do Calendário */}
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => mudarMes(-1)} className="p-2 rounded-lg hover:bg-gray-100">
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
            <h4 className="font-semibold text-gray-800 text-md sm:text-lg">
              {formatarDataCabecalho(dataSelecionada)}
            </h4>
            <button onClick={() => mudarMes(1)} className="p-2 rounded-lg hover:bg-gray-100">
              <ArrowLeft className="h-5 w-5 text-gray-600 transform rotate-180" /> {/* Ícone virado para a direita */}
            </button>
          </div>

          {/* Seleção de Data */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Selecionar Dia
            </label>
            <input
              type="date"
              value={dataSelecionada}
              onChange={(e) => setDataSelecionada(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm sm:text-base"
            />
          </div>

          {/* Marcar Presença por Diarista */}
          {diaristas.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm sm:text-base text-gray-500">
                Adicione diaristas para registrar a presença.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {diaristas.map(diarista => {
                const statusAtual = getStatusDiaristaNoDia(diarista.id);
                return (
                  <div key={diarista.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                    <span className="font-medium text-gray-800 text-sm sm:text-base flex-1 min-w-0 pr-2">
                      {diarista.nome}
                    </span>
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleMarcarPresenca(diarista.id, 'presente')}
                        className={`p-2 rounded-full transition-colors ${
                          statusAtual === 'presente' ? 'bg-green-500 text-white' : 'text-green-600 hover:bg-green-100'
                        }`}
                        title="Presente"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleMarcarPresenca(diarista.id, 'meia_diaria')}
                        className={`p-2 rounded-full transition-colors ${
                          statusAtual === 'meia_diaria' ? 'bg-yellow-500 text-white' : 'text-yellow-600 hover:bg-yellow-100'
                        }`}
                        title="Meia Diária"
                      >
                        <Circle className="h-4 w-4 fill-current" /> {/* Ícone de círculo preenchido */}
                      </button>
                      <button
                        onClick={() => handleMarcarPresenca(diarista.id, 'falta')}
                        className={`p-2 rounded-full transition-colors ${
                          statusAtual === 'falta' ? 'bg-red-500 text-white' : 'text-red-600 hover:bg-red-100'
                        }`}
                        title="Falta"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Histórico de Presenças do Mês (simplificado para uma tabela básica) */}
          <div className="mt-8">
            <h4 className="text-base font-semibold text-gray-800 mb-3">Histórico do Mês ({formatarDataCabecalho(dataSelecionada)})</h4>
            {presencasDoMes.length === 0 ? (
              <div className="text-center py-4 text-gray-500 text-sm">
                Nenhum registro de presença para este mês.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                  <thead>
                    <tr className="bg-gray-100 text-gray-600 uppercase text-xs leading-normal">
                      <th className="py-3 px-6 text-left">Diarista</th>
                      {obterDiasDoMes.map(dia => (
                        <th key={dia} className="py-3 px-2 text-center border-l border-gray-200 whitespace-nowrap">
                          <div className="flex flex-col items-center">
                            <span className="font-bold">{new Date(dia + 'T00:00:00').getDate()}</span>
                            <span className="font-normal text-xs opacity-75">{new Date(dia + 'T00:00:00').toLocaleDateString('pt-BR', { weekday: 'short' }).substring(0,3).toUpperCase()}</span>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="text-gray-600 text-sm font-light">
                    {diaristas.map(diarista => (
                      <tr key={diarista.id} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="py-3 px-6 text-left whitespace-nowrap font-medium">
                          {diarista.nome}
                        </td>
                        {obterDiasDoMes.map(dia => {
                          const registro = presencasDoMes.find(p => p.diarista_id === diarista.id && p.data === dia);
                          let statusIcon;
                          let statusClass;
                          switch (registro?.status) {
                            case 'presente':
                              statusIcon = <Check className="h-4 w-4" />;
                              statusClass = 'text-green-500';
                              break;
                            case 'meia_diaria':
                              statusIcon = <Circle className="h-4 w-4 fill-current" />;
                              statusClass = 'text-yellow-500';
                              break;
                            case 'falta':
                              statusIcon = <X className="h-4 w-4" />;
                              statusClass = 'text-red-500';
                              break;
                            default:
                              statusIcon = <span className="text-gray-300">-</span>; // Sem registro
                              statusClass = '';
                              break;
                          }
                          return (
                            <td key={dia} className="py-3 px-2 text-center border-l border-gray-200">
                              <div className={`flex items-center justify-center ${statusClass}`}>
                                {statusIcon}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default Diaristas;