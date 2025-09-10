import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as fs from 'fs/promises';
import * as path from 'path';
import { PessoaType } from '@prisma/client';

@Injectable()
export class JsonImportsService {
  private readonly logger = new Logger(JsonImportsService.name);

  constructor(private prisma: PrismaService) {}

  async importEmpresas(organizationId: string) {
    const filePath = path.join(process.cwd(), '..', '..', 'json-imports', 'Empresa.json');
    this.logger.log(`Lendo arquivo de: ${filePath}`);

    try {
      const fileContent = await fs.readFile(filePath, 'utf-8');
      const empresas = JSON.parse(fileContent);
      this.logger.log(`Encontradas ${empresas.length} empresas no arquivo.`);

      let createdCount = 0;
      let skippedCount = 0;

      for (const empresa of empresas) {
        const externalId = empresa['unique id'];
        if (!externalId) {
          this.logger.warn('Empresa sem "unique id", pulando:', empresa.nome);
          skippedCount++;
          continue;
        }

        const existingPessoa = await this.prisma.pessoa.findUnique({
          where: { externalId },
        });

        if (existingPessoa) {
          skippedCount++;
          continue;
        }

        // Limpa e determina o tipo de documento
        const cpfCnpj = (empresa.cpfCnpj || '').replace(/\D/g, '');
        let type: PessoaType = PessoaType.JURIDICA;
        let cpf = null;
        let cnpj = null;

        if (cpfCnpj.length === 11) {
          type = PessoaType.FISICA;
          cpf = cpfCnpj;
        } else if (cpfCnpj.length === 14) {
          cnpj = cpfCnpj;
        }

        const newPessoa = await this.prisma.pessoa.create({
          data: {
            organizationId,
            externalId,
            name: empresa.nome || empresa.nomeFantasia || 'Nome não informado',
            email: empresa.email || null,
            phone: empresa.fone || null,
            type,
            cpf,
            cnpj,
            cep: (empresa.cep || '').replace(/\D/g, '') || null,
            logradouro: empresa.logradouro || null,
            numero: empresa.logradouroNumero || null,
            complemento: empresa.logradouroComplemento || null,
            bairro: empresa.bairro || null,
            cidade: empresa.cidade || null,
            uf: empresa.estado || null,
          },
        });

        // Adiciona os papéis
        const roles = (empresa.tagUsuario || '').split(',').map(r => r.trim());
        if (roles.includes('Cliente')) {
            await this.prisma.client.create({ data: { pessoaId: newPessoa.id, organizationId } });
        }
        if (roles.includes('Fornecedor')) {
            await this.prisma.fornecedor.create({ data: { pessoaId: newPessoa.id, organizationId } });
            this.logger.log(`Fornecedor ${newPessoa.name} (${newPessoa.id}) criado para a organização ${organizationId}`);
        }

        createdCount++;
      }

      const summary = `Importação concluída. Criados: ${createdCount}, Ignorados (já existiam): ${skippedCount}`;
      this.logger.log(summary);
      return { message: summary };
    } catch (error) {
      this.logger.error('Erro ao importar empresas do JSON:', error);
      throw new Error('Falha ao ler ou processar o arquivo Empresa.json');
    }
  }
}
