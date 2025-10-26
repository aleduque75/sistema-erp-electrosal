


#Vendas a prazo para resolver, 
Vendas ao realizar uma venda a prazo, ele cria as parcelas em sale_installment, e lanço uma duplicata em accountRec, tem que ter um jeito de mostrar em accountRec as parcelar para pode receber a parcela.
Vendas com recebimento em metal, ele esta lançando em pure_metal_lots corretamente , só que lança tambem em metal_account_entries não deveria.

TESTE VENDA 1/28 DAIS

cria a venda status atual pendente

SALE
id	71fb5231-2cf1-4ed7-a0bb-a6359b5e7e32
orderNumber	31728
totalAmount	14952.00
feeAmount	0.00
netAmount	14952.00
paymentMethod	A_PRAZO
createdAt	2025-10-26 12:18:59.165
updatedAt	2025-10-26 12:18:59.165
organizationId	2a5bb448-056b-4b87-b02f-fec691dd658d
paymentTermId	264ff14d-c67f-4d39-af69-2821ec042559
pessoaId	c808e676-6e26-44aa-a676-c4c606b4711d
goldPrice	712.00
goldValue	21.0000
totalCost	0.00
commissionAmount	0.00
commissionDetails	[{"productId": "560168c3-ae76-4227-8b51-598ecafe6587", "productName": "El Sal 68%", "productGroupId": {"value": "fd0ef974-a1a5-4d15-a168-a461a8856b8c"}, "productGroupName": "Aurocianeto 68%"}]
externalId	
status	PENDENTE
shippingCost	0.00

SALE_INSTALLMENT

id	44c33645-25b7-4fbd-bc5e-6b4f263d5024
saleId	71fb5231-2cf1-4ed7-a0bb-a6359b5e7e32
amount	7476.000000000000840000000000000000
dueDate	2025-10-27 12:18:59.165
paidAt	
createdAt	2025-10-26 12:18:59.176
updatedAt	2025-10-26 12:18:59.176
installmentNumber	1
status	PENDING
accountRecId	

id	ff3c88e3-567b-4c8c-b694-f5403cde4f3b
saleId	71fb5231-2cf1-4ed7-a0bb-a6359b5e7e32
amount	7476.000000000000000000000000000000
dueDate	2025-11-23 12:18:59.165
paidAt	
createdAt	2025-10-26 12:18:59.176
updatedAt	2025-10-26 12:18:59.176
installmentNumber	2
status	PENDING
accountRecId	

SALEITEM

id	381757fe-1222-4ac5-b689-3488b37370b5
saleId	71fb5231-2cf1-4ed7-a0bb-a6359b5e7e32
productId	560168c3-ae76-4227-8b51-598ecafe6587
quantity	29.4
price	508.57
createdAt	2025-10-26 12:18:59.165
updatedAt	2025-10-26 12:18:59.165
costPriceAtSale	0.00
inventoryLotId	1b45e781-b2da-454b-bad4-139943fad5db
externalId	

AO CONFIRMAR A VENDA STATUS FINALIZADO

id	8d90f1e4-4227-41c4-83f2-5b2515c62b5a
saleId	71fb5231-2cf1-4ed7-a0bb-a6359b5e7e32
description	Receber de FAFA BANHOS DE RODIO (a prazo) venda #31728
amount	14952.00
dueDate	2025-11-23 12:18:59.165
received	false
receivedAt	
createdAt	2025-10-26 12:24:23.336
updatedAt	2025-10-26 12:24:23.336
contaCorrenteId	
organizationId	2a5bb448-056b-4b87-b02f-fec691dd658d
transacaoId	
externalId	
amountPaid	0.00
goldAmount	21.0000
goldAmountPaid	0.0000


RECEBI UMA PARCELA EM CAIXA ITAU

id	8d90f1e4-4227-41c4-83f2-5b2515c62b5a
saleId	71fb5231-2cf1-4ed7-a0bb-a6359b5e7e32
description	Receber de FAFA BANHOS DE RODIO (a prazo) venda #31728
amount	14952.00
dueDate	2025-11-23 12:18:59.165
received	false
receivedAt	
createdAt	2025-10-26 12:24:23.336
updatedAt	2025-10-26 12:26:13.538
contaCorrenteId	
organizationId	2a5bb448-056b-4b87-b02f-fec691dd658d
transacaoId	
externalId	
amountPaid	7476.00
goldAmount	21.0000
goldAmountPaid	10.5000 - coloca como o valor recebido 10,50 que esta certo

SALE ADJUSTMANET

id	c71aef2e-fd7a-4a6d-8adf-817eac08fa00
saleId	71fb5231-2cf1-4ed7-a0bb-a6359b5e7e32
organizationId	2a5bb448-056b-4b87-b02f-fec691dd658d
paymentReceivedBRL	0.00
paymentQuotation	
paymentEquivalentGrams	0.0000
saleExpectedGrams	
grossDiscrepancyGrams	
costsInBRL	0.00
costsInGrams	
netDiscrepancyGrams	
createdAt	2025-10-26 12:24:23.348
updatedAt	2025-10-26 12:26:13.548
grossProfitBRL	0.00
netProfitBRL	0.00
otherCostsBRL	0.00
totalCostBRL	0.00

aqui deveriua ter o valor de quantidade 20 gr e recebido 10,50 e o lucro com 9,50 gr negativo, porque na pratica temos uma parcela em aberto seria -9,50 e 10,50 a receber contabilmente falando

TRANSACOES 

id	328c7c1a-d7c1-48fc-9694-f5d7b6f45f42
tipo	CREDITO
valor	7476.00
moeda	BRL
descricao	Recebimento (FAFA BANHOS DE RODIO) - p-01/02 (Venda #31728)
dataHora	2025-10-26 00:00:00
contaContabilId	19926dfb-4cf8-404e-b658-0beac3de4201 (venda de produtos, correto)
contaCorrenteId	15343932-e645-4cf7-ad6a-c24ae1f2cbe0
createdAt	2025-10-26 12:26:13.534
updatedAt	2025-10-26 12:26:13.534
fitId	
organizationId	2a5bb448-056b-4b87-b02f-fec691dd658d
goldAmount	10.5000
status	ATIVA
accountRecId	8d90f1e4-4227-41c4-83f2-5b2515c62b5a
goldPrice	712.00

RECEBI DUAS PARCELAS
o a receber elas não aparecem mais que é o correto, ok

SALE ADJUSTMENT
id	c71aef2e-fd7a-4a6d-8adf-817eac08fa00
saleId	71fb5231-2cf1-4ed7-a0bb-a6359b5e7e32
organizationId	2a5bb448-056b-4b87-b02f-fec691dd658d
paymentReceivedBRL	7476.00
paymentQuotation	712.00
paymentEquivalentGrams	10.5000
saleExpectedGrams	20.0000
grossDiscrepancyGrams	-9.5000
costsInBRL	0.00
costsInGrams	0.0000
netDiscrepancyGrams	-9.5000
createdAt	2025-10-26 12:24:23.348
updatedAt	2025-10-26 12:31:47.592
grossProfitBRL	7476.00
netProfitBRL	7476.00
otherCostsBRL	0.00
totalCostBRL	0.00

fica negativo, teria que ter o revebimento de 21 gr , ai o lucro ficaria de 1gr

o ACCOUNTREC
id	8d90f1e4-4227-41c4-83f2-5b2515c62b5a
saleId	71fb5231-2cf1-4ed7-a0bb-a6359b5e7e32
description	Receber de FAFA BANHOS DE RODIO (a prazo) venda #31728
amount	14952.00
dueDate	2025-11-23 12:18:59.165
received	true
receivedAt	2025-10-26 00:00:00
createdAt	2025-10-26 12:24:23.336
updatedAt	2025-10-26 12:31:47.58
contaCorrenteId	
organizationId	2a5bb448-056b-4b87-b02f-fec691dd658d
transacaoId	
externalId	
amountPaid	14952.00
goldAmount	21.0000
goldAmountPaid	21.0000

correto fica com o goldAmountPaid	21.0000 e quita o pedido 

TRANSACOES 

id	328c7c1a-d7c1-48fc-9694-f5d7b6f45f42
tipo	CREDITO
valor	7476.00
moeda	BRL
descricao	Recebimento (FAFA BANHOS DE RODIO) - p-01/02 (Venda #31728)
dataHora	2025-10-26 00:00:00
contaContabilId	19926dfb-4cf8-404e-b658-0beac3de4201
contaCorrenteId	15343932-e645-4cf7-ad6a-c24ae1f2cbe0
createdAt	2025-10-26 12:26:13.534
updatedAt	2025-10-26 12:26:13.534
fitId	
organizationId	2a5bb448-056b-4b87-b02f-fec691dd658d
goldAmount	10.5000
status	ATIVA
accountRecId	8d90f1e4-4227-41c4-83f2-5b2515c62b5a
goldPrice	712.00

id	a7e1d86a-a69d-49e9-bb96-90fbf2b8679f
tipo	CREDITO
valor	7476.00
moeda	BRL
descricao	Recebimento (FAFA BANHOS DE RODIO) - p-02/02 (Venda #31728)
dataHora	2025-10-26 00:00:00
contaContabilId	19926dfb-4cf8-404e-b658-0beac3de4201
contaCorrenteId	de7fe87d-af02-44eb-b979-734c05d86493
createdAt	2025-10-26 12:31:47.573
updatedAt	2025-10-26 12:31:47.573
fitId	
organizationId	2a5bb448-056b-4b87-b02f-fec691dd658d
goldAmount	10.5000
status	ATIVA
accountRecId	8d90f1e4-4227-41c4-83f2-5b2515c62b5a
goldPrice	712.00

lançou as duas parcelas correto

outros testes e continua errado


##
fiz uma venda para 28 dias e o lucro continua errado , uma de prata 54% que o grupo é COST BASED
sale esta correto
paymentEquivalentGrams	0.0000 veio zerado deveria ter pego o custo do lote que foi de 4800 / 712 = 6,74 porque é COST BASED
ai o lucro seria 9,12 (6500 / 712) - 6,74 = 2,38 de lucro

fiz uma venda 1/28 de Sal 68 que tem o grupo de porduto e é um grupro de reação e é QUANTITY BASED
sale_adjustment
d	21cb36a1-3f52-4e9d-b1f4-16966f3b3cab
saleId	e45c6d39-1646-44b6-a84b-b31847ba9606
organizationId	2a5bb448-056b-4b87-b02f-fec691dd658d
paymentReceivedBRL	7476.00
paymentQuotation	712.00
paymentEquivalentGrams	10.5000 - aqui como o pagamento das 2 parcxelas foram feito teria de ser 21 gr
saleExpectedGrams	21.0000 - aqui estou confuso , não seria 20 a quantidade do pedido ?
grossDiscrepancyGrams	-10.5000 - aqui o lucro seria de 1 gr 
costsInBRL	0.00
costsInGrams	0.0000
netDiscrepancyGrams	-10.5000
createdAt	2025-10-26 12:49:17.065
updatedAt	2025-10-26 12:52:39.004
grossProfitBRL	7476.00
netProfitBRL	7476.00
otherCostsBRL	0.00
totalCostBRL	0.00

##

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