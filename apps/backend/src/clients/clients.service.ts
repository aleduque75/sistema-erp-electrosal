import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateClientDto,
  UpdateClientDto,
  ClientLoteDto,
} from './dtos/create-client.dto';
import { Client } from '@sistema-erp-electrosal/core'; // Changed
import { ClientMapper } from './mappers/client.mapper'; // Added

@Injectable()
export class ClientsService {
  constructor(private prisma: PrismaService) {}

  // Recebe organizationId em vez de userId
  async create(organizationId: string, data: CreateClientDto): Promise<Client> {
    const newClient = Client.create({
      ...data,
      organizationId,
    });
    const prismaClient = await this.prisma.client.create({
      data: ClientMapper.toPersistence(newClient),
    });
    return ClientMapper.toDomain(prismaClient);
  }

  // Recebe organizationId em vez de userId
  async findAll(organizationId: string): Promise<Client[]> {
    const prismaClients = await this.prisma.client.findMany({ where: { organizationId } }); // Usa no 'where'
    return prismaClients.map(ClientMapper.toDomain);
  }

  // Recebe organizationId em vez de userId
  async findOne(organizationId: string, id: string): Promise<Client> {
    const prismaClient = await this.prisma.client.findFirst({
      where: {
        id,
        organizationId, // Usa no 'where'
      },
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
    data: UpdateClientDto,
  ): Promise<Client> {
    const existingClient = await this.findOne(organizationId, id); // Returns DDD entity
    existingClient.update(data); // Update DDD entity

    const updatedPrismaClient = await this.prisma.client.update({
      where: { id: existingClient.id.toString() }, // Use id from DDD entity
      data: ClientMapper.toPersistence(existingClient), // Convert back to Prisma for persistence
    });

    return ClientMapper.toDomain(updatedPrismaClient); // Convert back to DDD for return
  }

  // Recebe organizationId em vez de userId
  async remove(organizationId: string, id: string): Promise<Client> {
    const client = await this.findOne(organizationId, id); // Garante que o cliente existe e retorna DDD entity

    const saleCount = await this.prisma.sale.count({
      where: { clientId: client.id.toString() }, // Use id from DDD entity
    });

    if (saleCount > 0) {
      throw new ConflictException(
        'Este cliente não pode ser removido pois possui um histórico de vendas.',
      );
    }

    const deletedPrismaClient = await this.prisma.client.delete({
      where: { id: client.id.toString() }, // Use id from DDD entity
    });
    return ClientMapper.toDomain(deletedPrismaClient);
  }

  // Recebe organizationId em vez de userId
  async createMany(organizationId: string, clientsData: ClientLoteDto[]): Promise<number> {
    const clientsToCreate = clientsData.map((clientData) => {
      const newClient = Client.create({
        ...clientData,
        organizationId,
      });
      return ClientMapper.toPersistence(newClient);
    });

    const { count } = await this.prisma.client.createMany({
      data: clientsToCreate,
      skipDuplicates: true,
    });
    return count;
  }
}
