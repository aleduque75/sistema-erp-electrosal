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
      console.log('Iniciando previewGoogleCsv...');
      const csvContent = fileBuffer.toString('utf-8');
      console.log('CSV Content (first 500 chars):', csvContent.substring(0, 500));

      const parsed = Papa.parse(csvContent, {
        header: true,
        skipEmptyLines: true,
      });
      console.log('PapaParse errors:', parsed.errors);
      console.log('Parsed data length:', parsed.data.length);

      const allContacts = parsed.data as any[];

      // 👇 CORREÇÃO: Filtra contatos que tenham pelo menos um nome ou sobrenome
      const contactsWithAnyName = allContacts.filter(
        (c) => c['First Name'] || c['Last Name'],
      );

      if (contactsWithAnyName.length === 0) {
        return [];
      }

      // 👇 CORREÇÃO: Procura por 'E-mail 1 - Value' (padrão inglês)
      const emailsFromFile = contactsWithAnyName
        .map((c) => c['E-mail 1 - Value'])
        .filter((email) => !!email);

      const existingClients = await this.prisma.client.findMany({
        where: {
          organizationId,
          pessoa: {
            email: { in: emailsFromFile },
          },
        },
        select: {
          pessoa: {
            select: {
              email: true,
            },
          },
        },
      });
      const existingEmails = new Set(existingClients.map((c) => c.pessoa.email));

      const previewList = contactsWithAnyName.map((contact: any) => {
        const email = contact['E-mail 1 - Value'] || null;
        let status: 'new' | 'duplicate' = 'new';

        if (email && existingEmails.has(email)) {
          status = 'duplicate';
        }

        // 👇 CORREÇÃO: Constrói o nome completo a partir das colunas em inglês
        const fullName = [
          contact['First Name'],
          contact['Middle Name'],
          contact['Last Name'],
        ]
          .filter(Boolean) // Remove partes vazias
          .join(' ');

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
          type: PessoaType.FISICA, // Default to FISICA
        };
      });

      return previewList;
    } catch (error) {
      console.error('Erro ao processar arquivo CSV:', error);
      throw new BadRequestException('Arquivo CSV inválido ou mal formatado.');
    }
  }

  async importGoogleCsv(organizationId: string, clients: PessoaLoteDto[]) {
    console.log('importGoogleCsv - organizationId recebido:', organizationId);
    console.log('importGoogleCsv - primeiro cliente recebido:', clients[0]);
    const createdClients: Prisma.ClientGetPayload<{ include: { pessoa: true } }>[] = [];
    for (const clientData of clients) {
      const createdClient = await this.prisma.client.create({
        data: {
          organization: { connect: { id: organizationId } },
          pessoa: {
            create: {
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
          },
        },
        include: { pessoa: true }, // Include pessoa relation in the returned object
      });
      createdClients.push(createdClient);
    }
    return createdClients;
  }
}
