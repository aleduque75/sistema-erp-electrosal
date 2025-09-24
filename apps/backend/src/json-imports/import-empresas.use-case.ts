
import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';
import { PessoaType } from '@prisma/client';

interface OldEmpresaData {
  nome: string;
  nomeFantasia?: string;
  cpfCnpj?: string;
  email?: string;
  fone?: string;
  cep?: string;
  logradouro?: string;
  logradouroNumero?: string;
  logradouroComplemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  tagUsuario?: string; // Adicionado
  'unique id': string;
}

@Injectable()
export class ImportEmpresasUseCase {
  constructor(private prisma: PrismaService) {}

  async execute(organizationId: string, jsonDirectory: string): Promise<any> {
    const empresasFilePath = path.join(jsonDirectory, 'Empresa.json');

    if (!fs.existsSync(empresasFilePath)) {
      throw new BadRequestException('Arquivo Empresa.json não encontrado no diretório especificado.');
    }

    const oldEmpresas: OldEmpresaData[] = JSON.parse(fs.readFileSync(empresasFilePath, 'utf8'));

    const results: { name: string; status: string; reason?: string; newPessoaId?: string }[] = [];

    for (const oldEmpresa of oldEmpresas) {
      let importStatus: 'created' | 'updated' | 'failed' | 'created_with_null_email' = 'created';
      try {
        const cpfCnpj = oldEmpresa.cpfCnpj?.replace(/\D/g, '') || null;
        let type: PessoaType;
        let cpf: string | undefined;
        let cnpj: string | undefined;

        if (cpfCnpj) {
          if (cpfCnpj.length === 11) {
            type = PessoaType.FISICA;
            cpf = cpfCnpj;
          } else if (cpfCnpj.length === 14) {
            type = PessoaType.JURIDICA;
            cnpj = cpfCnpj;
          } else {
            type = PessoaType.JURIDICA; // Default to JURIDICA if length is not 11 or 14
          }
        } else {
          type = PessoaType.JURIDICA; // Default to JURIDICA if no cpfCnpj
        }

        console.log(`[DEBUG IMPORT-EMPRESAS] Processing: ${oldEmpresa.nome} (External ID: ${oldEmpresa['unique id']})`);

        let newPessoa;
        try {
          const existingPessoa = await this.prisma.pessoa.findUnique({
            where: { externalId: oldEmpresa['unique id'] },
          });

          const data = {
            organizationId,
            name: oldEmpresa.nomeFantasia || oldEmpresa.nome,
            razaoSocial: oldEmpresa.nome,
            type,
            cpf,
            cnpj,
            email: oldEmpresa.email || null,
            phone: oldEmpresa.fone,
            cep: oldEmpresa.cep,
            logradouro: oldEmpresa.logradouro,
            numero: oldEmpresa.logradouroNumero,
            complemento: oldEmpresa.logradouroComplemento,
            bairro: oldEmpresa.bairro,
            cidade: oldEmpresa.cidade,
            uf: oldEmpresa.estado,
            externalId: oldEmpresa['unique id'],
          };

          if (existingPessoa) {
            console.log(`[DEBUG IMPORT-EMPRESAS] Updating existing pessoa with ID: ${existingPessoa.id}`);
            newPessoa = await this.prisma.pessoa.update({
              where: { id: existingPessoa.id },
              data,
            });
            results.push({ name: oldEmpresa.nome, status: 'updated', newPessoaId: newPessoa.id });
          } else {
            console.log(`[DEBUG IMPORT-EMPRESAS] Creating new pessoa.`);
            newPessoa = await this.prisma.pessoa.create({
              data,
            });
            results.push({ name: oldEmpresa.nome, status: 'created', newPessoaId: newPessoa.id });
          }
        } catch (error: any) {
          console.error(`[ERROR IMPORT-EMPRESAS] Failed to upsert ${oldEmpresa.nome}:`, error);
          if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
            console.warn(`[WARN IMPORT-EMPRESAS] Duplicate email for ${oldEmpresa.nome}. Retrying with null email.`);
            try {
              const data = {
                organizationId,
                name: oldEmpresa.nomeFantasia || oldEmpresa.nome,
                razaoSocial: oldEmpresa.nome,
                type,
                cpf,
                cnpj,
                email: null, // Set email to null
                phone: oldEmpresa.fone,
                cep: oldEmpresa.cep,
                logradouro: oldEmpresa.logradouro,
                numero: oldEmpresa.logradouroNumero,
                complemento: oldEmpresa.logradouroComplemento,
                bairro: oldEmpresa.bairro,
                cidade: oldEmpresa.cidade,
                uf: oldEmpresa.estado,
                externalId: oldEmpresa['unique id'],
              };
              newPessoa = await this.prisma.pessoa.create({ data });
              results.push({ name: oldEmpresa.nome, status: 'created_with_null_email', newPessoaId: newPessoa.id });
            } catch (retryError) {
              console.error(`[ERROR IMPORT-EMPRESAS] Failed to create ${oldEmpresa.nome} even with null email:`, retryError);
              results.push({ name: oldEmpresa.nome, status: 'failed', reason: retryError.message });
            }
          } else {
            results.push({ name: oldEmpresa.nome, status: 'failed', reason: error.message });
          }
          continue; // Continue to the next empresa
        }

        // Criar papéis (Cliente, Fornecedor, Funcionário) com base em tagUsuario
        const tags = oldEmpresa.tagUsuario?.split(',').map(tag => tag.trim()) || [];

        if (tags.includes('Cliente')) {
          await this.prisma.client.upsert({
            where: { pessoaId: newPessoa.id },
            update: {},
            create: {
              pessoaId: newPessoa.id,
              organizationId,
            },
          });
        }

        if (tags.includes('Fornecedor')) {
          await this.prisma.fornecedor.upsert({
            where: { pessoaId: newPessoa.id },
            update: {},
            create: {
              pessoaId: newPessoa.id,
              organizationId,
            },
          });
        }

        // Adicione lógica para Funcionário se houver uma tag correspondente
        // Exemplo: if (tags.includes('Funcionário')) { ... }
      } catch (error) {
        console.error(`Erro ao importar empresa ${oldEmpresa.nome}:`, error.message);
        results.push({ name: oldEmpresa.nome, status: 'failed', reason: error.message });
      }
    }

    return results;
  }
}
