
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const metalAccountId = 'cc32ed37-68cb-4a52-81cf-8e79f356c07a'; // Conta AG Techgalvano
  const grams = -2477.34; // Valor negativo para débito
  const date = new Date('2026-01-07T12:00:00Z');
  const description = 'Pagamento em Metal (Lote de Prata)';
  
  // O ID do movimento no lote de metal puro pode servir como sourceId para rastreabilidade
  // Mas como não temos o ID do movimento aqui fácil sem outra query, vou deixar genérico ou buscar se precisar.
  // Pelo diagnóstico anterior, sabemos que existe o lote. 
  
  console.log(`\n🛠️ Corrigindo saldo da conta: ${metalAccountId}`);
  console.log(`   Inserindo débito de: ${grams}g em ${date.toISOString()}`);

  const entry = await prisma.metalAccountEntry.create({
    data: {
      metalAccountId: metalAccountId,
      grams: grams,
      date: date,
      description: description,
      type: 'METAL_PAYMENT' // Tipo adequado para pagamento em metal
    }
  });

  console.log("✅ Registro criado com sucesso:");
  console.log(entry);
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
