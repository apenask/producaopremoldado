import { ProducaoDiaria, ConfiguracaoProduto, CategoriaProducao } from '../types';

const STORAGE_KEYS = {
  PRODUCOES: 'producoes',
  CONFIGURACOES: 'configuracoes',
  PRODUTOS: 'produtos',
  CATEGORIAS: 'categorias'
};

// Lista inicial de produtos da fábrica
const PRODUTOS_INICIAIS = [
  // Blocos
  'BLOCO 09X19X39 02 FUROS VEDA',
  'CANALETA 09',
  'BLOCO 09 02 FUROS',
  'CANALETAS 14',
  'CANALETA 14',
  'MEIO BLOCO 19X19X19',
  'BLOCOS 09 03 FUROS COM FUNDO',
  'BLOCO 14X19X39 02 TIPA A – VEDA',
  'CANALETAS 09',
  'MEIO BLOCO 14X19X19',
  'CANALETA 19',
  'CANALETAS 19',
  'BLOCO 14 02 FUROS',
  
  // Pisos e Revestimentos
  'PISO 35X70X5 CM C/ MALHA',
  'PISO PAIVER 04 CM VERMELHO',
  'PISO 20X20 SEXTAVADO 02 CM',
  'CAPAS DE MURO 17X80',
  'PISO OSSINHO 03 CM',
  'PISO SEXTAVADO 25X25 04 CM',
  'PISO 03 PONTAS 03 CM',
  'GUIA DE MEIO FIO',
  'REVESTIMENTO TIJOLINHO',
  'CAPAS DE MURO 30X90',
  'PISO CAQUINHO 20X20',
  'KITS DE REVEST. MOSAICO + 12 PÇ',
  'PISO PAIVER 06 CM',
  'PISO 33X33 COPACABANA',
  'COBOGO 30X30 TRIANGULO',
  'BLOQUETE 25X25X7 C/BUCHA "8"',
  'PISO TÁTIL 25X25 ALERTA',
  'MARCO DE CONCRETO 0,60 CM',
  'REVEST. TABUA/RIPA 10X80',
  'BORDA DE PISCINA',
  'MEIO FIO DINIT',
  
  // Nervuras e Estruturas
  'NERV 1,20 MT',
  'TAMPAS 24,50 X 24,50 QUAD PUX',
  'VIGOTA 2,30 MT',
  'NERV. 2,00 MT',
  'NERV. 2,50 MT',
  'ESTACAS RETAS 2,50 MT',
  'MOURÕES RETOS 15X15 2,50 MT',
  'NERV 3,50 MT',
  'NERV 3,20 MT',
  'NERV 2,70 MT',
  'NERV 1,70 MT',
  'NERV. 1,70 MT',
  'PERGOLADOS 1,40 MT',
  'PERGOLADOS 1,20 MT',
  'VIGOTAS 1,20 MT',
  'TAMPA RED. 50 CM 05 CM PUX',
  'ESTACAS CURVAS 2,0 MT',
  'TAMPAS RED. 25 CM ELET 5CM',
  'MARCO DE CONCRETO 40 CM',
  'TAMPA 1.00 X 30 X 6 CM',
  'TAMPA 90 X 39,5 X 6 CM',
  'TAMPA 1.15 X 30 X 6 CM',
  'NERV 3,40 MT',
  'NERV 2,60 MT',
  'NERV 4,60 MT',
  'NERV. 6,0 MT',
  'NERV 4,0 MT'
];

// Categorias padrão
const CATEGORIAS_INICIAIS: CategoriaProducao[] = [
  {
    id: 'diaristas',
    nome: 'Diaristas',
    tipo: 'formas',
    descricao: 'Produção dos diaristas (formas)'
  },
  {
    id: 'producao-rodrigo',
    nome: 'Produção Rodrigo',
    tipo: 'tabuas',
    descricao: 'Produção do Rodrigo (tábuas)'
  }
];

// Função para normalizar nomes de produtos (remove espaços extras, padroniza maiúsculas)
const normalizarProduto = (produto: string): string => {
  return produto.trim().toUpperCase().replace(/\s+/g, ' ');
};

export const salvarProducao = (producao: ProducaoDiaria) => {
  const producoes = getProducoes();
  producoes[producao.data] = producao;
  localStorage.setItem(STORAGE_KEYS.PRODUCOES, JSON.stringify(producoes));
};

export const getProducoes = (): Record<string, ProducaoDiaria> => {
  const dados = localStorage.getItem(STORAGE_KEYS.PRODUCOES);
  return dados ? JSON.parse(dados) : {};
};

export const removerProducao = (data: string) => {
  const producoes = getProducoes();
  delete producoes[data];
  localStorage.setItem(STORAGE_KEYS.PRODUCOES, JSON.stringify(producoes));
};

export const salvarConfiguracao = (config: ConfiguracaoProduto) => {
  const configuracoes = getConfiguracoes();
  const produtoNormalizado = normalizarProduto(config.produto);
  
  const index = configuracoes.findIndex(c => 
    normalizarProduto(c.produto) === produtoNormalizado
  );
  
  const novaConfig = {
    produto: produtoNormalizado,
    unidadesPorTabua: config.unidadesPorTabua,
    unidadesPorForma: config.unidadesPorForma
  };
  
  if (index >= 0) {
    configuracoes[index] = novaConfig;
  } else {
    configuracoes.push(novaConfig);
  }
  
  localStorage.setItem(STORAGE_KEYS.CONFIGURACOES, JSON.stringify(configuracoes));
};

export const getConfiguracoes = (): ConfiguracaoProduto[] => {
  const dados = localStorage.getItem(STORAGE_KEYS.CONFIGURACOES);
  return dados ? JSON.parse(dados) : [];
};

export const getUnidadesPorTabua = (produto: string): number | undefined => {
  const configuracoes = getConfiguracoes();
  const produtoNormalizado = normalizarProduto(produto);
  
  const config = configuracoes.find(c => 
    normalizarProduto(c.produto) === produtoNormalizado
  );
  
  return config?.unidadesPorTabua;
};

export const getUnidadesPorForma = (produto: string): number | undefined => {
  const configuracoes = getConfiguracoes();
  const produtoNormalizado = normalizarProduto(produto);
  
  const config = configuracoes.find(c => 
    normalizarProduto(c.produto) === produtoNormalizado
  );
  
  return config?.unidadesPorForma;
};

export const adicionarProduto = (produto: string) => {
  const produtos = getProdutos();
  const produtoNormalizado = normalizarProduto(produto);
  
  // Verifica se o produto já existe (case-insensitive)
  const produtoExiste = produtos.some(p => 
    normalizarProduto(p) === produtoNormalizado
  );
  
  if (!produtoExiste && produtoNormalizado) {
    produtos.push(produtoNormalizado);
    // Ordena alfabeticamente
    produtos.sort();
    localStorage.setItem(STORAGE_KEYS.PRODUTOS, JSON.stringify(produtos));
  }
};

export const removerProduto = (produto: string) => {
  const produtos = getProdutos();
  const produtoNormalizado = normalizarProduto(produto);
  const produtosFiltrados = produtos.filter(p => 
    normalizarProduto(p) !== produtoNormalizado
  );
  localStorage.setItem(STORAGE_KEYS.PRODUTOS, JSON.stringify(produtosFiltrados));
};

export const getProdutos = (): string[] => {
  const dados = localStorage.getItem(STORAGE_KEYS.PRODUTOS);
  let produtos = dados ? JSON.parse(dados) : [];
  
  // Se não há produtos, inicializa com a lista padrão
  if (produtos.length === 0) {
    // Remove duplicatas, normaliza e ordena alfabeticamente
    const produtosUnicos = [...new Set(PRODUTOS_INICIAIS.map(normalizarProduto))].sort();
    localStorage.setItem(STORAGE_KEYS.PRODUTOS, JSON.stringify(produtosUnicos));
    return produtosUnicos;
  }
  
  // Normaliza produtos existentes se necessário
  const produtosNormalizados = produtos.map(normalizarProduto);
  const produtosUnicos = [...new Set(produtosNormalizados)].sort();
  
  // Atualiza o localStorage se houve mudanças
  if (JSON.stringify(produtos) !== JSON.stringify(produtosUnicos)) {
    localStorage.setItem(STORAGE_KEYS.PRODUTOS, JSON.stringify(produtosUnicos));
  }
  
  return produtosUnicos;
};

export const getCategorias = (): CategoriaProducao[] => {
  const dados = localStorage.getItem(STORAGE_KEYS.CATEGORIAS);
  let categorias = dados ? JSON.parse(dados) : [];
  
  // Se não há categorias, inicializa com as padrão
  if (categorias.length === 0) {
    localStorage.setItem(STORAGE_KEYS.CATEGORIAS, JSON.stringify(CATEGORIAS_INICIAIS));
    return CATEGORIAS_INICIAIS;
  }
  
  return categorias;
};

export const salvarCategoria = (categoria: CategoriaProducao) => {
  const categorias = getCategorias();
  const index = categorias.findIndex(c => c.id === categoria.id);
  
  if (index >= 0) {
    categorias[index] = categoria;
  } else {
    categorias.push(categoria);
  }
  
  localStorage.setItem(STORAGE_KEYS.CATEGORIAS, JSON.stringify(categorias));
};

export const removerCategoria = (id: string) => {
  const categorias = getCategorias();
  const categoriasFiltradas = categorias.filter(c => c.id !== id);
  localStorage.setItem(STORAGE_KEYS.CATEGORIAS, JSON.stringify(categoriasFiltradas));
};

export const formatarData = (data: Date): string => {
  return data.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
};

export const formatarDataChave = (data: Date): string => {
  return data.toISOString().split('T')[0];
};

// Função para buscar produtos com correspondência parcial
export const buscarProdutos = (termo: string): string[] => {
  const produtos = getProdutos();
  const termoNormalizado = normalizarProduto(termo);
  
  if (!termoNormalizado) return [];
  
  return produtos.filter(produto => 
    normalizarProduto(produto).includes(termoNormalizado)
  ).slice(0, 10); // Limita a 10 resultados
};

// Função para verificar se um produto existe exatamente
export const produtoExiste = (produto: string): boolean => {
  const produtos = getProdutos();
  const produtoNormalizado = normalizarProduto(produto);
  return produtos.some(p => normalizarProduto(p) === produtoNormalizado);
};

// Função para verificar se um produto tem configuração de tábuas
export const temConfiguracaoTabua = (produto: string): boolean => {
  const unidades = getUnidadesPorTabua(produto);
  return unidades !== undefined && unidades > 0;
};

// Função para verificar se um produto tem configuração de formas
export const temConfiguracaoForma = (produto: string): boolean => {
  const unidades = getUnidadesPorForma(produto);
  return unidades !== undefined && unidades > 0;
};

// Função para listar produtos sem configuração
export const getProdutosSemConfiguracao = (): string[] => {
  const produtos = getProdutos();
  return produtos.filter(produto => !temConfiguracaoTabua(produto) && !temConfiguracaoForma(produto));
};

export const calcularUnidadesTotal = (produto: string, quantidade: number, categoria: CategoriaProducao): number | undefined => {
  if (categoria.tipo === 'tabuas') {
    const unidadesPorTabua = getUnidadesPorTabua(produto);
    return unidadesPorTabua ? quantidade * unidadesPorTabua : undefined;
  } else if (categoria.tipo === 'formas') {
    const unidadesPorForma = getUnidadesPorForma(produto);
    return unidadesPorForma ? quantidade * unidadesPorForma : undefined;
  }
  return quantidade;
};