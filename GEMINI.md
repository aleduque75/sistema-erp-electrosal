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

Escolha uma fonte: crypto.randomUUID() é uma ótima escolha, pois é nativo e não requer dependências.

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

**1. Criação da Entidade `Cotação`**
   - **Tarefa:** Definir o modelo `Cotacao` no `schema.prisma` para registrar os preços diários de compra e venda dos metais.
   - **Tarefa:** Criar o módulo backend (`cotacoes`) para gerenciar o CRUD (Create, Read, Update, Delete) das cotações.
   - **Status:** A fazer.

**2. Integração do Plano de Contas na Recuperação**
   - **Tarefa:** Ao finalizar uma `OrdemDeRecuperacao`, o sistema deverá buscar a cotação do dia para o metal recuperado.
   - **Tarefa:** Calcular o valor em Reais (R$) do metal puro obtido (`auPuroRecuperadoGramas`).
   - **Tarefa:** Criar um `LancamentoFinanceiro` automático, debitando uma conta de `Estoque` e creditando uma conta de `Custo de Produção` ou `Variação de Ativo`.
   - **Status:** A fazer.

**3. Refatoração do Fluxo de Pagamentos e Entradas de Metal**
   - **Tarefa:** Implementar a lógica para que um cliente possa pagar uma venda usando seu saldo de metal (`Conta de Metal`).
   - **Tarefa:** Modelar e implementar o fluxo de compra de metal de fornecedores, incluindo o cenário onde um cliente deposita um valor diretamente para o fornecedor da empresa.
   - **Status:** A fazer.

### Histórico de Soluções e Decisões

**1. Correção do Cálculo de Ajuste para Vendas Legadas**
   - **Problema:** O processo de "Importar Dados Legados (Processo Completo)" estava calculando incorretamente o lucro (`grossDiscrepancyGrams`) para vendas de produtos como "El Sal 68%". Além disso, o processo travava no final, sem concluir.
   - **Diagnóstico:**
     - O cálculo de `saleExpectedGrams` aplicava uma conversão de teor de ouro (ex: 68.2%) a todos os produtos, quando para as vendas legadas, deveria usar a quantidade direta do item.
     - O processo de recálculo (`backfill`) executava uma busca ao banco de dados para cada venda dentro de um loop (problema N+1), causando lentidão e travamento com muitas vendas.
     - O campo `goldPrice` na entidade `Sale` não estava sendo atualizado com a cotação calculada.
   - **Solução Implementada:**
     - **Simplificação da Regra de Negócio:** A lógica no `CalculateSaleAdjustmentUseCase` foi simplificada. Agora, `saleExpectedGrams` é sempre a soma direta da quantidade dos itens da venda, alinhando-se à regra de negócio para as vendas importadas.
     - **Otimização do Backfill:** O processo de `backfillSaleAdjustments` foi otimizado para buscar os dados de todas as vendas de uma só vez, mas a iteração ainda processa uma venda de cada vez para evitar erros de tipo complexos e garantir a robustez, resolvendo o problema de travamento.
     - **Correção do `goldPrice`:** A lógica foi ajustada para garantir que, após o cálculo do ajuste, o campo `goldPrice` na entidade `Sale` seja preenchido com o `paymentQuotation` calculado.
   - **Status:** Concluído. O processo de importação agora é robusto, não trava e calcula os ajustes de venda corretamente.

**2. Correções no Processo de Importação Completa e Extrato de Estoque**
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


# Vendas uma de produto de revenda, a comissão seria o que pagou menos o que vendeu, seria uma porcentagem desse lucrobruto em venda do sal de au 68$, que vira da reação, ai muda, eu cobro uma mão de obra, que seria por exemplo teria que ter uma tabela, abaixo de 19 gramas cobro 1 gr, isso pode ser altarado , mas seria como padrão, vamos dar um exemplo de uma venda de 10 gr, na cotação de venda 606 e tem frete de R$ 70,00, recebo R$ 6736,00 em metal 11,115 g, mas a cotação de compra do fornecedor é 605,entao seria  11,13, essa diferença seria para uma conta diferença_cotação de 0,014 gr, para calculo de comissão seria a 1 gr de mão de obra menos custos, que ai teria que colocar. é bem complexo deu para entendeer, e queria importar do sistema antigo, os clientes tem um externalId do sistema antigo queria vincular as vendas, elas então em /home/aleduque/Documentos/cursos/sistema-erp-electrosal/json-imports    
