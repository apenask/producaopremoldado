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
  tipos: ('tabuas' | 'formas' | 'unidades')[];
  descricao: string;
}

export type TelaAtiva = 'menu' | 'nova-producao' | 'historico' | 'configuracoes' | 'produtos';