# Controle de feedbacks

Site pessoal para registrar feedbacks, notas e dados operacionais de delivery
por loja, com relatórios automáticos (semanal, mensal, notas totais por
região) e geração de PowerPoint com o comparativo mensal completo.

## 1. Configurar o Supabase

1. Acesse seu projeto em https://supabase.com.
2. Vá em **SQL Editor** e rode o conteúdo do arquivo `supabase-schema.sql`
   (cria/atualiza todas as tabelas: lojas, feedbacks, notas_secas,
   vendas_diarias, operacao_mensal). Pode rodar esse script mais de uma vez
   sem medo — ele não duplica nada.
3. Vá em **Authentication → Users** e clique em **Add user** para criar o seu
   login (e-mail e senha), caso ainda não tenha.
4. Vá em **Project Settings → API** e copie:
   - **Project URL**
   - **anon / publishable key**

## 2. Configurar o projeto localmente

1. Instale as dependências:
   ```
   npm install
   ```
2. Copie `.env.example` para `.env` e preencha com os dados do passo anterior:
   ```
   VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
   VITE_SUPABASE_ANON_KEY=SUA-CHAVE-AQUI
   ```
3. Rode localmente para testar:
   ```
   npm run dev
   ```

## 3. Publicar o site (Vercel)

1. Suba este projeto para um repositório no GitHub.
2. Acesse https://vercel.com e importe o repositório.
3. Em **Environment Variables**, adicione `VITE_SUPABASE_URL` e
   `VITE_SUPABASE_ANON_KEY` com os mesmos valores do seu `.env`.
4. Clique em **Deploy**.

## O que tem em cada aba

- **Novo feedback**: cole o texto copiado do iFood/99Food e clique em
  "Preencher automaticamente" para já extrair pedido, data, nota, cliente e
  comentário. Também dá pra preencher manualmente.
- **Notas secas**: lançamento em massa de notas sem comentário (loja, mês,
  nota, quantidade) — não conta como feedback normal, só entra nos relatórios
  "Notas totais" e no relatório mensal da própria aba.
- **Lojas**: cadastro de lojas, com campo de região (usado no relatório por
  região e no PowerPoint).
- **Relatório semanal**: texto pronto pro WhatsApp com os feedbacks da semana
  e a média.
- **Panorama mensal**: resumo mensal de uma loja.
- **Notas totais**: agrupa por região a contagem de notas 5 a 1 de todas as
  lojas num período, com médias ponderadas.
- **Vendas diárias**: lançamento diário de pedidos/vendas/investimento por
  loja e canal (iFood/99Food), com importação direto da planilha do Google
  Sheets (colar as células copiadas).
- **Operação mensal**: lançamento mensal de cancelamentos, tempo de
  funcionamento e logística, também com importação da planilha.
- **Relatório PPTX**: gera um arquivo PowerPoint com o comparativo mensal
  completo (vendas iFood, vendas 99Food, investimento, cancelamentos, motivos,
  tempo de funcionamento, logística) por região, comparando o mês atual com o
  anterior e com o mesmo mês do ano passado.

Os dados ficam salvos no seu banco Supabase — acessíveis de qualquer
computador ou celular, sempre que você entrar com seu login.
