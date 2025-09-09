# GEMINI.md - Configuração para o Projeto Sistema de Beleza

## Persona

Você é Gemini, um assistente de programação especialista em full-stack com TypeScript. Seu foco é em NestJS para o backend e Next.js com Tailwind CSS e shadcn/ui para o frontend. Forneça respostas claras, didáticas e em Português do Brasil, sempre priorizando as melhores práticas.

## Contexto do Projeto

Este é um monorepo gerenciado com `pnpm` contendo um sistema de gestão para salões de beleza.

- **Backend:** `apps/backend` (NestJS, Prisma, PostgreSQL)
- **Frontend:** `apps/frontend` (Next.js App Router, shadcn/ui, Tailwind CSS)
- **Core/Domain:** `packages/core` (Contém entidades de domínio puras)

## Padrões e Arquitetura

### Backend (NestJS)

- **Multi-Tenancy:** A arquitetura foi refatorada para ser multi-organização. Quase todas as entidades de negócio (Clients, Products, Sales, etc.) são vinculadas a uma `Organization` através de um campo `organizationId`. Todas as consultas e criações nos `Services` são filtradas por este ID.
- **Autenticação:** Usa Passport.js.
  - `LocalStrategy`: Valida email e senha. A busca por email é case-insensitive (`.toLowerCase()`) e remove espaços (`.trim()`).
  - `JwtStrategy`: Valida o token JWT em cada requisição.
  - O payload do JWT contém `sub` (userId) e `orgId` (organizationId).
  - Um `JwtAuthGuard` global protege todas as rotas. Rotas públicas (login/register) são liberadas com um decorator `@Public`.
  - Um decorator `@CurrentUser` é usado para extrair dados do usuário/organização do token nos controllers.
- **Banco de Dados:**
  - Gerenciado pelo Prisma ORM. O modelo `Media` inclui campos `width` e `height` para dimensões de imagens.
  - O script `prisma/seed.ts` é projetado para limpar o banco de dados completamente e depois popular com uma Organização, um Usuário e um Plano de Contas padrão.
  - A estratégia de backup/restore recomendada é com as ferramentas nativas do PostgreSQL (`pg_dump` e `pg_restore`).
- **Upload e Mídia:** O `media.service.ts` usa a biblioteca `sharp` para extrair e salvar as dimensões da imagem no momento do upload.
- **Servir Arquivos Estáticos:** O `app.module.ts` está configurado com `@nestjs/serve-static` para servir a pasta `uploads` publicamente na rota `/uploads`, permitindo o acesso direto às imagens salvas.
- **CORS:** A configuração em `main.ts` é dinâmica para aceitar `localhost` e qualquer IP da rede local (`192.168.x.x`), facilitando o desenvolvimento mobile.
- **Configurações da Organização:** O campo `creditCardReceiveDays` (dias para recebimento de cartão de crédito) foi movido para o modelo `Organization`, refletindo que é uma configuração global da empresa.

### Frontend (Next.js)

- **Arquitetura de Componentes:** Usamos uma mistura de Server Components e Client Components do Next.js App Router.
  - **Server Components (async):** Usados para páginas e componentes de layout que precisam buscar dados antes da renderização (ex: `PublicNavbar`, `HomePage`).
  - **Client Components (`"use client";`):** Usados para componentes que precisam de interatividade e hooks (ex: formulários, modais, `NavbarActions`).
- **Estilo e Tema:**
  - `Tailwind CSS` com componentes `shadcn/ui`.
  - O sistema de temas foi unificado no arquivo `apps/frontend/src/config/themes.ts`, que serve como única fonte para todas as paletas de cores.
  - Um `ThemeContext` global aplica as variáveis de cor do tema diretamente no elemento `<html>`, garantindo que toda a aplicação reaja às mudanças.
  - Existem dois controles de tema: um seletor de paleta principal (no `LandingPageManager`) e um botão de toggle (Sol/Lua) para alternar entre os modos claro/escuro do tema selecionado.
- **Formulários:** Usamos uma mistura de `react-hook-form` com `zod` para formulários complexos e `useState` para os mais simples.
- **Comunicação com API:** Um wrapper do Axios (`lib/api.ts`) é usado para todas as chamadas, com interceptors para adicionar o token JWT e para lidar com a expiração de sessão (erro 401), redirecionando para o login.
- **Responsividade do Menu:**
  - O menu hambúrguer (`MobileMenu`) agora é exibido em tablets (telas `md` e `lg`) e o menu desktop (`MainMenu`) apenas em telas maiores (`xl`).
  - O `MobileMenu` utiliza o componente `Sheet` (abre da lateral) para uma melhor experiência em tablets.
  - Ajustes nas classes de flexbox garantem que o menu hambúrguer fique alinhado à direita em telas menores.

## Funcionalidades Específicas Implementadas

- **Landing Page Dinâmica:**
  - O conteúdo (logo, texto, seções Hero e Features) é gerenciado por um painel (`LandingPageManager`).
  - A `PublicNavbar` e o `Header` do dashboard renderizam o logo e o texto de forma condicional com base na proporção da imagem (quadrada vs. retangular) para otimizar o layout.
- **Importação de Extrato (OFX) e Clientes (CSV):**
  - Fluxos de duas etapas com telas de conciliação.
  - Permitem edição de dados antes da importação final.
  - Prevenção de duplicatas (usando `fitId` para transações e `email` para clientes).
- **Endereço do Cliente:**
  - O endereço é estruturado (CEP, logradouro, etc.) e o formulário busca o endereço automaticamente via `ViaCEP`.
- **Backup via UI:**
  - Existe uma funcionalidade de backup no painel de Configurações.
  - O backend executa o comando `pg_dump` para gerar um backup do banco e salvá-lo em uma pasta no servidor.
- **Gestão de Vendas:**
  - **Vendas a Prazo:** Implementada a gestão de prazos de pagamento personalizados, com aplicação de juros simples e geração de múltiplas contas a receber (uma por parcela).
  - **Vendas com Cartão de Crédito:** Lógica de cálculo de valor final e valor a receber aprimorada, considerando o toggle de absorção de taxa e gerando uma única conta a receber com data de vencimento configurável.
  - **Vendas à Vista:** Restaurada a funcionalidade de geração de conta a receber e movimentação em conta corrente.

- **Rastreamento de Custo e Lote (FIFO):**
  - Implementado um sistema para rastrear o preço de custo dos produtos e gerenciar o estoque por lotes, utilizando o método FIFO (First-In, First-Out).
  - O modelo `Product` agora inclui um campo `costPrice` para registrar o custo de aquisição.
  - Um novo modelo `InventoryLot` foi criado para representar lotes específicos de produtos recebidos (via pedido de compra) ou produzidos (via reação, futura implementação).
  - Cada `InventoryLot` armazena o `costPrice`, `quantity` (quantidade total do lote), `remainingQuantity` (quantidade disponível), `sourceType` (tipo de origem, ex: `PURCHASE_ORDER`), `sourceId` (ID do pedido/reação) e `receivedDate`.
  - Ao receber um pedido de compra, são criados registros `InventoryLot` para cada item, e o `Product.stock` é implicitamente gerenciado pela soma das `remainingQuantity` dos lotes.
  - Na venda, a baixa do estoque é feita dos lotes mais antigos primeiro (FIFO), e o `SaleItem` registra o `inventoryLotId` e o `costPriceAtSale` para rastreamento de custo.

## Arquivos a Ignorar

- `node_modules`
- `.next`
- `dist`
- `coverage`
- `pnpm-lock.yaml`
- `*.log`
- `backup.dump`

---

## Histórico de Alterações (Referência)

<details>
<summary><strong>Ver Histórico de Commits e Migrações</strong></summary>

### Histórico de Commits

- **3b5d67c** - feat: Implementa gestão de vendas (à vista, a prazo, cartão) e melhora responsividade do menu
- **a1b2c3d** - fix: Corrige URLs de imagens que estavam quebradas
- **3268bde** - deposi vai ser multitenet
- **978e8d3** - imports funcioanando sistema funcionando
- **3bf6bcd** - Fix: Atualiza versao dotenv-expand no backend
- **76f221f** - feat: up
- **...** (e outros commits)

### Histórico de Migrações do Banco de Dados

- **20250708195618_init**
- **...** (e outras migrações)
- **20250803123954_add_width_height_to_media**
- **20250806112628_add_payment_terms** (Adição da tabela PaymentTerm)
- **(db push)** - move-cc-days-to-org (Movimentação de creditCardReceiveDays para Organization)

</details>

## Roadmap de Futuras Funcionalidades

- [ ] **Módulo de Agendamento:** Criar a funcionalidade de agendamento de serviços.
- [ ] **Permissões de Usuário (Roles):** Diferenciar o que um `ADMIN` pode fazer versus um `USER`.
- [ ] **Relatórios Avançados:** Criar uma seção de relatórios com gráficos detalhados.
- [ ] **Integração com Google Drive:** Finalizar a funcionalidade de backup para salvar os arquivos na nuvem.
- [ ] **Validação e Máscara de CPF/CNPJ:** Adicionar validação e máscaras de formatação no frontend.



## Desafio integrar 

GEMINI.md - Documentação do Projeto Conta Corrente

Persona
Você é Gemini, um assistente de programação especialista em full-stack com TypeScript. Seu foco é em NestJS para o backend e Next.js com Tailwind CSS e shadcn/ui para o frontend. Forneça respostas claras, didáticas e em Português do Brasil, sempre priorizando as melhores práticas.

Contexto do Projeto
Este é um monorepo gerenciado com pnpm contendo um sistema de gestão. O projeto é o resultado da fusão do sistema-electrosal (uma base de gestão mais completa) com o conta-corrente (que continha funcionalidades específicas de análise química).

Backend: apps/backend (NestJS, Prisma, PostgreSQL)

Frontend: apps/frontend (Next.js App Router, shadcn/ui, Tailwind CSS)

Core/Domain: packages/core (Contém entidades de domínio puras)

Arquitetura e Decisões
Padrão de Domínio (DDD): As entidades de negócio (AnaliseQuimica, OrdemDeRecuperacao, etc.) são modeladas como AggregateRoots, mantendo seu estado no objeto props. Isso garante encapsulamento e consistência.

Fronteiras de Camadas: Foi estabelecida uma regra clara para a comunicação entre as camadas da aplicação:

Entrada para o Domínio: Métodos estáticos (criar, reconstituir) nas entidades são os únicos portões de entrada. Eles recebem dados primitivos (como string para IDs) e os convertem para Value Objects (UniqueEntityID, NumeroAnaliseVO).

Saída do Domínio: Ao passar dados do domínio para a camada de infraestrutura (ex: repositórios Prisma), os Value Objects são convertidos de volta para tipos primitivos (ex: id.toString()).

Mapeamento (Mappers): A conversão entre os modelos do Prisma e as entidades de Domínio é centralizada em classes Mapper dedicadas, que respeitam as fronteiras de camadas. Para interações com o Prisma, os mappers geram objetos com a sintaxe de connect para gerenciar as relações.

Regra de Negócio Central: Para fins de relatório e consolidação, todos os metais (Prata, Ródio, etc.) podem ser convertidos para seu equivalente em Ouro (Au), que serve como a unidade de medida principal do sistema.

Histórico de Alterações Recentes
Resolução de Inconsistências de Tipo e Refatoração de Entidades (Ciclo de Debug Assistido)
Um ciclo intensivo de depuração e refatoração foi realizado para resolver uma cascata de erros de compilação e de execução que surgiram após a integração de funcionalidades e a importação de dados legados. O que começou como um simples erro de 401 Unauthorized ao salvar uma análise evoluiu para uma reestruturação fundamental das entidades de domínio.

Sintoma Inicial: O fluxo de "Lançar Resultado" de uma Análise Química estava falhando. Os erros iniciais eram variados e enganosos:

'error' is of type 'unknown' no controller.

401 Unauthorized no use case, mesmo com o usuário autenticado.

PrismaClientValidationError no repositório.

Investigação e Diagnóstico:

A investigação começou no controller, tratando o erro de tipo unknown.

Ao analisar o erro 401, percebeu-se que a comparação de organizationId estava falhando, não por permissão, mas por uma possível inconsistência de tipo ou formato.

A análise do PrismaClientValidationError foi o ponto chave. O erro Unknown argument 'clienteId'. Did you mean 'cliente'? revelou que o mapper estava enviando um campo clienteId primitivo, enquanto o schema.prisma esperava um objeto de relação (cliente: { connect: { id: '...' } }).

Ao tentar corrigir o mapper, uma avalanche de erros de tipo (Type 'UniqueEntityID' is not assignable to type 'string', Property 'toValue' does not exist on type 'string') expôs a causa raiz: não havia um padrão consistente para lidar com IDs. Partes do código tratavam IDs como string, e outras como o Value Object UniqueEntityID.

Solução Estrutural: A Refatoração das Entidades:

A causa da inconsistência de tipos estava no design das próprias entidades (AnaliseQuimica, OrdemDeRecuperacao). Elas gerenciavam seu estado de forma mista, usando propriedades privadas (_propriedade) e o objeto props herdado do AggregateRoot, com tipos conflitantes entre eles.

Ação Corretiva: As entidades foram completamente refatoradas para usar o objeto this.props como a única fonte da verdade para seu estado. Todas as propriedades privadas foram removidas e os getters/métodos de negócio foram reescritos para ler e modificar this.props.

Definição de Contratos: Métodos estáticos como criar e reconstituir foram padronizados para servirem como "portões" do domínio. criar agora aceita IDs como string e os converte para UniqueEntityID internamente, enquanto reconstituir recebe as props e o id separadamente para recriar a entidade a partir do banco de dados.

Correções em Cascata:

Com as entidades corrigidas, o compilador passou a apontar todos os arquivos do backend que violavam os novos contratos.

Use Cases: Foram ajustados para usar entidade.id.toString() ao chamar repositórios e para fornecer todas as propriedades obrigatórias (como data em MovimentoMetal.criar).

Repositórios e Mappers: Foram corrigidos para usar new UniqueEntityID() ao receber dados do Prisma e para passar o id corretamente para o reconstituir.

DTOs e Enums: Foram alinhados para garantir que os nomes de propriedades e valores de enums (CREDITO_ANALISE, etc.) correspondessem exatamente ao que o domínio esperava.

Resultado: Após a refatoração completa e as correções em cascata, a base de código do domínio (@conta-corrente/core) tornou-se consistente e livre de erros. Todos os erros de compilação no backend foram resolvidos, e o fluxo de salvar a análise química passou a funcionar corretamente.

Correções no Fluxo de Autenticação, Menus e Gestão de Pessoas
(Seções anteriores do histórico foram mantidas aqui)

Implementação do Novo Fluxo de Análise Química
(Seções anteriores do histórico foram mantidas aqui)

Importação de Dados Legados
Para popular o sistema, foram criados scripts de seed no Prisma para importar dados de arquivos JSON exportados do sistema legado.

Pessoas (Empresas/Clientes): (seed-empresas.ts)

Contas Correntes: (seed-contas-correntes.ts)

Movimentos (Transações): (seed-movimentos.ts)

Vendas (Pedidos) e Itens de Venda: (seed-vendas.ts, seed-itens-venda.ts)

Próximos Passos (Novas Funcionalidades)
Com base nas novas discussões, os próximos passos focam em expandir as funcionalidades de Venda, Reação Química e Relatórios.

1. Novo Fluxo de Cotação e Venda de Metais
Tela de Cotação de Venda:

Criar uma interface que permita ao usuário simular o preço de venda de metais.

A cotação do dia deve ser carregada como padrão, mas o valor deve ser editável.

Cálculo de Mão de Obra por Faixa:

Implementar uma regra de negócio para calcular a taxa de serviço (% Mão de Obra) com base na quantidade (em gramas de Au) vendida:

1 a 9g: 20%

10 a 19g: 10%

20g ou mais: 20%

Flexibilidade de Unidade (Au vs. Sal 68%):

No formulário de venda, permitir que o usuário insira a quantidade desejada tanto em gramas de Ouro (Au) quanto em gramas de Sal 68%.

O sistema deve realizar a conversão automaticamente (usando o fator 1,47) para exibir o valor em ambas as unidades e dar baixa no estoque corretamente (que é em Sal).

2. Implementação do Módulo de Reação Química
Objetivo: Controlar o processo de produção de Aurocianeto de Potássio (Sal 68%).

Entradas (Inputs) da Reação:

Metal: Ouro proveniente de múltiplas fontes (saldo de recuperação, pagamento de clientes em metal, compra de fornecedores).

Em vendas o cliente pode pagar em metal, e pode pagar em uma conta minha, ou para o fornecedor de metal ou cheque, em metal vai para uma conta e ai na reação agente seleciona e beleza.

Fornecedor, eu tenho um conta corrente com ele, que confiorme o cliente vai pagaendo eu coloco o valor e a cotação, ai com o fornecedor eu tenho na realidade um controle em metal au , tipo cliente paga R$ 10.000 cotação 586 = 17,065 gr , ai vai somando de tempos em tempo pego uma quantidade com o fornecedor , por exemplo 500 gr, ai fica um saldo e as vezes pega o amis com o fornecedor e fico devendo para ele.

Matéria-Prima: Cianeto de Potássio (KCN), calculado pela fórmula: Qtd KCN = Qtd Au * 0.899.

Processo e Saídas (Outputs):

O processo converte o Ouro em Sal 68% (fator 1g Au = 1,47g Sal).

Gera subprodutos/sobras que são pesados e reutilizados em reações futuras:

Sobra de Cesto

Sobra de Destilado

Fluxo de Status da Reação:

Iniciada -> Processando -> Aguardando Teor -> Finalizada.

Controle de Lote: Para vendas de Sal 68%, adicionar a capacidade de anotar de qual lote de reação o produto foi retirado.

3. Pagamentos e Relatórios
Pagamento de Despesas em Metal: Implementar a funcionalidade de pagar despesas, onde o valor em Reais é convertido para Ouro e debitado de uma conta de metal.

Relatórios Consolidados: Desenvolver uma seção de relatórios que consolide todas as movimentações de metais, convertendo Prata, Ródio, etc., para seu equivalente em Ouro para uma visão unificada.

Deixa eu explicar como quero que as coisas , funcionem, ai voce traduz para entidade e classes, e tudo o resto:

# Resumo do ERP

Cadastro de Clientes, Fornecedores, Funcionarios, transportadora, terceiros

Cadastro de Produtos, o que vai vir de reação e produtos de revenda

vendas, que ao vender da a baixa no estoque se tiver um lote seria melhor, vai gerar um financeiro, em reais e em au (ouro) de acordo com a cotação do dia, recebo em metal, cheque, deposito em conta, pode ser minha ou a do fornecedor.

Cadastro de cotação, que vai ser em au, e pode ser 2 valores cheque e pix, na conversão das vendas pode usar uma media.

Financeiro, vai ter contas bancarias e contas de fornecedor de metal e outras por exemplo, tudo vinculado a um plano de contas. Ao lançar uma despesa ou receita, valor em real e convertido cotação dia e tambem valor em au.

Ai vai ter analises quimicas, que agente ja fez, gera credito cliente, vira recuperação, se sobra vira residuo , o metal puro vira  material para a reação.

Reação tem tambem suas peculiaridades tem sobra em cesto e sobra em destilado, e produto acabado Aurocianeto de potassio 68% para estoque.Podemos considerar valeres em reais e valores em au, para calcular os custos. 

Acho que o coração do ERP seria isso, deve ter outras coisinhas ma o coração é isso.

Ter a opção de ver as contas correntes com as movimentações, isso tambem ja estava pronto no outro sistema.