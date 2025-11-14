sale
id	a72b4c2b-21a9-4a61-97de-c98043a72bcd
orderNumber	31571
totalAmount	18385.50
feeAmount	
netAmount	18385.50
paymentMethod	IMPORTADO
createdAt	2025-06-10 08:12:00
updatedAt	2025-11-12 14:21:31.47
organizationId	2a5bb448-056b-4b87-b02f-fec691dd658d
paymentTermId	
pessoaId	5d32c9a1-f861-442d-a590-00c828d32924
goldPrice	595.00
goldValue	30.0000
totalCost	17850.00
commissionAmount	
commissionDetails	
externalId	1749554002695x889672192340262900
status	PAGO_PARCIALMENTE
shippingCost	0.00
readyForPayment	false

sale_adjustment
id	048f917d-fd5b-446d-a765-a74d7e1537c9
saleId	a72b4c2b-21a9-4a61-97de-c98043a72bcd
organizationId	2a5bb448-056b-4b87-b02f-fec691dd658d
paymentReceivedBRL	18385.50
paymentQuotation	595.00
paymentEquivalentGrams	30.9000
saleExpectedGrams	30.0000
grossDiscrepancyGrams	0.9000
costsInBRL	0.00
costsInGrams	0.0000
netDiscrepancyGrams	0.9000
createdAt	2025-11-06 19:58:02.658
updatedAt	2025-11-12 14:21:31.469
grossProfitBRL	535.50
netProfitBRL	535.50
otherCostsBRL	0.00
totalCostBRL	17850.00

accountRec
id	f916be58-ac82-4202-a4fc-2acf75c56465
saleId	a72b4c2b-21a9-4a61-97de-c98043a72bcd
description	Receber de Techgalvano venda #31571
amount	18385.50
dueDate	2025-12-06 19:58:02.651
received	false
receivedAt	
createdAt	2025-11-06 19:58:02.652
updatedAt	2025-11-12 14:21:31.446
contaCorrenteId	
organizationId	2a5bb448-056b-4b87-b02f-fec691dd658d
transacaoId	
externalId	
amountPaid	18385.50
goldAmount	30.0000
goldAmountPaid	30.9000
doNotUpdateSaleStatus	false

transacoes
id	7ce0948a-7a14-4f6d-a519-ce3406f4dd45
tipo	CREDITO
valor	18385.50
moeda	BRL
descricao	Recebimento da Venda #31571 com metal físico
dataHora	2025-06-17 00:00:00
contaContabilId	06380ac4-7f1e-4673-9372-7cd3474489d1
contaCorrenteId	
createdAt	2025-11-12 14:21:31.457
updatedAt	2025-11-12 14:21:31.457
fitId	
organizationId	2a5bb448-056b-4b87-b02f-fec691dd658d
goldAmount	30.9000
status	ATIVA
accountRecId	f916be58-ac82-4202-a4fc-2acf75c56465
goldPrice	595.00
linkedTransactionId	

### Problema: Venda paga em metal com status PAGO_PARCIALMENTE e AccountRec pendente

**Descrição:**
Ao receber um pedido em metal com pagamento total, o sistema gerou o crédito em `pure_metal_lots` corretamente e deixou o pedido para separação. Após a separação e vinculação do lote, ao confirmar a venda, o `AccountRec` foi para o status `PENDENTE` e a venda ficou como `PAGO_PARCIALMENTE`, mesmo o pagamento em metal tendo sido total.

**Detalhes:**
- A venda `a72b4c2b-21a9-4a61-97de-c98043a72bcd` (pedido #31571) foi confirmada com pagamento em metal.
- O `sale_adjustment` mostra `paymentReceivedBRL: 18385.50` e `paymentEquivalentGrams: 30.9000`, enquanto `saleExpectedGrams: 30.0000`.
- O `accountRec` `f916be58-ac82-4202-a4fc-2acf75c56465` tem `amount: 18385.50` e `amountPaid: 18385.50`, mas `received: false`.
- A `transacao` `7ce0948a-7a14-4f6d-a519-ce3406f4dd45` foi criada com `valor: 18385.50` e `goldAmount: 30.9000`.

**Causa Provável:**
A lógica de `isFullyPaid` no `ConfirmSaleUseCase` ou `PayAccountsRecWithMetalUseCase` pode estar com um erro de arredondamento ou comparação de valores, fazendo com que o sistema não reconheça o pagamento como total, mesmo quando os valores são equivalentes. A diferença entre `paymentEquivalentGrams` (30.9000) e `saleExpectedGrams` (30.0000) pode estar causando essa discrepância, levando a um status de `PAGO_PARCIALMENTE` e `received: false` no `AccountRec`.

**Impacto:**
- Vendas totalmente pagas aparecem como pendentes, causando confusão e retrabalho.
- O status da venda (`PAGO_PARCIALMENTE`) não reflete a realidade do pagamento.

**Ações Necessárias:**
1.  Revisar a lógica de comparação de valores (BRL e gramas de ouro) nos `ConfirmSaleUseCase` e `PayAccountsRecWithMetalUseCase` para garantir que pequenas diferenças de arredondamento não causem o status `PAGO_PARCIALMENTE` indevidamente.
2.  Garantir que o `AccountRec.received` seja `true` quando o pagamento for total.
3.  Verificar se o status da venda é atualizado para `FINALIZADO` (ou o status apropriado) após o pagamento total, respeitando a flag `doNotUpdateSaleStatus`.