import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PessoaType, Prisma } from '@prisma/client';
import {
  CreatePessoaDto,
  UpdatePessoaDto,
  PessoaLoteDto,
} from '../pessoa/dtos/create-pessoa.dto';
import { Client } from '@sistema-beleza/core'; // Changed
import { ClientMapper } from './mappers/client.mapper'; // Added

@Injectable()
export class ClientsService {
  constructor(private prisma: PrismaService) {}

  // Recebe organizationId em vez de userId
  async create(organizationId: string, data: CreatePessoaDto): Promise<Client> {
    const newPessoa = await this.prisma.pessoa.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        ...(data.birthDate && { birthDate: data.birthDate }),
        ...(data.cep && { cep: data.cep }),
        ...(data.logradouro && { logradouro: data.logradouro }),
        ...(data.numero && { numero: data.numero }),
        ...(data.complemento && { complemento: data.complemento }),
        ...(data.bairro && { bairro: data.bairro }),
        ...(data.cidade && { cidade: data.cidade }),
        ...(data.uf && { uf: data.uf }),
        ...(data.gender && { gender: data.gender }),
        ...(data.preferences && { preferences: data.preferences }),
        ...(data.purchaseHistory && { purchaseHistory: data.purchaseHistory }),
        ...(data.cpf && { cpf: data.cpf }),
        type: PessoaType.FISICA, // Explicitly set the type
        organization: { connect: { id: organizationId } },
      },
    });

    const newClient = Client.create({
      pessoaId: newPessoa.id,
      organizationId,
    });

    const prismaClient = await this.prisma.client.create({
      data: {
        organization: { connect: { id: newClient.organizationId.toString() } },
        pessoa: { connect: { id: newClient.pessoaId.toString() } },
      } as Prisma.ClientCreateInput,
    });
    return ClientMapper.toDomain(prismaClient);
  }

  // Recebe organizationId em vez de userId
  async findAll(organizationId: string): Promise<Client[]> {
    const prismaClients = await this.prisma.client.findMany({
      where: { organizationId },
      include: { pessoa: true },
    }); // Usa no 'where'
    return prismaClients.map(ClientMapper.toDomain);
  }

  // Recebe organizationId em vez de userId
  async findOne(organizationId: string, id: string): Promise<Client> {
    const prismaClient = await this.prisma.client.findFirst({
      where: {
        pessoaId: id,
        organizationId, // Usa no 'where'
      },
      include: { pessoa: true },
    });

    if (!prismaClient) {
      throw new NotFoundException(`Cliente com ID ${id} não encontrado.`);
    }
    return ClientMapper.toDomain(prismaClient);
  }

  // Recebe organizationId em vez de userId
  async update(
    organizationId: string,
    id: string,
    data: UpdatePessoaDto,
  ): Promise<Client> {
    const existingClient = await this.prisma.client.findFirst({
      where: { pessoaId: id, organizationId },
      include: { pessoa: true },
    });

    if (!existingClient) {
      throw new NotFoundException(`Cliente com ID ${id} não encontrado.`);
    }

    // Update Pessoa data
    const updatedPessoa = await this.prisma.pessoa.update({
      where: { id: existingClient.pessoaId },
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        ...(data.birthDate && { birthDate: data.birthDate }),
        ...(data.cep && { cep: data.cep }),
        ...(data.logradouro && { logradouro: data.logradouro }),
        ...(data.numero && { numero: data.numero }),
        ...(data.complemento && { complemento: data.complemento }),
        ...(data.bairro && { bairro: data.bairro }),
        ...(data.cidade && { cidade: data.cidade }),
        ...(data.uf && { uf: data.uf }),
        ...(data.gender && { gender: data.gender }),
        ...(data.preferences && { preferences: data.preferences }),
        ...(data.purchaseHistory && { purchaseHistory: data.purchaseHistory }),
        ...(data.cpf && { cpf: data.cpf }),
      },
    });

    // Reconstruct the Client entity with updated Pessoa data
    const updatedClient = Client.create(
      {
        pessoaId: updatedPessoa.id,
        organizationId: existingClient.organizationId,
      },
      existingClient.pessoaId, // Use pessoaId as the Client ID
    );

    return updatedClient;
  }

  // Recebe organizationId em vez de userId
  async remove(organizationId: string, id: string): Promise<Client> {
    const clientToDelete = await this.prisma.client.findFirst({
      where: { pessoaId: id, organizationId },
      include: { pessoa: true },
    });

    if (!clientToDelete) {
      throw new NotFoundException(`Cliente com ID ${id} não encontrado.`);
    }

    const saleCount = await this.prisma.sale.count({
      where: { pessoaId: clientToDelete.pessoaId },
    });

    if (saleCount > 0) {
      throw new ConflictException(
        'Este cliente não pode ser removido pois possui um histórico de vendas.',
      );
    }

    await this.prisma.client.delete({
      where: { pessoaId: clientToDelete.pessoaId },
    });

    const deletedPessoa = await this.prisma.pessoa.delete({
      where: { id: clientToDelete.pessoaId },
    });

    return Client.create(
      {
        pessoaId: deletedPessoa.id,
        organizationId: clientToDelete.organizationId,
      },
      clientToDelete.pessoaId, // Use pessoaId as the Client ID
    );
  }

  // Recebe organizationId em vez de userId
  async createMany(organizationId: string, clientsData: PessoaLoteDto[]): Promise<number> {
    let createdCount = 0;
    for (const clientData of clientsData) {
      const newPessoa = await this.prisma.pessoa.create({
        data: {
          name: clientData.name,
          email: clientData.email,
          phone: clientData.phone,
          ...(clientData.birthDate && { birthDate: clientData.birthDate }),
          ...(clientData.cep && { cep: clientData.cep }),
          ...(clientData.logradouro && { logradouro: clientData.logradouro }),
          ...(clientData.numero && { numero: clientData.numero }),
          ...(clientData.complemento && { complemento: clientData.complemento }),
          ...(clientData.bairro && { bairro: clientData.bairro }),
          ...(clientData.cidade && { cidade: clientData.cidade }),
          ...(clientData.uf && { uf: clientData.uf }),
          ...(clientData.gender && { gender: clientData.gender }),
          ...(clientData.preferences && { preferences: clientData.preferences }),
          ...(clientData.purchaseHistory && { purchaseHistory: clientData.purchaseHistory }),
          ...(clientData.cpf && { cpf: clientData.cpf }),
          type: PessoaType.FISICA, // Explicitly set the type
          organization: { connect: { id: organizationId } },
        },
      });

      const newClient = Client.create({
        pessoaId: newPessoa.id,
        organizationId,
      });

      await this.prisma.client.create({
        data: {
          organization: { connect: { id: newClient.organizationId.toString() } },
          pessoa: { connect: { id: newClient.pessoaId.toString() } },
        } as Prisma.ClientCreateInput,
      });
      createdCount++;
    }
    return createdCount;
  }
}
