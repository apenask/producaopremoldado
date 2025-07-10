# Configuração do Supabase

## Passos para configurar o Supabase

### 1. Criar conta no Supabase
1. Acesse [supabase.com](https://supabase.com)
2. Clique em "Start your project"
3. Faça login com GitHub, Google ou email

### 2. Criar novo projeto
1. Clique em "New Project"
2. Escolha sua organização
3. Defina um nome para o projeto (ex: "producao-premoldados")
4. Defina uma senha forte para o banco de dados
5. Escolha a região mais próxima (ex: South America - São Paulo)
6. Clique em "Create new project"

### 3. Obter credenciais
1. Após criar o projeto, vá para "Settings" > "API"
2. Copie a "Project URL"
3. Copie a "anon public" key
4. Cole essas informações no arquivo `.env`

### 4. Configurar variáveis de ambiente
1. Renomeie o arquivo `.env.example` para `.env`
2. Substitua os valores pelas suas credenciais:
   ```
   VITE_SUPABASE_URL=https://seu-projeto.supabase.co
   VITE_SUPABASE_ANON_KEY=sua_chave_anon_aqui
   ```

### 5. Executar migrações
As migrações já estão configuradas no projeto e serão executadas automaticamente quando você conectar ao Supabase.

### 6. Verificar configuração
1. Execute `npm run dev`
2. Tente fazer login no sistema
3. Se conseguir criar uma conta e fazer login, a configuração está correta

## Estrutura do Banco de Dados

O sistema já possui as seguintes tabelas configuradas:

- **produtos**: Catálogo de produtos da fábrica
- **configuracoes_produtos**: Configurações de unidades por tábua/forma
- **categorias_producao**: Categorias como "Diaristas" e "Produção Rodrigo"
- **producoes_diarias**: Registros de produção por data
- **itens_producao**: Itens individuais de cada produção

## Funcionalidades

- ✅ Autenticação de usuários
- ✅ Cadastro e gerenciamento de produtos
- ✅ Configuração de unidades por tábua/forma
- ✅ Categorias de produção personalizáveis
- ✅ Registro de produção diária
- ✅ Histórico de produções
- ✅ Geração automática de texto para WhatsApp
- ✅ Interface responsiva

## Suporte

Se tiver problemas na configuração:
1. Verifique se as credenciais estão corretas
2. Confirme que o projeto Supabase está ativo
3. Verifique se as migrações foram executadas
4. Consulte os logs do navegador para erros específicos