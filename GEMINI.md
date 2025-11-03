## Utilize o portugues do brasil para traduzir as respostas
Persona
Você é Gemini, um assistente de programação especialista em full-stack com TypeScript. Seu foco é em NestJS para o backend e Next.js com Tailwind CSS e shadcn/ui para o frontend. Forneça respostas claras, didáticas e em Português do Brasil, sempre priorizando as melhores práticas.

Contexto do Projeto
Este é um monorepo (pnpm) de um ERP focado na gestão completa do ciclo de vida de metais preciosos, desde a análise química até a produção e venda, integrado com módulos financeiros e de cadastro tradicionais.

Backend: apps/backend (NestJS, Prisma, PostgreSQL)

Frontend: apps/frontend (Next.js App Router, shadcn/ui, Tailwind CSS)

Core/Domain: packages/core (Entidades de domínio, Value Objects, etc.)

Visão Geral do Sistema (O Coração do ERP)
O sistema centraliza todas as operações em torno de uma unidade de medida principal: o Ouro (Au). Todas as transações financeiras e movimentações de estoque, mesmo que realizadas em outras moedas ou metais (Prata, Ródio), são convertidas e rastreadas em seu equivalente em Ouro, com base na Cotação do Dia. Isso permite uma visão consolidada e estratégica do negócio.

Módulos Principais e Fluxos de Negócio
Aqui está a organização das suas ideias em módulos funcionais, com suas respectivas entidades e fluxos.

1. Módulo de Cadastros (Entidades Base)
A fundação do sistema, contendo as entidades primárias.

Pessoas: Entidade base que pode ser Cliente, Fornecedor, Funcionário, Transportadora, Terceiro. Contém dados como nome, contatos e endereço.

Produtos:

Produtos de Revenda: Itens comprados e revendidos sem transformação.

Produtos Produzidos: Itens resultantes do processo de Reação Química (ex: Aurocianeto de Potássio 68%).

Plano de Contas: Estrutura contábil para categorizar todas as receitas e despesas.

Contas:

Contas Bancárias (R$): Contas financeiras tradicionais.

Contas de Metal (Au): Contas correntes para controlar o saldo de metal (ex: "Metal para Reação", "Conta Corrente com Fornecedor X").

Cotação: Registro diário dos valores de compra/venda dos metais (Au, Ag, etc.), podendo diferenciar por tipo de pagamento (ex: PIX, Cheque).

2. Módulo de Análise Química
O ponto de entrada para o metal do cliente no sistema.

Entidades: AnaliseQuimica

Fluxo:

Criação: Uma nova análise é registrada com status RECEBIDO.

Aprovação: Após a análise, o status muda para AGUARDANDO_APROVACAO.

Resultado: Ao ser aprovada pelo cliente (APROVADO_PARA_RECUPERACAO), a análise gera duas saídas distintas:

Crédito de Metal (CreditoCliente): Um registro é criado na conta corrente de metal do cliente (ex: +10g de Au, +5g de Ag). Importante: Isso NÃO é um Contas a Receber financeiro, mas sim um saldo de metal que o cliente possui com a empresa.

Material a Recuperar (MetalARecuperar): O metal bruto resultante da análise fica disponível para ser processado no próximo módulo.

3. Módulo de Recuperação de Metais
Processa o material bruto das análises para obter o metal puro.

Entidades: OrdemDeRecuperacao

Fluxo:

Criação: Uma ou mais AnaliseQuimica aprovadas (do mesmo tipo de metal) são agrupadas em uma OrdemDeRecuperacao com status PLANEJADA.

Processamento: A ordem passa pelos status EM_PROCESSAMENTO -> AGUARDANDO_TEOR_FINAL.

Finalização: O teorDoRecuperado é registrado. O sistema calcula:

Metal Puro: A quantidade de metal puro obtida (auPuroRecuperadoGramas). Esse valor é transferido para uma conta de metal específica (ex: "Estoque de Metal para Reação").

Resíduo/Sobra: A diferença entre o material que entrou e o metal puro que saiu gera uma nova AnaliseQuimica interna do tipo RESIDUO, reiniciando o ciclo.

4. Módulo de Reação Química (Produção)
Transforma o metal puro em produtos vendáveis.

Entidades: ReacaoQuimica, LoteDeProducao

Fluxo:

Início: Uma nova ReacaoQuimica é criada. O usuário seleciona os insumos:

Metal (Au): Originário de diversas fontes (saldo da Recuperação, pagamento de clientes em metal, compra de fornecedores).

Matéria-Prima (ex: KCN): Calculada com base na quantidade de metal (ex: Qtd KCN = Qtd Au * 0.899).

Sobras de Reações Anteriores: SobraDeCesto e SobraDeDestilado são adicionadas ao processo.

Processamento: A reação passa pelos status INICIADA -> PROCESSANDO -> AGUARDANDO_TEOR.

Finalização: Ao finalizar, a reação gera as saídas:

Produto Acabado: Cria um LoteDeProducao do produto (ex: 1099,56g de Sal 68%, com base na fórmula Qtd Au * 1,47). Este lote é adicionado ao estoque.

Novas Sobras: SobraDeCesto e SobraDeDestilado são pesadas e registradas para serem usadas em futuras reações.

5. Módulo de Vendas
Converte o estoque em receita.

Entidades: PedidoDeVenda, ItemDeVenda

Fluxo:

Criação do Pedido: O pedido é criado com status ABERTO.

Itens do Pedido:

Se o item for um produto de reação (ex: Sal 68%), o usuário seleciona o LoteDeProducao de onde o produto sairá. O sistema valida o saldo do lote.

Se for um produto de revenda, a baixa é feita do estoque geral.

Efetivação: O pedido é efetivado. Neste momento:

O estoque é baixado (do lote ou do produto).

Um ContasAReceber é gerado, com parcelas e vencimentos definidos.

O lançamento financeiro é criado, registrando o valor em R$ e o valor equivalente em Au.

Formas de Recebimento:

Dinheiro/Cheque/Depósito: Credita uma Conta Bancária da empresa.

Metal: Credita uma Conta de Metal da empresa (o cliente está pagando com metal).

Depósito para Fornecedor: O sistema debita o ContasAReceber do cliente e gera um crédito na Conta Corrente de Metal do fornecedor.

6. Módulo Financeiro
Gerencia todo o fluxo de caixa e de metais.

Entidades: ContasAPagar, ContasAReceber, LancamentoFinanceiro

Visualização Dual: Todas as telas de contas correntes (bancárias ou de metal) devem permitir ao usuário alternar a visualização dos valores entre Reais (R$) e Ouro (Au).

Pagamento de Despesas: Ao lançar uma despesa, o valor em R$ é registrado e sua contrapartida em Au (baseada na cotação do dia) também é salva, debitando a Conta correspondente.

Respostas a Dúvidas Pontuais e Sugestões
AccountRec na Análise Química:

Problema: A análise aprovada estava gerando um Contas a Receber, o que é conceitualmente incorreto.

Solução Racionalizada: Conforme descrito acima, a análise deve gerar um CreditoCliente em uma conta de metal. O cliente pode usar esse crédito posteriormente para:

Abater no valor de uma compra.

Vender o metal de volta para a empresa (o que geraria um Contas a Pagar para a empresa no momento da venda, com base na cotação do dia).

Badges e Status da Análise Química:

Problema: O enum de status sumiu e não há feedback visual.

Solução:

Restaurar o Enum: Garanta que o enum StatusAnaliseQuimica exista no packages/core e no schema.prisma.

Criar Legenda e Cores no Frontend:

RECEBIDO: Amarelo (bg-yellow-100 text-yellow-800)

AGUARDANDO_APROVACAO: Laranja (bg-orange-100 text-orange-800)

APROVADO_PARA_RECUPERACAO: Verde (bg-green-100 text-green-800)

Crie um componente no frontend que receba o status como prop e renderize o badge com a cor e o texto corretos.

unique-entity-id.ts vs. uuid:

Problema: Inconsistência no uso de IDs, causando problemas de tipo.

Análise: crypto.randomUUID() é uma API nativa do Node.js (disponível em versões mais recentes), enquanto uuid é uma biblioteca externa. Ambos geram UUIDs v4 válidos. O problema não é qual usar, mas a falta de padronização.

Solução: Padronize! A abordagem de ter uma classe UniqueEntityID (Value Object) é a melhor prática em DDD.

Escolha uma fonte: crypto.randomUUID() é a ótima escolha, pois é nativo e não requer dependências.

Centralize a criação: O único lugar que deve chamar crypto.randomUUID() é dentro do construtor ou de um método estático da sua classe UniqueEntityID.

Reforce a Regra:

Fora do Domínio -> Dentro do Domínio: Sempre receba IDs como string nos métodos criar das entidades e converta para new UniqueEntityID(string) internamente.

Dentro do Domínio -> Fora do Domínio: Ao passar um ID para um repositório Prisma, sempre use id.toString() ou id.toValue().

Essa disciplina resolverá os problemas de tipo em cascata.

Este documento agora serve como um guia claro e estruturado para o desenvolvimento contínuo do seu ERP. Ele organiza as regras de negócio complexas em módulos lógicos, define fluxos claros e aborda diretamente os pontos de dor que você identificou.







etm como colocar as entidades em ingles e mandar de novo



Mostrar raciocínio
Com certeza! Mantendo toda a lógica racionalizada e as explicações em Português do Brasil, conforme a nossa persona, aqui está a versão atualizada do documento com todos os nomes de entidades, módulos e conceitos de domínio traduzidos para o inglês.

Isso facilita a implementação no código, seguindo as convenções de nomenclatura em inglês, ao mesmo tempo que mantém a documentação de negócio clara para a equipe.

GEMINI.md - ERP for Precious Metals Management
Persona
Você é Gemini, um assistente de programação especialista em full-stack com TypeScript. Seu foco é em NestJS para o backend e Next.js com Tailwind CSS e shadcn/ui para o frontend. Forneça respostas claras, didáticas e em Português do Brasil, sempre priorizando as melhores práticas.

Contexto do Projeto
Este é um monorepo (pnpm) de um ERP focado na gestão completa do ciclo de vida de metais preciosos, desde a análise química até a produção e venda, integrado com módulos financeiros e de cadastro tradicionais. Os nomes das entidades de domínio estão em inglês para seguir as convenções de codificação.

Backend: apps/backend (NestJS, Prisma, PostgreSQL)

Frontend: apps/frontend (Next.js App Router, shadcn/ui, Tailwind CSS)

Core/Domain: packages/core (Domain entities, Value Objects, etc.)

Visão Geral do Sistema (O Coração do ERP)
O sistema centraliza todas as operações em torno de uma unidade de medida principal: o Ouro (Au). Todas as transações financeiras e movimentações de estoque, mesmo que realizadas em outras moedas ou metais (Prata, Ródio), são convertidas e rastreadas em seu equivalente em Ouro, com base na Cotação do Dia (Quotation). Isso permite uma visão consolidada e estratégica do negócio.

Módulos Principais e Fluxos de Negócio (Main Modules & Business Flows)
Aqui está a organização das suas ideias em módulos funcionais, com suas respectivas entidades em inglês.

1. Módulo de Cadastros (Core Entities Module)
A fundação do sistema, contendo as entidades primárias.

Person: Entidade base que pode ser Customer, Supplier, Employee, Carrier, ThirdParty. Contém dados como nome, contatos e endereço.

Product:

Produtos de Revenda (Resale Products): Itens comprados e revendidos sem transformação.

Produtos Produzidos (Manufactured Products): Itens resultantes do processo de ChemicalReaction (ex: Aurocyanide Potassium 68%).

ChartOfAccounts: Estrutura contábil para categorizar todas as receitas e despesas.

Account:

BankAccount (R$): Contas financeiras tradicionais.

MetalAccount (Au): Contas correntes para controlar o saldo de metal (ex: "Metal for Reaction", "Current Account with Supplier X").

Quotation: Registro diário dos valores de compra/venda dos metais (Au, Ag, etc.), podendo diferenciar por tipo de pagamento (ex: PIX, Cheque).

2. Módulo de Análise Química (Chemical Analysis Module)
O ponto de entrada para o metal do cliente no sistema.

Entidades: ChemicalAnalysis

Fluxo:

Criação: Uma nova análise é registrada com status RECEIVED.

Aprovação: Após a análise, o status muda para PENDING_APPROVAL.

Resultado: Ao ser aprovada pelo cliente (APPROVED_FOR_RECOVERY), a análise gera duas saídas distintas:

MetalCredit: Um registro é criado na conta de metal do cliente (ex: +10g de Au, +5g de Ag). Importante: Isso NÃO é um AccountsReceivable financeiro, mas sim um saldo de metal que o cliente possui com a empresa.

MaterialToRecover: O metal bruto resultante da análise fica disponível para ser processado no próximo módulo.

3. Módulo de Recuperação de Metais (Metal Recovery Module)
Processa o material bruto das análises para obter o metal puro.

Entidades: RecoveryOrder

Fluxo:

Criação: Uma ou mais ChemicalAnalysis aprovadas (do mesmo tipo de metal) são agrupadas em uma RecoveryOrder com status PLANNED.

Processamento: A ordem passa pelos status PROCESSING -> PENDING_FINAL_PURITY.

Finalização: O teor (purity) é registrado. O sistema calcula:

PureMetal: A quantidade de metal puro obtida. Esse valor é transferido para uma MetalAccount específica (ex: "Metal Stock for Reaction").

Residue: A diferença entre o material que entrou e o metal puro que saiu gera uma nova ChemicalAnalysis interna do tipo RESIDUE, reiniciando o ciclo.

4. Módulo de Reação Química (Chemical Reaction / Production Module)
Transforma o metal puro em produtos vendáveis.

Entidades: ChemicalReaction, ProductionBatch

Fluxo:

Início: Uma nova ChemicalReaction é criada. O usuário seleciona os Inputs:

Metal (Au): Originário de diversas fontes (saldo da RecoveryOrder, pagamento de clientes em metal, compra de fornecedores).

RawMaterial (ex: KCN): Calculada com base na quantidade de metal (ex: KCN_Qty = Au_Qty * 0.899).

Sobras de Reações Anteriores (Leftovers): BasketLeftover e DistillateLeftover são adicionadas ao processo.

Processamento: A reação passa pelos status STARTED -> PROCESSING -> PENDING_PURITY.

Finalização: Ao finalizar, a reação gera as saídas (Outputs):

FinishedProduct: Cria um ProductionBatch do produto (ex: 1099,56g de Sal 68%, com base na fórmula Au_Qty * 1.47). Este lote é adicionado ao estoque.

Novas Sobras (New Leftovers): BasketLeftover e DistillateLeftover são pesadas e registradas para serem usadas em futuras reações.

5. Módulo de Vendas (Sales Module)
Converte o estoque em receita.

Entidades: SalesOrder, SalesOrderItem

Fluxo:

Criação do Pedido: O pedido é criado com status OPEN.

Itens do Pedido:

Se o item for um produto de reação (ex: Sal 68%), o usuário seleciona o ProductionBatch de onde o produto sairá. O sistema valida o saldo do lote.

Se for um produto de revenda, a baixa é feita do estoque geral.

Efetivação (Confirmation): O pedido é efetivado. Neste momento:

O estoque é baixado (do lote ou do produto).

Um AccountsReceivable é gerado, com parcelas e vencimentos definidos.

Um FinancialTransaction é criado, registrando o valor em R$ e o valor equivalente em Au.

Formas de Recebimento (Payment Methods):

Dinheiro/Cheque/Depósito: Credita uma BankAccount da empresa.

Metal: Credita uma MetalAccount da empresa (o cliente está pagando com metal).

Depósito para Fornecedor: O sistema debita o AccountsReceivable do cliente e gera um crédito na MetalAccount do fornecedor.

6. Módulo Financeiro (Financial Module)
Gerencia todo o fluxo de caixa e de metais.

Entidades: AccountsPayable, AccountsReceivable, FinancialTransaction

Visualização Dual: Todas as telas de contas correntes (BankAccount ou MetalAccount) devem permitir ao usuário alternar a visualização dos valores entre Reais (R$) e Ouro (Au).

Pagamento de Despesas: Ao lançar uma despesa, o valor em R$ é registrado e sua contrapartida em Au (baseada na Quotation do dia) também é salva, debitando a Account correspondente.

Respostas a Dúvidas Pontuais e Sugestões
AccountsReceivable na Análise Química:

Problema: A análise aprovada estava gerando um Contas a Receber, o que é conceitualmente incorreto.

Solução Racionalizada: A análise deve gerar um MetalCredit em uma MetalAccount do cliente. O cliente pode usar esse crédito posteriormente para:

Abater no valor de uma compra.

Vender o metal de volta para a empresa (o que geraria um AccountsPayable para a empresa no momento da venda, com base na Quotation do dia).

Badges e Status da Análise Química:

Problema: O enum de status sumiu e não há feedback visual.

Solução:

Restaurar o Enum: Garanta que o enum ChemicalAnalysisStatus exista no packages/core e no schema.prisma.

Criar Legenda e Cores no Frontend:

RECEIVED: Amarelo (bg-yellow-100 text-yellow-800)

PENDING_APPROVAL: Laranja (bg-orange-100 text-orange-800)

APPROVED_FOR_RECOVERY: Verde (bg-green-100 text-green-800)

Crie um componente no frontend que receba o status como prop e renderize o badge com a cor e o texto corretos.

unique-entity-id.ts vs. uuid:

Problema: Inconsistência no uso de IDs, causando problemas de tipo.

Análise: crypto.randomUUID() é uma API nativa do Node.js. uuid é uma biblioteca externa. O problema não é qual usar, mas a falta de padronização.

Solução: Padronize! A abordagem de ter uma classe UniqueEntityID (Value Object) é a melhor prática em DDD.

Escolha uma fonte: crypto.randomUUID() é a escolha recomendada.

Centralize a criação: O único lugar que deve chamar crypto.randomUUID() é dentro do construtor ou de um método estático da sua classe UniqueEntityID.

Reforce a Regra:

Fora do Domínio -> Dentro do Domínio: Receba IDs como string e converta para new UniqueEntityID(string) internamente.

Dentro do Domínio -> Fora do Domínio: Ao passar um ID para um repositório, sempre use id.toString() ou id.toValue().

### Objetivos Atuais






### Histórico de Soluções e Decisões

**1. Correções no Processo de Importação Completa e Extrato de Estoque**
   - **Problema:** O processo de "Iniciar Importação Completa" apresentava falhas na criação de lotes, no tratamento de pedidos em aberto e na geração de contas a receber. Além disso, a tela de extrato de estoque necessitava de melhorias na ordenação.
   - **Diagnóstico:**
     - A importação de lotes estava incompleta porque o sistema sobrescrevia dados de lotes com o mesmo número no arquivo de movimentação.
     - Pedidos com status "ABERTO" estavam sendo processados incorretamente, com baixa de estoque e quitação de parcelas indevidas.
     - Contas a receber com valor zerado estavam sendo criadas, gerando dados desnecessários.
     - O extrato de estoque não tinha uma ordenação consistente.
   - **Solução Implementada:**
     - **Correção na Criação de Lotes:** Ajustada a lógica em `sales-movement-import.use-case.ts` para garantir que todos os lotes únicos do arquivo `MOVIMENTACAO_VIRGULA.csv` sejam criados, evitando a sobrescrita de dados.
     - **Tratamento de Pedidos em Aberto:** Adicionada uma verificação em `sales-movement-import.use-case.ts` para que vendas com status "ABERTO" não tenham seu estoque ou parcelas alterados durante a importação.
     - **Validação de Contas a Receber:** Implementada uma condição em `json-imports.service.ts` para impedir a criação de contas a receber (`AccountRec`) com valor bruto igual a zero.
     - **Ordenação do Extrato de Estoque:** A consulta no `stock-statement.service.ts` foi modificada para ordenar as movimentações por número do pedido (`orderNumber`) e, secundariamente, pela data, garantindo uma visualização clara e cronológica.
   - **Status:** Concluído. O processo de importação está mais robusto e as visualizações de dados mais precisas.

**2. Refatoração Completa do Cálculo de Ajuste de Venda (`sale_adjustment`)**
   - **Problema:** O cálculo do lucro em BRL (`netProfitBRL`) e em gramas (`netDiscrepancyGrams`) estava incorreto. O custo total (`totalCostBRL`) era calculado usando a quantidade física do item em vez dos gramas de ouro esperados. Além disso, a "mão de obra" (`laborCostInGrams`) era tratada como um custo, não como uma receita, e a cotação do pagamento (`paymentQuotation`) não estava sendo calculada corretamente a partir das transações.
   - **Diagnóstico:**
     - `totalCostBRL` usava `item.quantity` em vez de `itemExpectedGrams`.
     - `paymentQuotation` usava o `goldPrice` da venda como fallback, em vez de priorizar a cotação efetiva das transações de pagamento.
     - `netProfitBRL` não incluía o valor da mão de obra (`laborCostInBRL`).
     - `netDiscrepancyGrams` subtraía a `laborCostInGrams` em vez de somar.
   - **Solução Implementada (Refatoração do `CalculateSaleAdjustmentUseCase`):**
     - **1. Cotação Efetiva do Pagamento:** A `paymentQuotation` agora é sempre calculada dividindo o `paymentReceivedBRL` pelo `paymentEquivalentGrams` das transações, garantindo o valor correto. O `sale.goldPrice` virou um fallback.
     - **2. Custo Baseado em Ouro:** O `totalCostBRL` agora é calculado multiplicando o `costPriceAtSale` de cada item pelos seus respectivos `itemExpectedGrams`, refletindo o custo real baseado no ouro.
     - **3. Mão de Obra como Receita:** A `laborCostInGrams` agora é somada ao `netDiscrepancyGrams`. Além disso, ela é convertida para `laborCostInBRL` (usando a `paymentQuotation`) e somada ao `netProfitBRL`.
   - **Status:** Concluído. A lógica de cálculo de lucro e custo foi completamente reestruturada para seguir as regras de negócio corretas.



# Pendencias e Resover 
/home/aleduque/Documentos/cursos/sistema-erp-electrosal/pendencias.md

### Histórico de Soluções e Decisões (continuação)

**3. Implementação do Módulo de Matéria-Prima (Fase 1 e 2)**
   - **Problema:** O sistema não tinha a capacidade de gerenciar matérias-primas, que são insumos essenciais para os processos de recuperação e reação química.
   - **Solução Implementada:**
     - **Criação do Módulo de Matéria-Prima (Backend):**
       - **Modelo de Dados:** Adicionado o modelo `RawMaterial` ao `schema.prisma` para representar as matérias-primas, com campos como nome, custo, unidade e estoque.
       - **CRUD:** Criado um novo módulo `raw-materials` no backend com todas as operações básicas (Criar, Ler, Atualizar, Deletar) para gerenciar as matérias-primas.
       - **Integração com Pedidos de Compra:**
         - Modificado o modelo `PurchaseOrderItem` para permitir a compra tanto de produtos quanto de matérias-primas.
         - Ajustado o serviço de `purchase-orders` para validar e processar a compra de matérias-primas, atualizando o estoque corretamente quando um pedido de compra é recebido.
     - **Integração da Matéria-Prima com os Processos (Backend):**
       - **Rastreamento de Uso:** Criado o modelo `RawMaterialUsed` para rastrear a quantidade e o custo de cada matéria-prima utilizada em Ordens de Recuperação e Reações Químicas.
       - **Integração com Ordens de Recuperação:**
         - Adicionado um novo endpoint (`/recovery-orders/:id/raw-materials`) que permite adicionar uma matéria-prima a uma ordem de recuperação existente.
         - A lógica de negócio calcula o custo equivalente em ouro da matéria-prima utilizada com base na cotação do dia e decrementa o estoque.
       - **Integração com Reações Químicas:**
         - Adicionado um novo endpoint (`/chemical-reactions/:id/raw-materials`) que permite adicionar uma matéria-prima a uma reação química existente.
         - A lógica de negócio, similar à da recuperação, calcula o custo em ouro e atualiza o estoque.
   - **Status:** Concluído.

**4. Correção da Funcionalidade de Upload e Exibição de Imagens**
   - **Problema:** Imagens não estavam sendo associadas ou exibidas corretamente tanto para "Análises Químicas" quanto para "Ordens de Recuperação". Em "Análises Químicas", o `analiseQuimicaId` estava vindo como `null` no backend, e em "Ordens de Recuperação", as imagens não eram exibidas, apesar de estarem associadas. A interface de upload e gerenciamento de imagens não era consistente entre as duas seções.
   - **Diagnóstico:**
     - Para "Análises Químicas", o campo `analiseQuimicaId` não existia na entidade `Media` (`packages/core`), fazendo com que o ID fosse descartado antes de ser persistido.
     - Para "Ordens de Recuperação", a entidade `RecoveryOrder` (`packages/core`) esperava uma única `image` no singular, enquanto o repositório e o DTO estavam trabalhando com um array `images` no plural. Além disso, o `associateImageToRecoveryOrderUseCase` estava tentando atualizar a `RecoveryOrder` com um `imageId` em vez de atualizar a `Media` com o `recoveryOrderId`. A interface de usuário para upload era manual e não reutilizava os componentes genéricos.
     - O `path` das imagens estava vindo como `undefined` no frontend devido a problemas de serialização/desserialização entre o backend e o frontend.
   - **Solução Implementada:**
     - **Backend (`packages/core`):**
       - Adicionado `analiseQuimicaId?: string;` à interface `MediaProps` e um getter correspondente na classe `Media` (`media.entity.ts`).
       - Corrigida a entidade `RecoveryOrder` (`recovery-order.entity.ts`) para usar uma propriedade `images?: Media[];` no plural, removendo as propriedades `image` e `imageId` no singular.
     - **Backend (`apps/backend`):
       - Criado um `MediaResponseDto` genérico (`media.response.dto.ts`) no módulo `media` para garantir a serialização correta de todas as propriedades da mídia.
       - Modificado o `media.controller.ts` para usar o `MediaResponseDto` genérico ao retornar as mídias de uma análise química e de uma ordem de recuperação.
       - Adicionado um método `findByRecoveryOrderId` ao `MediaService` e um endpoint correspondente no `MediaController` para buscar mídias associadas a ordens de recuperação.
       - Corrigido o `associateImageToRecoveryOrderUseCase` para atualizar a entidade `Media` com o `recoveryOrderId`, em vez de tentar atualizar a `RecoveryOrder` com um `imageId`.
       - Adicionado o método `save` à interface `IMediaRepository` e à sua implementação `PrismaMediaRepository` para permitir a atualização de entidades de mídia.
     - **Frontend (`apps/frontend`):**
       - Refatorado o componente `ImageUpload.tsx` para aceitar um objeto `entity` genérico (`{ type: 'analiseQuimica' | 'recoveryOrder', id: string }`), tornando-o reutilizável para diferentes tipos de entidades.
       - Atualizado o `VisualizarAnaliseModal.tsx` para usar o `ImageUpload` com a nova prop `entity`.
       - Reescrevi o `RecoveryOrderDetailsModal.tsx` para usar os componentes `ImageUpload` e `ImageGallery`, replicando a funcionalidade de upload e exclusão de imagens presente nas análises químicas, garantindo uma interface consistente.
       - Adicionada a função `getMediaForRecoveryOrder` ao `mediaApi.ts` para buscar mídias de ordens de recuperação.
   - **Status:** Concluído. A funcionalidade de upload e exibição de imagens agora é consistente e funciona corretamente para "Análises Químicas" e "Ordens de Recuperação".
