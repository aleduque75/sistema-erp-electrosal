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
     - Para "Ordens de Recuperação", a entidade `RecoveryOrder` (`recovery-order.entity.ts`) esperava uma única `image` no singular, enquanto o repositório e o DTO estavam trabalhando com um array `images` no plural. Além disso, o `associateImageToRecoveryOrderUseCase` estava tentando atualizar a `RecoveryOrder` com um `imageId` em vez de atualizar a `Media` com o `recoveryOrderId`. A interface de usuário para upload era manual e não reutilizava os componentes genéricos.
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

**5. Implementação da Seleção de Múltiplos Lotes por Item de Venda**
   - **Problema:** O sistema não permitia associar múltiplos lotes de inventário a um único item de venda, limitando a rastreabilidade e a flexibilidade na gestão de estoque.
   - **Solução Implementada:**
     - **Backend:**
       - O `schema.prisma` já possuía o modelo `SaleItemLot` para a relação muitos-para-muitos entre `SaleItem` e `InventoryLot`.
       - O `CreateSaleUseCase` foi refatorado para:
         - Melhorar as mensagens de erro, tornando-as mais específicas.
         - Incluir a criação de registros de `StockMovement` para cada lote utilizado na venda, garantindo o rastreamento completo do estoque.
         - Reorganizar o código em funções privadas para aumentar a clareza e a manutenibilidade.
     - **Frontend:**
       - O componente `LotSelectionModal` foi criado (`apps/frontend/src/components/sales/LotSelectionModal.tsx`) para permitir a seleção e edição de múltiplos lotes para um item de venda específico.
       - O `NewSaleForm` (`apps/frontend/src/app/(dashboard)/sales/components/NewSaleForm.tsx`) foi modificado para:
         - Remover o `ProductSelectionModal` (a adição de produtos agora é feita diretamente na tabela).
         - Adicionar um botão "Adicionar Item" para incluir novos produtos na tabela de vendas.
         - Adicionar um botão "Selecionar Lotes" para cada item da venda, que abre o `LotSelectionModal` para gerenciar os lotes associados.
         - Atualizar a lógica de estado para lidar com a seleção e edição de lotes por item, garantindo que o payload enviado ao backend contenha a estrutura correta de múltiplos lotes.
   - **Status:** Concluído. A funcionalidade de seleção de múltiplos lotes por item de venda foi implementada com sucesso, melhorando a rastreabilidade e a gestão de estoque.