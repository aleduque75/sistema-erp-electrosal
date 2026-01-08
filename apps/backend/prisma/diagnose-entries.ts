
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const nomeCliente = process.argv[2]; // Pega o nome do argumento

  if (!nomeCliente) {
    console.log("Por favor, forneça o nome do cliente entre aspas. Ex: ts-node debug.ts \"Nome do Cliente\"");
    return;
  }

  console.log(`\n🔍 Buscando cliente: "${nomeCliente}"...`);

  const pessoas = await prisma.pessoa.findMany({
    where: {
      name: { contains: nomeCliente, mode: 'insensitive' }
    }
  });

  if (pessoas.length === 0) {
    console.log("❌ Nenhum cliente encontrado.");
    return;
  }

  for (const pessoa of pessoas) {
    console.log(`\n👤 Cliente: ${pessoa.name} (ID: ${pessoa.id})`);

    const metalAccounts = await prisma.metalAccount.findMany({
      where: { personId: pessoa.id },
      include: {
        entries: {
          orderBy: { date: 'desc' }
        }
      }
    });

    if (metalAccounts.length === 0) {
      console.log("   ⚠️ Nenhuma conta de metal encontrada.");
      continue;
    }

    for (const account of metalAccounts) {
      console.log(`   🏦 Conta de Metal: ${account.type} (ID: ${account.id})`);
      console.log(`      Saldo Total (Calculado): ${account.entries.reduce((acc, e) => acc + Number(e.grams), 0).toFixed(4)}g`);
      console.log("      📜 Últimos Lançamentos:");
      
      if (account.entries.length === 0) {
        console.log("         (Nenhum lançamento)");
      }

      account.entries.forEach(entry => {
        const grams = Number(entry.grams);
        const icon = grams < 0 ? '🔴' : '🟢';
        console.log(`         ${icon} [${entry.date.toISOString().split('T')[0]}] ${grams.toFixed(4)}g | Tipo: ${entry.type} | ID: ${entry.id} | Desc: ${entry.description}`);
      });
    }
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
