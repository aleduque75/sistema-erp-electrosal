import { PrismaClient, TipoTransacaoPrisma, TipoContaContabilPrisma, TipoMetal, PureMetalLotStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

const prisma = new PrismaClient();

interface CorrectionParams {
  saleId: string;
  organizationId: string;
  metalType: TipoMetal;
  gramsReceived: number;
  purity: number;
  quotationUsed: number; // Quotation at the time of actual metal receipt
  originalPaymentDate: Date; // Original date when metal was received
  description?: string;
}

async function correctLegacyMetalSale(params: CorrectionParams) {
  const { saleId, organizationId, metalType, gramsReceived, purity, quotationUsed, originalPaymentDate, description } = params;

  console.log(`[CORRECTION] Iniciando correção para a venda ID: ${saleId}`);

  await prisma.$transaction(async (tx) => {
    // 1. Find the Sale and its associated AccountRec
    const sale = await tx.sale.findUnique({
      where: { id: saleId, organizationId },
      include: {
        accountsRec: {
          include: {
            transacoes: true,
          },
        },
      },
    });

    if (!sale) {
      throw new Error(`Venda com ID ${saleId} não encontrada.`);
    }

    const primaryAccountRec = sale.accountsRec.find(ar => ar.saleId === saleId);

    if (!primaryAccountRec) {
      throw new Error(`Nenhuma conta a receber principal encontrada para a venda ID: ${saleId}.`);
    }

    // 2. Find the incorrect Transacao(s) linked to 'REAÇÃO SAL 68%' ContaCorrente
    const reactionAccount = await tx.contaCorrente.findFirst({
      where: { nome: 'REAÇÃO SAL 68%', organizationId },
    });

    if (!reactionAccount) {
      console.warn(`[CORRECTION] Conta Corrente 'REAÇÃO SAL 68%' não encontrada. Pulando reversão de transações.`);
    }

    const incorrectTransactions = reactionAccount
      ? primaryAccountRec.transacoes.filter(t => t.contaCorrenteId === reactionAccount.id)
      : [];

    // 3. Find the 'Perda por Variação de Cotação' ContaContabil (for potential BRL adjustments)
    const lossAccount = await tx.contaContabil.findFirst({
      where: { nome: 'Perda por Variação de Cotação', tipo: TipoContaContabilPrisma.DESPESA, organizationId },
    });

    if (!lossAccount) {
      console.warn(`[CORRECTION] Conta Contábil 'Perda por Variação de Cotação' não encontrada. Ajustes de BRL podem não ser precisos.`);
    }

    // 4. Reverse incorrect transactions (if found)
    let totalReversedBRL = new Decimal(0);
    for (const incTrans of incorrectTransactions) {
      await tx.transacao.create({
        data: {
          tipo: incTrans.tipo === TipoTransacaoPrisma.CREDITO ? TipoTransacaoPrisma.DEBITO : TipoTransacaoPrisma.CREDITO, // Reverse type
          valor: incTrans.valor,
          moeda: incTrans.moeda,
          descricao: `REVERSÃO: ${incTrans.descricao || 'Transação incorreta'} (Venda ${sale.orderNumber}) - Correção Legado`,
          dataHora: new Date(), // Date of correction
          contaContabilId: incTrans.contaContabilId, // Use original account for reversal
          contaCorrenteId: incTrans.contaCorrenteId, // Use original account for reversal
          organizationId,
          accountRecId: primaryAccountRec.id,
          goldAmount: incTrans.goldAmount ? incTrans.goldAmount.negated() : new Decimal(0),
          goldPrice: incTrans.goldPrice,
        },
      });
      totalReversedBRL = totalReversedBRL.plus(incTrans.valor);
      console.log(`[CORRECTION] Transação ${incTrans.id} revertida.`);
    }

    // 5. Create a new pure_metal_lots entry
    const newPureMetalLot = await tx.pure_metal_lots.create({
      data: {
        organizationId,
        sourceType: 'LEGACY_SALE_CORRECTION',
        sourceId: saleId,
        metalType,
        initialGrams: gramsReceived,
        remainingGrams: gramsReceived,
        purity: purity,
        status: PureMetalLotStatus.AVAILABLE,
        entryDate: originalPaymentDate, // Use original payment date for inventory tracking
        notes: description || `Lote de metal para correção da venda legado ${sale.orderNumber}`,
        saleId: sale.id,
      },
    });
    console.log(`[CORRECTION] Novo lote de metal puro criado: ${newPureMetalLot.id}`);

    // 6. Create a new Transacao for the metal receipt
    // This assumes there's a generic 'Metal Received' ContaContabil or a specific MetalAccount for the organization
    const metalReceiptContaContabil = await tx.contaContabil.findFirst({
      where: { nome: 'Recebimento de Metal', tipo: TipoContaContabilPrisma.RECEITA, organizationId }, // Placeholder name
    });

    if (!metalReceiptContaContabil) {
      console.warn(`[CORRECTION] Conta Contábil 'Recebimento de Metal' não encontrada. Criando transação de metal sem conta contábil específica.`);
    }

    await tx.transacao.create({
      data: {
        tipo: TipoTransacaoPrisma.CREDITO,
        valor: new Decimal(gramsReceived).times(new Decimal(quotationUsed)), // BRL equivalent at correction time
        moeda: 'BRL',
        descricao: `Recebimento de Metal (Correção Legado) - Venda ${sale.orderNumber}`,
        dataHora: new Date(), // Date of correction
        contaContabilId: metalReceiptContaContabil?.id || (await tx.contaContabil.findFirstOrThrow({ where: { organizationId, codigo: '4.1.1' } })).id, // Fallback to Venda de Produtos
        organizationId,
        accountRecId: primaryAccountRec.id,
        goldAmount: new Decimal(gramsReceived),
        goldPrice: new Decimal(quotationUsed),
      },
    });
    console.log(`[CORRECTION] Nova transação de recebimento de metal criada.`);

    // 7. Update AccountRec to reflect new state and potentially trigger recalculation
    // The CalculateSaleAdjustmentUseCase will be triggered by the next payment or manual trigger
    // For now, we ensure the AccountRec reflects the BRL value of the metal received
    const currentPaidBRL = primaryAccountRec.transacoes.reduce((sum, t) => sum.plus(t.valor), new Decimal(0));
    const newAmountPaidBRL = currentPaidBRL.minus(totalReversedBRL).plus(new Decimal(gramsReceived).times(new Decimal(quotationUsed)));

    await tx.accountRec.update({
      where: { id: primaryAccountRec.id },
      data: {
        amountPaid: newAmountPaidBRL,
        // received: true, // Let CalculateSaleAdjustmentUseCase handle final closure
        // receivedAt: new Date(),
      },
    },
    );
    console.log(`[CORRECTION] AccountRec ${primaryAccountRec.id} atualizado.`);

    // 8. Trigger CalculateSaleAdjustmentUseCase to finalize BRL balance and status
    // This needs to be done outside the transaction or explicitly called after commit
    // For a script, it's better to instruct the user to run it separately if needed
    console.log(`[CORRECTION] Correção para a venda ${saleId} concluída. Por favor, execute o CalculateSaleAdjustmentUseCase para esta venda para finalizar o ajuste de BRL.`);
  });

  console.log(`[CORRECTION] Processo de correção para a venda ID: ${saleId} finalizado.`);
}

// Exemplo de uso (substitua pelos valores reais)
(async () => {
  const organizationId = "2a5bb448-056b-4b87-b02f-fec691dd658d"; // Sua Organization ID

  console.log("Iniciando correções legadas...");

  // Pedido 31415 - Tecgalvano - Lote 1185
  await correctLegacyMetalSale({
    saleId: "f6d90f9c-d58e-4038-8357-7e0447b52ec2",
    organizationId: organizationId,
    metalType: TipoMetal.AU,
    gramsReceived: 30.90,
    purity: 1,
    quotationUsed: 504,
    originalPaymentDate: new Date("2025-04-02T10:11:00.000Z"),
    description: "Pedido 31415 - Tecgalvano - Lote 1185",
  });

  // Pedido 31495 - Cennabrass - Lote 1188
  await correctLegacyMetalSale({
    saleId: "a648ab73-c3b3-43b5-84b4-58a1a51e1756",
    organizationId: organizationId,
    metalType: TipoMetal.AU,
    gramsReceived: 34.69,
    purity: 1,
    quotationUsed: 570,
    originalPaymentDate: new Date("2025-04-14T00:00:00.000Z"),
    description: "Pedido 31495 - Cennabrass - Lote 1188",
  });

  // Pedido 31488 - Techgalvano - LOTE 1188
  await correctLegacyMetalSale({
    saleId: "1adfa5a0-c391-4b59-ba27-4c19f1243b3f",
    organizationId: organizationId,
    metalType: TipoMetal.AU,
    gramsReceived: 30.9,
    purity: 1,
    quotationUsed: 577,
    originalPaymentDate: new Date("2025-04-16T07:50:00.000Z"),
    description: "Pedido 31488 - Techgalvano - LOTE 1188",
  });

  // Pedido 31498 - CENNABRAS - LOTE 1188
  await correctLegacyMetalSale({
    saleId: "6c7ad478-9439-4dce-8662-63c63bfa6f9b",
    organizationId: organizationId,
    metalType: TipoMetal.AU,
    gramsReceived: 138.78,
    purity: 1,
    quotationUsed: 570,
    originalPaymentDate: new Date("2025-04-16T07:50:00.000Z"),
    description: "Pedido 31498 - CENNABRAS - LOTE 1188",
  });

  // Pedido 31512 - CENNABRAS - LOTE 1189
  await correctLegacyMetalSale({
    saleId: "0a499751-ebb5-4c87-a51c-301da07d4d61",
    organizationId: organizationId,
    metalType: TipoMetal.AU,
    gramsReceived: 34.70,
    purity: 1,
    quotationUsed: 595,
    originalPaymentDate: new Date("2025-04-24T00:00:00.000Z"),
    description: "Pedido 31512 - CENNABRAS - LOTE 1189",
  });

  // Pedido 31507 - CENNABRAS - LOTE 1189
  await correctLegacyMetalSale({
    saleId: "38c125dc-1ed1-4e5e-9b4e-14a5f59d811e",
    organizationId: organizationId,
    metalType: TipoMetal.AU,
    gramsReceived: 208.16,
    purity: 1,
    quotationUsed: 600,
    originalPaymentDate: new Date("2025-04-30T08:18:00.000Z"),
    description: "Pedido 31507 - CENNABRAS - LOTE 1189",
  });

  // Pedido 31526 - CENNABRAS - LOTE 1190
  await correctLegacyMetalSale({
    saleId: "c8bca9eb-b3c3-43b5-a1b7-be44c996b843",
    organizationId: organizationId,
    metalType: TipoMetal.AU,
    gramsReceived: 34.69,
    purity: 1,
    quotationUsed: 595,
    originalPaymentDate: new Date("2025-05-05T00:00:00.000Z"),
    description: "Pedido 31526 - CENNABRAS - LOTE 1190",
  });

  // Pedido 31521 -  Techgalvano - LOTE 1190
  await correctLegacyMetalSale({
    saleId: "d29311e5-12c0-4a73-961c-997c4089ae86",
    organizationId: organizationId,
    metalType: TipoMetal.AU,
    gramsReceived: 30.9,
    purity: 1,
    quotationUsed: 595,
    originalPaymentDate: new Date("2025-05-15T00:00:00.000Z"),
    description: "Pedido 31521 -  Techgalvano - LOTE 1190",
  });

  // Pedido 31531 -  CENNABRAS - LOTE 1190
  await correctLegacyMetalSale({
    saleId: "83e02e10-a620-49ed-a8f0-8f64c4d4dd51",
    organizationId: organizationId,
    metalType: TipoMetal.AU,
    gramsReceived: 138.78,
    purity: 1,
    quotationUsed: 595,
    originalPaymentDate: new Date("2025-05-21T08:32:00.000Z"),
    description: "Pedido 31531 -  CENNABRAS - LOTE 1190",
  });

  console.log("Todas as correções legadas foram agendadas para execução!");
})();

// Para executar este script:
// 1. Preencha os parâmetros no exemplo de uso.
// 2. Compile o backend: pnpm build --filter=backend
// 3. Execute o script: node dist/apps/backend/prisma/correct-legacy-metal-sales.js
