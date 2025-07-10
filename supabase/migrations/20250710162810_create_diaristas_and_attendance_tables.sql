-- migrations/20250710133000_create_diaristas_and_attendance_tables.sql

-- UP: Cria o enum e as tabelas para diaristas e controle de presença

-- INÍCIO DA ALTERAÇÃO: Bloco para criar ENUM de forma idempotente
DO $$ BEGIN
  CREATE TYPE diarista_status AS ENUM ('presente', 'falta', 'meia_diaria');
EXCEPTION
  WHEN duplicate_object THEN NULL; -- Ignora se o tipo já existe
END $$;
-- FIM DA ALTERAÇÃO: Bloco para criar ENUM de forma idempotente

CREATE TABLE public.diaristas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE public.controle_diaristas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  diarista_id uuid REFERENCES public.diaristas(id) ON DELETE CASCADE,
  data date NOT NULL,
  status diarista_status NOT NULL DEFAULT 'falta', -- Esta linha usa o tipo
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(diarista_id, data) -- Garante que um diarista só tem um registro por dia
);

-- Habilitar RLS para as novas tabelas
ALTER TABLE public.diaristas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.controle_diaristas ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para diaristas
CREATE POLICY "Diaristas são visíveis para todos os usuários autenticados"
  ON public.diaristas
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuários autenticados podem inserir diaristas"
  ON public.diaristas
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem atualizar diaristas"
  ON public.diaristas
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Usuários autenticados podem deletar diaristas"
  ON public.diaristas
  FOR DELETE
  TO authenticated
  USING (true);

-- Políticas RLS para controle_diaristas
CREATE POLICY "Controle de diaristas é visível para todos os usuários autenticados"
  ON public.controle_diaristas
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuários autenticados podem inserir registros de controle de diaristas"
  ON public.controle_diaristas
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem atualizar registros de controle de diaristas"
  ON public.controle_diaristas
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Usuários autenticados podem deletar registros de controle de diaristas"
  ON public.controle_diaristas
  FOR DELETE
  TO authenticated
  USING (true);

-- Triggers para atualizar updated_at automaticamente
CREATE TRIGGER update_diaristas_updated_at
  BEFORE UPDATE ON public.diaristas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_controle_diaristas_updated_at
  BEFORE UPDATE ON public.controle_diaristas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- DOWN: Reverte a criação do enum e das tabelas
DROP TRIGGER IF EXISTS update_controle_diaristas_updated_at ON public.controle_diaristas;
DROP TRIGGER IF EXISTS update_diaristas_updated_at ON public.diaristas;

DROP TABLE IF EXISTS public.controle_diaristas;
DROP TABLE IF EXISTS public.diaristas;
DROP TYPE IF EXISTS diarista_status;