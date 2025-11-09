Entendi. Para implementar a seleção de múltiplos lotes em uma venda, preciso de uma grande mudança no frontend e backend.

  O Plano:

  Backend:
   1. `SaleItem` Model: Criarei um modelo SaleItemLot no schema.prisma para uma relação muitos-para-muitos entre SaleItem e 
      InventoryLot, armazenando a quantidade de cada lote.
   2. Lógica do Backend: Atualizarei o caso de uso de criação/atualização de vendas para lidar com múltiplas seleções de lote por 
      item, criando entradas SaleItemLot e atualizando a remainingQuantity de cada InventoryLot. A lógica de movimentação de estoque 
      também será ajustada.

  Frontend:
   1. UI de Seleção de Lote: Redesenharei a UI de seleção de lote para uma modal que permita visualizar, ordenar por data (FIFO), 
      selecionar múltiplos lotes e calcular a quantidade restante.
   2. Formulário de Venda: Atualizarei o formulário para usar a nova UI e enviar a estrutura de dados correta.

  Próximos Passos:

  Começarei pelo backend, modificando o schema.prisma para adicionar o modelo SaleItemLot, gerando uma nova migração e atualizando
   os casos de uso e serviços. Em seguida, farei o frontend.

  Vou começar lendo o schema.prisma para garantir que tenho a versão mais recente.



  Prós:
   * Rastreabilidade Completa: Teríamos rastreabilidade total de cada lote.
   * Políticas de Inventário: Permitiria a implementação de FIFO e outras políticas.
   * Custeio Preciso: O custo de cada SaleItem seria calculado com precisão.

  Contras:
   * Implementação Complexa: Exige mudanças no banco de dados, backend e frontend.
   * Nova UI: Os usuários precisariam aprender uma nova interface.

  Recomendação

  Embora a consolidação de lotes seja mais simples, eu a desaconselho fortemente. A perda de rastreabilidade e a incapacidade de 
  gerenciar o inventário adequadamente são desvantagens graves.

  A seleção de múltiplos lotes é a solução correta, mais robusta e escalável. Estou pronto para implementá-la, começando pelas 
  alterações no schema.prisma do backend, após ler a versão mais recente do arquivo.

> ok

✦ Certo, vou implementar a seleção de múltiplos lotes. Começarei modificando o schema.prisma para adicionar o modelo SaleItemLot e 
  atualizar os modelos SaleItem e InventoryLot. Primeiro, lerei o schema.prisma para garantir que estou com a versão mais recente.
