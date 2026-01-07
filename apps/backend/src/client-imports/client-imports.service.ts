// Em: apps/backend/src/client-imports/client-imports.service.ts

import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as Papa from 'papaparse';
import { Prisma, PessoaType } from '@prisma/client';
import { PessoaLoteDto } from '../pessoa/dtos/create-pessoa.dto';

@Injectable()
export class ClientImportsService {
  constructor(private prisma: PrismaService) {}

  async previewGoogleCsv(organizationId: string, fileBuffer: Buffer) {
    try {
      const csvContent = fileBuffer.toString('utf-8');

      const parsed = Papa.parse(csvContent, {
        header: true,
        skipEmptyLines: true,
      });

      const allContacts = parsed.data as any[];

      // 👇 CORREÇÃO: Filtra contatos que tenham pelo menos um nome ou sobrenome
      const contactsWithAnyName = allContacts.filter(
        (c) => c['First Name'] || c['Last Name'],
      );

      if (contactsWithAnyName.length === 0) {
        return [];
      }

      // Busca todas as pessoas da organização para checagem local
      const allPessoasInOrg = await this.prisma.pessoa.findMany({
        where: { organizationId },
        select: {
          id: true,
          email: true,
          name: true,
          client: { select: { pessoaId: true } },
          fornecedor: { select: { pessoaId: true } },
          funcionario: { select: { pessoaId: true } },
        },
      });

      const existingEmailsMap = new Map<string, { id: string; roles: string[] }>();
      const existingNamesMap = new Map<string, { id: string; roles: string[] }>();

      allPessoasInOrg.forEach((p) => {
        const roles: string[] = [];
        if (p.client) roles.push('CLIENT');
        if (p.fornecedor) roles.push('FORNECEDOR');
        if (p.funcionario) roles.push('FUNCIONARIO');

        if (p.email) {
          existingEmailsMap.set(p.email.toLowerCase(), { id: p.id, roles });
        }
        if (p.name) {
          existingNamesMap.set(p.name.toLowerCase(), { id: p.id, roles });
        }
      });

      const previewList = contactsWithAnyName.map((contact: any) => {
        const email = contact['E-mail 1 - Value'] || null;
        const fullName = [
          contact['First Name'],
          contact['Middle Name'],
          contact['Last Name'],
        ]
          .filter(Boolean)
          .join(' ')
          .trim();

        let status: 'new' | 'duplicate' = 'new';
        let existingPessoaId: string | null = null;
        let existingRoles: string[] = [];

        let pessoaInfo: { id: string; roles: string[] } | undefined;

        if (email) {
          pessoaInfo = existingEmailsMap.get(email.toLowerCase());
        }
        
        // Se não encontrou por email, tenta por nome
        if (!pessoaInfo && fullName) {
            pessoaInfo = existingNamesMap.get(fullName.toLowerCase());
        }

        if (pessoaInfo) {
          status = 'duplicate';
          existingPessoaId = pessoaInfo.id;
          existingRoles = pessoaInfo.roles;
        }

        return {
          name: fullName,
          email: email,
          phone: contact['Phone 1 - Value'] || null, // <-- Usa o cabeçalho em inglês
          status: status,
          // Adicionando campos da Pessoa
          cpf: contact['CPF'] || null,
          birthDate: contact['Birth Date'] || null,
          gender: contact['Gender'] || null,
          cep: contact['CEP'] || null,
          logradouro: contact['Street Address'] || null,
          numero: contact['Street Address 2'] || null,
          complemento: contact['Address 2 - Type'] || null,
          bairro: contact['Neighborhood'] || null,
          cidade: contact['City'] || null,
          uf: contact['Region'] || null,
          role: 'CLIENT', // Default role
          type: PessoaType.FISICA, // Default to FISICA
          existingPessoaId: existingPessoaId, // Add existing Pessoa ID
          existingRoles: existingRoles, // Add existing roles
        };
      });

      return previewList;
    } catch (error) {
      throw new BadRequestException('Arquivo CSV inválido ou mal formatado.');
    }
  }

  async importGoogleCsv(organizationId: string, clients: PessoaLoteDto[]) {
    const createdPessoas: Prisma.PessoaGetPayload<{}>[] = []; // Changed to PessoaGetPayload

    for (const clientData of clients) {
      let pessoaIdToUse: string;
      let existingPessoa:
        | (Prisma.PessoaGetPayload<{
            include: { client: true; fornecedor: true; funcionario: true };
          }> & { id: string })
        | null = null;

      // Checa duplicidade por email ou nome
      if (clientData.email) {
        existingPessoa = await this.prisma.pessoa.findUnique({
          where: { email: clientData.email, organizationId },
          include: { client: true, fornecedor: true, funcionario: true },
        });
      }

      if (!existingPessoa && clientData.name) {
        existingPessoa = await this.prisma.pessoa.findFirst({
          where: {
            name: { equals: clientData.name, mode: 'insensitive' },
            organizationId,
          },
          include: { client: true, fornecedor: true, funcionario: true },
        });
      }

      if (existingPessoa) {
        pessoaIdToUse = existingPessoa.id;
      } else {
        // Create new Pessoa if not exists
        const newPessoa = await this.prisma.pessoa.create({
          data: {
            name: clientData.name,
            email: clientData.email,
            phone: clientData.phone,
            cpf: clientData.cpf,
            birthDate: clientData.birthDate,
            gender: clientData.gender,
            cep: clientData.cep,
            logradouro: clientData.logradouro,
            numero: clientData.numero,
            complemento: clientData.complemento,
            bairro: clientData.bairro,
            cidade: clientData.cidade,
            uf: clientData.uf,
            type: clientData.type, // Use the type from the DTO
            organization: { connect: { id: organizationId } },
          },
        });
        pessoaIdToUse = newPessoa.id;
        createdPessoas.push(newPessoa);
      }

      // Create role-specific entry if it doesn't exist
      // This logic is now outside the existingPessoa check, so it always runs
      // for the determined pessoaIdToUse
      if (clientData.role === 'CLIENT') {
        if (!existingPessoa?.client) {
          await this.prisma.client.create({
            data: {
              pessoa: { connect: { id: pessoaIdToUse } },
              organization: { connect: { id: organizationId } },
            },
          });
        }
      } else if (clientData.role === 'FORNECEDOR') {
        if (!existingPessoa?.fornecedor) {
          await this.prisma.fornecedor.create({
            data: {
              pessoa: { connect: { id: pessoaIdToUse } },
              organization: { connect: { id: organizationId } },
            },
          });
        }
      } else if (clientData.role === 'FUNCIONARIO') {
        if (!existingPessoa?.funcionario) {
          await this.prisma.funcionario.create({
            data: {
              pessoa: { connect: { id: pessoaIdToUse } },
              organization: { connect: { id: organizationId } },
              hireDate: new Date(), // Default hire date
              position: 'N/A', // Default position
            },
          });
        }
      }
    }
    return createdPessoas;
  }
}
