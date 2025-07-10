import { supabase } from '../lib/supabase';
import { Database } from '../lib/database.types';
import { ProducaoDiaria, ItemProducao, ConfiguracaoProduto, CategoriaProducao } from '../types';

type Tables = Database['public']['Tables'];
type ProdutoRow = Tables['produtos']['Row'];
type ConfiguracaoRow = Tables['configuracoes_produtos']['Row'];
type CategoriaRow = Tables['categorias_producao']['Row'];
type ProducaoRow = Tables['producoes_diarias']['Row'];
type ItemRow = Tables['itens_producao']['Row'];

// Produtos
export const getProdutos = async (): Promise<string[]> => {
  const { data, error } = await supabase
    .from('produtos')
    .select('nome')
    .order('nome');
  
  if (error) throw error;
  return data.map(p => p.nome);
};

export const adicionarProduto = async (nome: string): Promise<void> => {
  const { error } = await supabase
    .from('produtos')
    .insert({ nome: nome.trim().toUpperCase().replace(/\s+/g, ' ') });
  
  if (error) throw error;
};

export const removerProduto = async (nome: string): Promise<void> => {
  const { error } = await supabase
    .from('produtos')
    .delete()
    .eq('nome', nome);
  
  if (error) throw error;
};

export const buscarProdutos = async (termo: string): Promise<string[]> => {
  const { data, error } = await supabase
    .from('produtos')
    .select('nome')
    .ilike('nome', `%${termo.trim().toUpperCase()}%`)
    .order('nome')
    .limit(10);
  
  if (error) throw error;
  return data.map(p => p.nome);
};

export const produtoExiste = async (nome: string): Promise<boolean> => {
  const { data, error } = await supabase
    .from('produtos')
    .select('id')
    .eq('nome', nome.trim().toUpperCase().replace(/\s+/g, ' '))
    .limit(1);
  
  if (error) throw error;
  return data && data.length > 0;
};

// Configurações
export const getConfiguracoes = async (): Promise<ConfiguracaoProduto[]> => {
  const { data, error } = await supabase
    .from('configuracoes_produtos')
    .select(`
      *,
      produtos!inner(nome)
    `);
  
  if (error) throw error;
  
  return data.map(config => ({
    produto: config.produtos.nome,
    unidadesPorTabua: config.unidades_por_tabua || undefined,
    unidadesPorForma: config.unidades_por_forma || undefined
  }));
};

export const salvarConfiguracao = async (config: ConfiguracaoProduto): Promise<void> => {
  const produtoNome = config.produto.trim().toUpperCase().replace(/\s+/g, ' ');
  
  // Buscar o produto
  const { data: produto, error: produtoError } = await supabase
    .from('produtos')
    .select('id')
    .eq('nome', produtoNome)
    .single();
  
  if (produtoError) throw produtoError;
  
  // Upsert configuração
  const { error } = await supabase
    .from('configuracoes_produtos')
    .upsert({
      produto_id: produto.id,
      unidades_por_tabua: config.unidadesPorTabua || null,
      unidades_por_forma: config.unidadesPorForma || null
    }, {
      onConflict: 'produto_id'
    });
  
  if (error) throw error;
};

export const getUnidadesPorTabua = async (produtoNome: string): Promise<number | undefined> => {
  const { data, error } = await supabase
    .from('configuracoes_produtos')
    .select('unidades_por_tabua, produtos!inner(nome)')
    .eq('produtos.nome', produtoNome)
    .maybeSingle();
  
  if (error) throw error;
  return data?.unidades_por_tabua || undefined;
};

export const getUnidadesPorForma = async (produtoNome: string): Promise<number | undefined> => {
  const { data, error } = await supabase
    .from('configuracoes_produtos')
    .select('unidades_por_forma, produtos!inner(nome)')
    .eq('produtos.nome', produtoNome)
    .maybeSingle();
  
  if (error) throw error;
  return data?.unidades_por_forma || undefined;
};

// Nova função para buscar configuração completa de um produto
export const getConfiguracaoProduto = async (produtoNome: string): Promise<ConfiguracaoProduto | null> => {
  const { data, error } = await supabase
    .from('configuracoes_produtos')
    .select(`
      *,
      produtos!inner(nome)
    `)
    .eq('produtos.nome', produtoNome)
    .maybeSingle();
  
  if (error) throw error;
  if (!data) return null;
  
  return {
    produto: data.produtos.nome,
    unidadesPorTabua: data.unidades_por_tabua || undefined,
    unidadesPorForma: data.unidades_por_forma || undefined
  };
};

// Categorias
export const getCategorias = async (): Promise<CategoriaProducao[]> => {
  const { data, error } = await supabase
    .from('categorias_producao')
    .select('*')
    .order('nome');
  
  if (error) throw error;
  
  return data.map(cat => ({
    id: cat.id,
    nome: cat.nome,
    tipo: cat.tipo,
    descricao: cat.descricao
  }));
};

export const salvarCategoria = async (categoria: CategoriaProducao): Promise<void> => {
  const { error } = await supabase
    .from('categorias_producao')
    .upsert({
      id: categoria.id,
      nome: categoria.nome,
      tipo: categoria.tipo,
      descricao: categoria.descricao
    });
  
  if (error) throw error;
};

export const removerCategoria = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('categorias_producao')
    .delete()
    .eq('id', id)
    .eq('is_protected', false);
  
  if (error) throw error;
};

// Produções
export const getProducoes = async (): Promise<Record<string, ProducaoDiaria>> => {
  const { data: producoes, error: producoesError } = await supabase
    .from('producoes_diarias')
    .select('*')
    .order('data', { ascending: false });
  
  if (producoesError) throw producoesError;
  
  const result: Record<string, ProducaoDiaria> = {};
  
  for (const producao of producoes) {
    const { data: itens, error: itensError } = await supabase
      .from('itens_producao')
      .select(`
        *,
        produtos!inner(nome),
        categorias_producao!inner(nome)
      `)
      .eq('producao_id', producao.id);
    
    if (itensError) throw itensError;
    
    result[producao.data] = {
      data: producao.data,
      textoGerado: producao.texto_gerado,
      itens: itens.map(item => ({
        id: item.id,
        produto: item.produtos.nome,
        quantidade: item.quantidade,
        categoria: item.categorias_producao.nome,
        unidadesTotal: item.unidades_total || undefined,
        tipoMedida: item.tipo_medida as 'tabuas' | 'formas' | 'unidades' // LINHA ALTERADA: Mapear tipo_medida do banco
      }))
    };
  }
  
  return result;
};

export const salvarProducao = async (producao: ProducaoDiaria): Promise<void> => {
  // Upsert produção
  const { data: producaoData, error: producaoError } = await supabase
    .from('producoes_diarias')
    .upsert({
      data: producao.data,
      texto_gerado: producao.textoGerado
    }, {
      onConflict: 'data'
    })
    .select('id')
    .single();
  
  if (producaoError) throw producaoError;
  
  // Remover itens existentes
  await supabase
    .from('itens_producao')
    .delete()
    .eq('producao_id', producaoData.id);
  
  // Inserir novos itens
  for (const item of producao.itens) {
    // Buscar IDs
    const { data: produto } = await supabase
      .from('produtos')
      .select('id')
      .eq('nome', item.produto)
      .single();
    
    const { data: categoria } = await supabase
      .from('categorias_producao')
      .select('id')
      .eq('nome', item.categoria)
      .single();
    
    if (produto && categoria) {
      await supabase
        .from('itens_producao')
        .insert({
          producao_id: producaoData.id,
          produto_id: produto.id,
          categoria_id: categoria.id,
          quantidade: item.quantidade,
          unidades_total: item.unidadesTotal || null,
          tipo_medida: item.tipoMedida || 'unidades' // LINHA ALTERADA: Salvar o tipo de medida do item
        });
    }
  }
};

export const removerProducao = async (data: string): Promise<void> => {
  const { error } = await supabase
    .from('producoes_diarias')
    .delete()
    .eq('data', data);
  
  if (error) throw error;
};

// Funções auxiliares
export const calcularUnidadesTotal = async (
  produto: string, 
  quantidade: number, 
  categoria: CategoriaProducao, // LINHA ALTERADA: Categoria ainda é usada, mas o tipo de medida vem do parâmetro
  tipoMedida: 'tabuas' | 'formas' | 'unidades' = 'unidades' // LINHA ALTERADA: Adicionado tipoMedida como parâmetro
): Promise<number | undefined> => {
  if (tipoMedida === 'tabuas') {
    const unidadesPorTabua = await getUnidadesPorTabua(produto);
    return unidadesPorTabua ? quantidade * unidadesPorTabua : undefined;
  } else if (tipoMedida === 'formas') {
    const unidadesPorForma = await getUnidadesPorForma(produto);
    return unidadesPorForma ? quantidade * unidadesPorForma : undefined;
  }
  return quantidade;
};

export const temConfiguracaoTabua = async (produto: string): Promise<boolean> => {
  const unidades = await getUnidadesPorTabua(produto);
  return unidades !== undefined && unidades > 0;
};

export const temConfiguracaoForma = async (produto: string): Promise<boolean> => {
  const unidades = await getUnidadesPorForma(produto);
  return unidades !== undefined && unidades > 0;
};

// INÍCIO DA ALTERAÇÃO: Função para verificar configuração com base no tipo de medida direto
export const temConfiguracaoParaCategoria = async (produto: string, tipoMedida: 'tabuas' | 'formas' | 'unidades'): Promise<boolean> => {
  if (tipoMedida === 'tabuas') {
    return await temConfiguracaoTabua(produto);
  } else if (tipoMedida === 'formas') {
    return await temConfiguracaoForma(produto);
  }
  return true; // Para categoria 'unidades' sempre tem configuração
};
// FIM DA ALTERAÇÃO

// Utilitários de data
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