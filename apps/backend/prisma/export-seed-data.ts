import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Iniciando exportação dos dados de seed...');

    const contasCorrentes = await prisma.contaCorrente.findMany();
    const contasContabeis = await prisma.contaContabil.findMany();
    const transacoes = await prisma.transacao.findMany();

    const seedData = {
      contasCorrentes,
      contasContabeis,
      transacoes,
    };

    const outputPath = path.join(__dirname, '..' , '..' , 'json-imports', 'seed_data.json');
    fs.writeFileSync(outputPath, JSON.stringify(seedData, null, 2));

    console.log(`Dados de seed exportados com sucesso para: ${outputPath}`);
  } catch (error) {
    console.error('Erro ao exportar dados de seed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();