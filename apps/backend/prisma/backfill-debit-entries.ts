import { PrismaClient, TipoTransacaoPrisma } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting backfill of debit entries...');

  // Transaction 1: Client Payment
  const client1Id = 'a032893d-a657-491f-9e4f-8b6808ec24e1';
  const transacao1DebitId = 'e71bba75-3793-4d5e-bf04-4c755286e2c2';
  const transacao1CreditId = '7f655613-dcd8-430b-95d7-675d65a4ba15';
  const grams1 = new Decimal(1800.0000);
  const correctValue1 = new Decimal(13140.00);

  // Transaction 2: Sale 31529, Payment 1
  const client2Id = 'e244f89d-f488-49c5-91ce-24df462e01a2';
  const saleId = '7265cb21-a19e-4afd-9f00-589bf7d79e13';
  const transacao2Id = 'ef451185-cf5a-4e08-932d-406f38bb88c9';
  const grams2 = new Decimal(18.5196);

  // Transaction 3: Sale 31529, Payment 2
  const transacao3Id = '27e1e126-8ebc-4a19-95f6-63cac32b8ea1';
  const grams3 = new Decimal(15.5304);

  await prisma.$transaction(async (tx) => {
    // Fix Transaction 1
    const metalAccount1 = await tx.metalAccount.findFirst({ where: { personId: client1Id } });
    if (metalAccount1) {
      await tx.metalAccountEntry.create({
        data: {
          metalAccountId: metalAccount1.id,
          type: TipoTransacaoPrisma.DEBITO,
          grams: grams1,
          date: new Date('2025-02-20T03:00:00.000Z'),
          sourceId: transacao1DebitId,
          description: 'Pagamento em metal ao cliente a032893d-a657-491f-9e4f-8b6808ec24e1 - Credito do cliente Recuperação de Prata 2526 -1800 cliente',
        },
      });
      await tx.transacao.update({ where: { id: transacao1DebitId }, data: { valor: correctValue1 } });
      await tx.transacao.update({ where: { id: transacao1CreditId }, data: { valor: correctValue1 } });
      console.log('Fixed transaction 1.');
    } else {
      console.log('Could not find metal account for transaction 1.');
    }

    // Fix Transaction 2
    const metalAccount2 = await tx.metalAccount.findFirst({ where: { personId: client2Id } });
    if (metalAccount2) {
      await tx.metalAccountEntry.create({
        data: {
          metalAccountId: metalAccount2.id,
          type: TipoTransacaoPrisma.DEBITO,
          grams: grams2,
          date: new Date('2025-11-03T21:13:28.940Z'),
          sourceId: saleId,
          description: 'Pagamento da Venda #31529 com crédito de metal',
        },
      });
      console.log('Fixed transaction 2.');
    } else {
      console.log('Could not find metal account for transaction 2.');
    }

    // Fix Transaction 3
    if (metalAccount2) {
      await tx.metalAccountEntry.create({
        data: {
          metalAccountId: metalAccount2.id,
          type: TipoTransacaoPrisma.DEBITO,
          grams: grams3,
          date: new Date('2025-11-04T11:15:36.403Z'),
          sourceId: saleId,
          description: 'Pagamento da Venda #31529 com crédito de metal',
        },
      });
      console.log('Fixed transaction 3.');
    } else {
      console.log('Could not find metal account for transaction 3.');
    }
  });

  console.log('Backfill of debit entries finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });