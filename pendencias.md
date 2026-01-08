na transação de uma dvenda de cianeto de prata, ele se perdeu em sale e sale Adjustment
no caso teria que pegar o total amout esta certo 5400,00 ma o custo do lote o sale item tem um custo unitario de R$ 5,40 e o Lote de R$ 4,70

esse calculo teria de ser feito quando o produto não é de reação de el sal 68%, que ganho em cima de uma mão de obra né no restante, poderia pegar do inventory_lots de  costPrice, mas ele esta bagunçado , tem valores da prata em kg  e alguns em grama, qual seria o correto, posso arrumar menualmente isso 

sale
id	782cefe8-2b84-4a26-967c-e221427b94eb
orderNumber	31702
totalAmount	5400.00
feeAmount	0.00
netAmount	10800.00
paymentMethod	A_PRAZO
createdAt	2025-09-26 03:00:00
updatedAt	2026-01-08 20:21:43.074
organizationId	2a5bb448-056b-4b87-b02f-fec691dd658d
paymentTermId	2f438303-1c40-44f0-a4e4-933e765a51f1
pessoaId	070a9084-05dd-4305-958b-5bd4d84ea944
goldPrice	708.00
goldValue	711.4625
totalCost	382320.93
commissionAmount	0.00
commissionDetails	[{"productId": "9ddfe133-30f7-4392-aa3c-fbdfe92d68e6", "productName": "Ag CN 54%", "productGroupId": {"value": "0192f300-da4c-48a4-91d4-4438857d656c"}, "productGroupName": "Sal de Prata 54%"}]
externalId	
status	FINALIZADO
shippingCost	0.00
readyForPayment	false
observation	Foi pagamento em Dolar 1000 usd, a 5,40 foi para Bsa dia 20/10/2025

saleAdjustment

id	ba0b9c67-342b-4ce3-b3d1-16f0ea203154
saleId	782cefe8-2b84-4a26-967c-e221427b94eb
organizationId	2a5bb448-056b-4b87-b02f-fec691dd658d
paymentReceivedBRL	10800.00
paymentQuotation	708.00
paymentEquivalentGrams	15.2542
saleExpectedGrams	540.0000
grossDiscrepancyGrams	-524.7458
costsInBRL	0.00
costsInGrams	0.0000
netDiscrepancyGrams	-524.7458
createdAt	2026-01-08 20:16:08.698
updatedAt	2026-01-08 20:21:43.072
grossProfitBRL	-371520.93
netProfitBRL	-371520.93
otherCostsBRL	0.00
totalCostBRL	382320.93
laborCostBRL	0.00
laborCostGrams	0.0000

saleItem
id	2368dcb9-35ef-491d-87ac-7b52f14e59ac
saleId	782cefe8-2b84-4a26-967c-e221427b94eb
productId	9ddfe133-30f7-4392-aa3c-fbdfe92d68e6
quantity	1000
price	5.40
createdAt	2026-01-08 20:04:14.259
updatedAt	2026-01-08 20:04:14.259
costPriceAtSale	4.70
externalId	
laborPercentage	

saleItem_Lots
id	4fab8b28-1180-44f8-a846-fa7e88d116e8
saleItemId	2368dcb9-35ef-491d-87ac-7b52f14e59ac
inventoryLotId	82b26e98-5670-4fda-96b0-5cdd9e0f23df
quantity	1000
createdAt	2026-01-08 20:04:14.259
updatedAt	2026-01-08 20:04:14.259

inventory_lots
id	82b26e98-5670-4fda-96b0-5cdd9e0f23df
organizationId	2a5bb448-056b-4b87-b02f-fec691dd658d
productId	9ddfe133-30f7-4392-aa3c-fbdfe92d68e6
batchNumber	250925
costPrice	4.70
quantity	1000
remainingQuantity	0
sourceType	PURCHASE_ORDER
sourceId	685e738d-26f3-4a22-a706-150586f66f7b
notes	
receivedDate	2025-09-25 03:00:00
createdAt	2026-01-08 19:53:10.862
updatedAt	2026-01-08 20:04:14.27


accountRec
id	1de2d8d7-d870-4587-ae25-4bef51af85ba
saleId	782cefe8-2b84-4a26-967c-e221427b94eb
description	Receber de ARTEGAL (a prazo) venda #31702
amount	5400.00
dueDate	2025-09-27 03:00:00
received	false
receivedAt	
createdAt	2026-01-08 20:16:08.703
updatedAt	2026-01-08 20:21:43.057
contaCorrenteId	
organizationId	2a5bb448-056b-4b87-b02f-fec691dd658d
transacaoId	
externalId	
amountPaid	5400.00
goldAmount	711.4625
goldAmountPaid	7.6271
doNotUpdateSaleStatus	false

transações
id	52367a28-2bc8-4bb4-9cc2-d1ffa44b62b4
tipo	CREDITO
valor	5400.00
moeda	BRL
descricao	Recebimento Ref. Receber de ARTEGAL (a prazo) venda #31702
dataHora	2025-10-20 00:00:00
contaContabilId	4d13e160-e347-462b-8d3b-fe94ea20beb1
contaCorrenteId	ad06430a-88c2-41c7-9236-6dea0598bd7d
createdAt	2026-01-08 20:21:43.054
updatedAt	2026-01-08 20:21:43.054
fitId	
organizationId	2a5bb448-056b-4b87-b02f-fec691dd658d
goldAmount	7.6271
status	ATIVA
accountRecId	1de2d8d7-d870-4587-ae25-4bef51af85ba
goldPrice	
linkedTransactionId	
fornecedorId	




















