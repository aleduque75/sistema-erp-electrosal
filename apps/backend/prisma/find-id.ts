
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const targetId = process.argv[2];

  if (!targetId) {
    console.log("Forneça um ID.");
    return;
  }

  console.log(`\n🔎 Investigando ID: ${targetId}\n`);

  // 1. Checar se é MetalCredit
  const metalCredit = await prisma.metalCredit.findUnique({
    where: { id: targetId },
    include: { client: true }
  });

  if (metalCredit) {
    console.log("✅ É um METAL CREDIT (Crédito Original):");
    console.log(metalCredit);
    
    // Buscar conta associada
    const metalAccount = await prisma.metalAccount.findFirst({
        where: { personId: metalCredit.clientId, type: metalCredit.metalType }
    });

    if (metalAccount) {
        console.log(`\n   🏦 Conta de Metal associada: ${metalAccount.id}`);
        // Buscar entries dessa conta
        const entries = await prisma.metalAccountEntry.findMany({
            where: { metalAccountId: metalAccount.id },
            orderBy: { date: 'desc' }
        });
        console.log(`   📜 Lançamentos na conta (${entries.length}):`);
        entries.forEach(e => console.log(`      [${e.date.toISOString().split('T')[0]}] ${e.grams}g (${e.type}) - ID: ${e.id}`));
    } else {
        console.log("\n   ⚠️ Nenhuma Conta de Metal encontrada para este cliente/tipo.");
    }
    return;
  }

  // 2. Checar se é MetalAccountEntry
  const entry = await prisma.metalAccountEntry.findUnique({
    where: { id: targetId },
    include: { metalAccount: true }
  });

  if (entry) {
    console.log("✅ É uma METAL ACCOUNT ENTRY (Lançamento/Movimentação):");
    console.log(entry);
    console.log(`\n   🏦 Pertence à Conta: ${entry.metalAccountId}`);
    console.log(`   👤 Cliente ID da Conta: ${entry.metalAccount.personId}`);
    return;
  }

  // 3. Checar se é Pessoa
  const pessoa = await prisma.pessoa.findUnique({
    where: { id: targetId }
  });

  if (pessoa) {
    console.log("✅ É uma PESSOA (Cliente):");
    console.log(pessoa);
    return;
  }

  console.log("❌ ID não encontrado nas tabelas MetalCredit, MetalAccountEntry ou Pessoa.");
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
