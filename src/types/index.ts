export interface Produto {
  nome: string;
  unidadesPorTabua?: number;
}

export interface ItemProducao {
  id: string;
  produto: string;
  quantidade: number;
  categoria: string;
  unidadesTotal?: number;
  tipoMedida?: 'tabuas' | 'formas' | 'unidades';
}

export interface ProducaoDiaria {
  data: string;
  itens: ItemProducao[];
  textoGerado: string;
}

export interface ConfiguracaoProduto {
  produto: string;
  unidadesPorTabua?: number;
  unidadesPorForma?: number;
}

export interface CategoriaProducao {
  id: string;
  nome: string;
  tipo: 'tabuas' | 'formas' | 'unidades';
  descricao: string;
}

export interface Diarista {
  id: string;
  nome: string;
  created_at?: string;
  updated_at?: string;
}

export interface ControleDiaria {
  id: string;
  diarista_id: string;
  data: string;
  status: 'presente' | 'falta' | 'meia_diaria';
  created_at?: string;
  updated_at?: string;
}

// INÍCIO DA ALTERAÇÃO: Adicionado 'diaristas' ao tipo TelaAtiva
export type TelaAtiva = 'menu' | 'nova-producao' | 'historico' | 'configuracoes' | 'produtos' | 'diaristas';
// FIM DA ALTERAÇÃO