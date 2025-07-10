/*
  # Inserir dados iniciais

  1. Categorias padrão
    - Diaristas (formas, protegida)
    - Produção Rodrigo (tábuas, protegida)

  2. Produtos iniciais da fábrica
    - Lista completa de produtos de pré-moldados
*/

-- Inserir categorias padrão
INSERT INTO categorias_producao (nome, tipo, descricao, is_protected) VALUES
  ('Diaristas', 'formas', 'Produção dos diaristas (formas)', true),
  ('Produção Rodrigo', 'tabuas', 'Produção do Rodrigo (tábuas)', true)
ON CONFLICT (nome) DO NOTHING;

-- Inserir produtos iniciais
INSERT INTO produtos (nome) VALUES
  -- Blocos
  ('BLOCO 09X19X39 02 FUROS VEDA'),
  ('CANALETA 09'),
  ('BLOCO 09 02 FUROS'),
  ('CANALETAS 14'),
  ('CANALETA 14'),
  ('MEIO BLOCO 19X19X19'),
  ('BLOCOS 09 03 FUROS COM FUNDO'),
  ('BLOCO 14X19X39 02 TIPA A – VEDA'),
  ('CANALETAS 09'),
  ('MEIO BLOCO 14X19X19'),
  ('CANALETA 19'),
  ('CANALETAS 19'),
  ('BLOCO 14 02 FUROS'),
  
  -- Pisos e Revestimentos
  ('PISO 35X70X5 CM C/ MALHA'),
  ('PISO PAIVER 04 CM VERMELHO'),
  ('PISO 20X20 SEXTAVADO 02 CM'),
  ('CAPAS DE MURO 17X80'),
  ('PISO OSSINHO 03 CM'),
  ('PISO SEXTAVADO 25X25 04 CM'),
  ('PISO 03 PONTAS 03 CM'),
  ('GUIA DE MEIO FIO'),
  ('REVESTIMENTO TIJOLINHO'),
  ('CAPAS DE MURO 30X90'),
  ('PISO CAQUINHO 20X20'),
  ('KITS DE REVEST. MOSAICO + 12 PÇ'),
  ('PISO PAIVER 06 CM'),
  ('PISO 33X33 COPACABANA'),
  ('COBOGO 30X30 TRIANGULO'),
  ('BLOQUETE 25X25X7 C/BUCHA "8"'),
  ('PISO TÁTIL 25X25 ALERTA'),
  ('MARCO DE CONCRETO 0,60 CM'),
  ('REVEST. TABUA/RIPA 10X80'),
  ('BORDA DE PISCINA'),
  ('MEIO FIO DINIT'),
  
  -- Nervuras e Estruturas
  ('NERV 1,20 MT'),
  ('TAMPAS 24,50 X 24,50 QUAD PUX'),
  ('VIGOTA 2,30 MT'),
  ('NERV. 2,00 MT'),
  ('NERV. 2,50 MT'),
  ('ESTACAS RETAS 2,50 MT'),
  ('MOURÕES RETOS 15X15 2,50 MT'),
  ('NERV 3,50 MT'),
  ('NERV 3,20 MT'),
  ('NERV 2,70 MT'),
  ('NERV 1,70 MT'),
  ('NERV. 1,70 MT'),
  ('PERGOLADOS 1,40 MT'),
  ('PERGOLADOS 1,20 MT'),
  ('VIGOTAS 1,20 MT'),
  ('TAMPA RED. 50 CM 05 CM PUX'),
  ('ESTACAS CURVAS 2,0 MT'),
  ('TAMPAS RED. 25 CM ELET 5CM'),
  ('MARCO DE CONCRETO 40 CM'),
  ('TAMPA 1.00 X 30 X 6 CM'),
  ('TAMPA 90 X 39,5 X 6 CM'),
  ('TAMPA 1.15 X 30 X 6 CM'),
  ('NERV 3,40 MT'),
  ('NERV 2,60 MT'),
  ('NERV 4,60 MT'),
  ('NERV. 6,0 MT'),
  ('NERV 4,0 MT')
ON CONFLICT (nome) DO NOTHING;