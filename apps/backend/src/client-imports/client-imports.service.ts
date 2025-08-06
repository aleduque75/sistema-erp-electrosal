// Em: apps/backend/src/client-imports/client-imports.service.ts

import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as Papa from 'papaparse';
import { Prisma } from '@prisma/client';

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
        where: { organizationId, email: { in: emailsFromFile } },
        select: { email: true },
      });
      const existingEmails = new Set(existingClients.map((c) => c.email));

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
        };
      });

      return previewList;
    } catch (error) {
      console.error('Erro ao processar arquivo CSV:', error);
      throw new BadRequestException('Arquivo CSV inválido ou mal formatado.');
    }
  }

  async importGoogleCsv(organizationId: string, clients: any[]) {
    console.log('importGoogleCsv - organizationId recebido:', organizationId);
    console.log('importGoogleCsv - primeiro cliente recebido:', clients[0]);
    const clientsToCreate = clients.map(client => ({
      ...client,
      organizationId: organizationId, // Garante que o organizationId seja explicitamente definido
    }));

    return this.prisma.client.createMany({
      data: clientsToCreate,
      skipDuplicates: true,
    });
  }
}
