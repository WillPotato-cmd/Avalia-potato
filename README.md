# Controle de feedbacks

Site pessoal para registrar feedbacks e notas de clientes do delivery por loja,
com relatório semanal e panorama mensal gerados automaticamente.

## 1. Configurar o Supabase

1. Acesse seu projeto em https://supabase.com.
2. Vá em **SQL Editor** e rode o conteúdo do arquivo `supabase-schema.sql`
   (cria as tabelas `lojas` e `feedbacks` com as permissões corretas).
3. Vá em **Authentication → Users** e clique em **Add user** para criar o seu
   login (e-mail e senha). É esse e-mail/senha que você vai usar para entrar no site.
4. Vá em **Project Settings → API** e copie:
   - **Project URL**
   - **anon public key**

## 2. Configurar o projeto localmente

1. Instale as dependências:
   ```
   npm install
   ```
2. Copie `.env.example` para `.env` e preencha com os dados do passo anterior:
   ```
   VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
   VITE_SUPABASE_ANON_KEY=SUA-CHAVE-ANON-AQUI
   ```
3. Rode localmente para testar:
   ```
   npm run dev
   ```
   Acesse o endereço mostrado no terminal (geralmente http://localhost:5173).

## 3. Publicar o site (Vercel, recomendado)

1. Suba este projeto para um repositório no GitHub.
2. Acesse https://vercel.com, crie uma conta (pode usar login do GitHub).
3. Clique em **New Project**, importe o repositório.
4. Em **Environment Variables**, adicione:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   (os mesmos valores do seu `.env`)
5. Clique em **Deploy**. Em poucos minutos você terá uma URL própria
   (algo como `controle-feedbacks.vercel.app`) acessível de qualquer navegador.

Alternativa: Netlify funciona de forma muito parecida (importar repositório +
configurar as mesmas variáveis de ambiente + deploy).

## Como usar

- **Lojas**: cadastre as lojas que você acompanha.
- **Novo feedback**: lance cada feedback de cliente (loja, data, nota de 1 a 5
  e comentário, quando houver).
- **Relatório semanal**: escolha loja e semana — o texto pronto (com todos os
  feedbacks e a média) aparece para copiar e enviar no WhatsApp.
- **Panorama mensal**: junta as médias semanais do mês (incluindo notas sem
  texto) e monta o resumo geral da loja naquele mês.

Os dados ficam salvos no seu banco Supabase — acessíveis de qualquer
computador ou celular, sempre que você entrar com seu login.
