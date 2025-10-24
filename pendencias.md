## Pendências Resolvidas

### 1. Duplicação de `sales_installment` para vendas à vista e em metal

**Problema:** Ao confirmar uma venda com pagamento `A_VISTA` ou `METAL`, o sistema estava criando duas entradas em `sales_installment`: uma `PENDING` (provavelmente de um processo anterior ou de um estado inicial da venda) e outra `PAID` (criada no `confirm-sale.use-case.ts`). Isso gerava redundância e inconsistência.

**Análise:**
*   O `create-sale.use-case.ts` não cria `sales_installment` para vendas `A_VISTA` ou `METAL`. Ele só cria parcelas para vendas `A_PRAZO` (com `paymentTermId`).
*   O `confirm-sale.use-case.ts` estava criando uma `sales_installment` com status `PAID` para vendas `A_VISTA` e `METAL`, mesmo já tendo criado um `accountRec` que representa o recebimento.

**Solução:**
*   Removida a criação da `sales_installment` dentro dos blocos de `paymentMethod === 'A_VISTA'` e `paymentMethod === 'METAL'` no arquivo `apps/backend/src/sales/use-cases/confirm-sale.use-case.ts`. O `accountRec` já é suficiente para registrar o recebimento nesses casos.

### 2. Origem de `price` e `costPriceAtSale` em `SaleItem`

**Problema:** Dúvida sobre a origem dos valores `price` e `costPriceAtSale` em `SaleItem`, especialmente o `costPriceAtSale` sendo `0.00`.

**Análise:**
*   **`price` (preço de venda do item):** Este valor é obtido diretamente do `createSaleDto` (dados de entrada da criação da venda, geralmente vindos do frontend ou de importações). No exemplo, R$ 532,79 foi o preço unitário informado na criação da venda.
*   **`costPriceAtSale` (custo do item no momento da venda):** Este valor é obtido do `costPrice` do `inventoryLot` (lote de inventário) associado ao `SaleItem` no momento da criação da venda. Se o valor é `0.00`, significa que o `costPrice` do `inventoryLot` correspondente era `0.00`. Isso indica que o custo do lote de inventário não foi preenchido corretamente durante sua entrada no sistema.

**Próximos Passos:**
*   Verificar a entrada de dados para `inventoryLot`s para garantir que o `costPrice` seja preenchido corretamente.

### 3. `AccountRec` não era criado para vendas `A_PRAZO`

**Problema:** Ao confirmar uma venda `A_PRAZO`, o sistema não estava criando o registro correspondente em `AccountRec`. Isso ocorria porque uma correção anterior para evitar duplicidade de `sale_installment` removeu indevidamente a criação do `AccountRec`.

**Análise:** O `create-sale.use-case.ts` cria as `sale_installment` com status `PENDING`, mas nenhum `AccountRec` era gerado no fluxo de confirmação para vendas `A_PRAZO`.

**Solução:** Reintroduzida a lógica no `confirm-sale.use-case.ts` para criar um único `AccountRec` para a venda `A_PRAZO`, representando o valor total a receber. As `sale_installment` existentes são então vinculadas a este novo `AccountRec`.

### 4. `sale_installment` não lançado para vendas `A_VISTA` (Reaberto)

**Problema:** "Pedido com venda a vista ele , não esta lançando no Sale_installment"

**Análise:** A decisão inicial foi remover a criação de `sale_installment` para `A_VISTA` no `confirm-sale.use-case.ts`, considerando `accountRec` como o registro principal. No entanto, o usuário espera que `sale_installment` seja lançado.

**Solução:** Reintroduzida a criação de `saleInstallment` para vendas `A_VISTA` no `confirm-sale.use-case.ts`, com status `PAID` e vinculada ao `accountRec` correto.

### 5. `sale_installment` não lançado para recebimento em metal, mas deveria (Reaberto)

**Problema:** "pedido para recebimento em metal , lançou em pure_metal_lots corretamente, não lança no e Sale_installment deveria"

**Análise:** A decisão inicial foi remover a criação de `sale_installment` para `METAL` no `confirm-sale.use-case.ts`. No entanto, o usuário espera que `sale_installment` seja lançado.

**Solução:** Reintroduzida a criação de `saleInstallment` para vendas `METAL` no `confirm-sale.use-case.ts`, com status `PAID` e vinculada ao `accountRec` correto.

### 6. `metal_accounts_entries` negativo para recebimento em metal

**Problema:** "o pedidos que fiz para receber em metal, ele lançou em pure_meta_lots ok, mas lançou tambem negativo em metal_accounts_entries, não entendi esses lançamentos"

**Análise:** O lançamento negativo em `metal_accounts_entries` para a conta do cliente é o comportamento **correto** quando o cliente paga com metal, pois o metal está saindo da conta do cliente.

**Solução:** Adicionada uma descrição mais clara ao `metalAccountEntry` no `confirm-sale.use-case.ts` para vendas `METAL`, indicando que é uma saída da conta do cliente.

### 7. `sale_installment` duplicado para vendas `A_PRAZO`

**Problema:** "fiz um pedido 28 dias ele considerou a prazo , duplicou em sale_installmensts um PAID e um PENDING"

**Análise:** O `create-sale.use-case.ts` cria a `sale_installment` `PENDING`. O `confirm-sale.use-case.ts` não deveria criar `accountRec`s e `sale_installment`s para `A_PRAZO`.

**Solução:** Removida a criação de `accountRec` e `saleInstallment` dentro do loop `for` no bloco `else if (paymentMethod === 'A_PRAZO')` em `confirm-sale.use-case.ts`.

### 8. Pagamento com crédito de metal (metal_credit vs metal_accounts_entries)

**Problema:** "fui pagar com o credito de metal, que deve estar trazendo somente de metal_credit e não esta de metal_accounts_entries que foi onde o sistema lançou o credito do pedido, tem que verificar isso"

**Análise:** O `pay-accounts-rec-with-metal-credit.use-case.ts` já usa `metalCredit` para verificar o saldo. A confusão pode ser na visualização ou no entendimento de como `MetalCredit` e `MetalAccountEntry` se relacionam.

**Próximos Passos:**
*   Manter a lógica atual no backend.
*   Considerar uma explicação mais clara da diferença entre `MetalCredit` (saldo disponível) e `MetalAccountEntry` (movimentação na conta de metal) na documentação ou no frontend.

### 9. `pure_metal_lots` com descrição nula

**Problema:** "ai paguei uma em metal e um a em caixa/bancos, ele lançou em pure_metal_lots, mas não colocoiu descrição deixou null"

**Análise:** A descrição do `pure_metal_lots` no `confirm-sale.use-case.ts` já foi corrigida para incluir mais detalhes. Se o problema persiste, pode ser em outro local de criação de `pure_metal_lots` ou na visualização.

**Próximos Passos:**
*   Verificar se há outros locais de criação de `pure_metal_lots` que não preenchem a descrição.
*   Verificar como a descrição é exibida no frontend/recuperada do banco de dados.

### 10. `sale_installment` duplicado para vendas `A_PRAZO` (Resolvido, mas reaberto para esclarecimento)

**Problema:** "ficou estranho o a receber ter uma parcela e o sale_adjustment ter duas, porque o a receber é o accountRec , é qaqui que deveria ficar as 2 parcelas tambem"

**Análise:** O `AccountRec` representa o valor total a receber da venda, enquanto `SaleInstallment` representa as parcelas individuais. A implementação atual cria um `AccountRec` para o total e várias `SaleInstallment` para as parcelas, vinculadas ao `AccountRec`. O problema é de visualização no frontend, que não exibe as parcelas associadas ao `AccountRec`.

**Solução:** O backend foi ajustado para retornar as `SaleInstallment` associadas ao `AccountRec`. O frontend foi modificado para exibir essas parcelas na página de detalhes do `AccountRec` e permitir o registro de pagamento para cada parcela individualmente.



#Deixar vendas a prazo para resolver depois, 


#Podemos ver material prima, ela é utilizada na recuperação, e tambem na reação, poderia ter entrada por pedido de compra, gerar contas a pagar, poder ou não seer revenda

na recuperação, ter uma opção de colocar a quantidade em uma recuperação, finalizada ou não, exemplo uma recuparação que ja terminou , mas me dar a opção de inserir materia prime, ele computar exemplo utilizai 1 kg de po de zinco que custou R$ 80,00 pegar a cotação do dia da recuperação e dividir, 80 / 720 exemplo = 0,11 gr, ai tambem utilizou acido nitrico 4 lt, R$ 120,00 / 720 = 0,16 gr, em um relatorio de recuperação teria os valores retirados teria que ser algo assim

analise 1 = recuperar 20 gr, paguei 16 gr para cliente
analise 2 = recuperar 80 gr, paguei 65 gr para cliente

recuperação 100 gr da analise 1 e 2
gastou material po de zinco = 0,15
gastou material acido nitrico = 0,11


tirou 85 gr, ficou 15 como resuduo para recuperar

em um periodo ira ter algumas recuperações que terão valores pagos para clientes e matrerias gastos

ficaria algo como 

Recuperado 350 gr
Pago cliente 300 gr
mateiral gasto 15 gr
a recuperar 20 gr 

Lucro 50 gr - 15 gr = 35 gr, mas tem 20 a recuperar em residuo

algo assim, deu para entender

  Proponho um plano em três fases:
  Fase 1: Backend - Gestão Central de Matéria-Prima
   1. Definir modelo RawMaterial (nome, descrição, unidade, custo, organização, revenda).
   2. Criar módulo CRUD para RawMaterial.
   3. Integrar com PurchaseOrder para gerar AccountsPayable.

  Fase 2: Backend - Integração com Recuperação e Reação
   1. Atualizar RecoveryOrder e ChemicalReaction para rastrear RawMaterialUsed.
   2. Definir modelo RawMaterialUsed (quantidade, custo, custo equivalente em ouro).
   3. Modificar casos de uso de RecoveryOrder e ChemicalReaction para incluir seleção e cálculo de custos de 
      matéria-prima.
   4. Ajustar cálculos financeiros para incluir custos de matéria-prima.

  Fase 3: Frontend - UI para Matéria-Prima
   1. Criar UI para CRUD de RawMaterial.
   2. Integrar seleção e entrada de matéria-prima nos formulários de RecoveryOrder e ChemicalReaction.
   3. Atualizar relatórios para exibir custos de matéria-prima e cálculos de lucro.

  Aguardarei a aprovação do usuário para este plano.