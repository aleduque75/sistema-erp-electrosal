import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class ExportSeedDataUseCase {
  constructor(private prisma: PrismaService) {}

  async execute(): Promise<{ message: string; filePath: string }> {
    try {
      const contasCorrentes = await this.prisma.contaCorrente.findMany();
      const contasContabeis = await this.prisma.contaContabil.findMany();
      const transacoes = await this.prisma.transacao.findMany();

      const seedData = {
        contasCorrentes,
        contasContabeis,
        transacoes,
      };

      // O caminho deve ser relativo à raiz do projeto ou um caminho absoluto bem definido
      // Para fins de desenvolvimento, vamos usar o diretório json-imports
      const outputPath = path.join(process.cwd(), '..' , '..' , 'json-imports', 'seed_data.json');
      fs.writeFileSync(outputPath, JSON.stringify(seedData, null, 2));

      return { message: 'Dados de seed exportados com sucesso!', filePath: outputPath };
    } catch (error) {
      throw new Error('Falha ao exportar dados de seed.');
    }
  }
}
