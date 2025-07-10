/*
  # Schema inicial do sistema de controle de produção

  1. Novas Tabelas
    - `produtos`
      - `id` (uuid, primary key)
      - `nome` (text, unique)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `configuracoes_produtos`
      - `id` (uuid, primary key)
      - `produto_id` (uuid, foreign key)
      - `unidades_por_tabua` (integer, nullable)
      - `unidades_por_forma` (integer, nullable)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `categorias_producao`
      - `id` (uuid, primary key)
      - `nome` (text, unique)
      - `tipo` (enum: tabuas, formas, unidades)
      - `descricao` (text)
      - `is_protected` (boolean, default false)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `producoes_diarias`
      - `id` (uuid, primary key)
      - `data` (date, unique)
      - `texto_gerado` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `itens_producao`
      - `id` (uuid, primary key)
      - `producao_id` (uuid, foreign key)
      - `produto_id` (uuid, foreign key)
      - `categoria_id` (uuid, foreign key)
      - `quantidade` (integer)
      - `unidades_total` (integer, nullable)
      - `created_at` (timestamp)

  2. Segurança
    - Habilitar RLS em todas as tabelas
    - Políticas para usuários autenticados
    - Índices para performance

  3. Dados Iniciais
    - Produtos padrão da fábrica
    - Categorias padrão (Diaristas, Produção Rodrigo)
*/

-- Criar enum para tipos de categoria
CREATE TYPE categoria_tipo AS ENUM ('tabuas', 'formas', 'unidades');

-- Tabela de produtos
CREATE TABLE IF NOT EXISTS produtos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela de configurações de produtos
CREATE TABLE IF NOT EXISTS configuracoes_produtos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  produto_id uuid REFERENCES produtos(id) ON DELETE CASCADE,
  unidades_por_tabua integer CHECK (unidades_por_tabua > 0),
  unidades_por_forma integer CHECK (unidades_por_forma > 0),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(produto_id)
);

-- Tabela de categorias de produção
CREATE TABLE IF NOT EXISTS categorias_producao (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text UNIQUE NOT NULL,
  tipo categoria_tipo NOT NULL DEFAULT 'unidades',
  descricao text DEFAULT '',
  is_protected boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela de produções diárias
CREATE TABLE IF NOT EXISTS producoes_diarias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  data date UNIQUE NOT NULL,
  texto_gerado text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela de itens de produção
CREATE TABLE IF NOT EXISTS itens_producao (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  producao_id uuid REFERENCES producoes_diarias(id) ON DELETE CASCADE,
  produto_id uuid REFERENCES produtos(id) ON DELETE CASCADE,
  categoria_id uuid REFERENCES categorias_producao(id) ON DELETE CASCADE,
  quantidade integer NOT NULL CHECK (quantidade > 0),
  unidades_total integer CHECK (unidades_total > 0),
  created_at timestamptz DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracoes_produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE categorias_producao ENABLE ROW LEVEL SECURITY;
ALTER TABLE producoes_diarias ENABLE ROW LEVEL SECURITY;
ALTER TABLE itens_producao ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para produtos
CREATE POLICY "Produtos são visíveis para todos os usuários autenticados"
  ON produtos
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuários autenticados podem inserir produtos"
  ON produtos
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem atualizar produtos"
  ON produtos
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Usuários autenticados podem deletar produtos"
  ON produtos
  FOR DELETE
  TO authenticated
  USING (true);

-- Políticas RLS para configurações de produtos
CREATE POLICY "Configurações são visíveis para todos os usuários autenticados"
  ON configuracoes_produtos
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuários autenticados podem inserir configurações"
  ON configuracoes_produtos
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem atualizar configurações"
  ON configuracoes_produtos
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Usuários autenticados podem deletar configurações"
  ON configuracoes_produtos
  FOR DELETE
  TO authenticated
  USING (true);

-- Políticas RLS para categorias de produção
CREATE POLICY "Categorias são visíveis para todos os usuários autenticados"
  ON categorias_producao
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuários autenticados podem inserir categorias"
  ON categorias_producao
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem atualizar categorias"
  ON categorias_producao
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Usuários autenticados podem deletar categorias não protegidas"
  ON categorias_producao
  FOR DELETE
  TO authenticated
  USING (NOT is_protected);

-- Políticas RLS para produções diárias
CREATE POLICY "Produções são visíveis para todos os usuários autenticados"
  ON producoes_diarias
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuários autenticados podem inserir produções"
  ON producoes_diarias
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem atualizar produções"
  ON producoes_diarias
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Usuários autenticados podem deletar produções"
  ON producoes_diarias
  FOR DELETE
  TO authenticated
  USING (true);

-- Políticas RLS para itens de produção
CREATE POLICY "Itens são visíveis para todos os usuários autenticados"
  ON itens_producao
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuários autenticados podem inserir itens"
  ON itens_producao
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem atualizar itens"
  ON itens_producao
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Usuários autenticados podem deletar itens"
  ON itens_producao
  FOR DELETE
  TO authenticated
  USING (true);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_produtos_nome ON produtos(nome);
CREATE INDEX IF NOT EXISTS idx_configuracoes_produto_id ON configuracoes_produtos(produto_id);
CREATE INDEX IF NOT EXISTS idx_categorias_nome ON categorias_producao(nome);
CREATE INDEX IF NOT EXISTS idx_producoes_data ON producoes_diarias(data);
CREATE INDEX IF NOT EXISTS idx_itens_producao_id ON itens_producao(producao_id);
CREATE INDEX IF NOT EXISTS idx_itens_produto_id ON itens_producao(produto_id);
CREATE INDEX IF NOT EXISTS idx_itens_categoria_id ON itens_producao(categoria_id);

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
CREATE TRIGGER update_produtos_updated_at
  BEFORE UPDATE ON produtos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_configuracoes_produtos_updated_at
  BEFORE UPDATE ON configuracoes_produtos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categorias_producao_updated_at
  BEFORE UPDATE ON categorias_producao
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_producoes_diarias_updated_at
  BEFORE UPDATE ON producoes_diarias
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();