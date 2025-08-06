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
import { Client } from '@prisma/client';

@Injectable()
export class ClientsService {
  constructor(private prisma: PrismaService) {}

  // Recebe organizationId em vez de userId
  async create(organizationId: string, data: CreateClientDto): Promise<Client> {
    return this.prisma.client.create({
      data: {
        ...data,
        organization: { connect: { id: organizationId } }, // Conecta à organização existente
      },
    });
  }

  // Recebe organizationId em vez de userId
  async findAll(organizationId: string): Promise<Client[]> {
    return this.prisma.client.findMany({ where: { organizationId } }); // Usa no 'where'
  }

  // Recebe organizationId em vez de userId
  async findOne(organizationId: string, id: string): Promise<Client> {
    const client = await this.prisma.client.findFirst({
      where: {
        id,
        organizationId, // Usa no 'where'
      },
    });

    if (!client) {
      throw new NotFoundException(`Cliente com ID ${id} não encontrado.`);
    }
    return client;
  }

  // Recebe organizationId em vez de userId
  async update(
    organizationId: string,
    id: string,
    data: UpdateClientDto,
  ): Promise<Client> {
    const { count } = await this.prisma.client.updateMany({
      where: {
        id,
        organizationId, // Usa no 'where'
      },
      data,
    });

    if (count === 0) {
      throw new NotFoundException(
        `Cliente com ID ${id} não encontrado ou não pertence à organização.`,
      );
    }

    return this.prisma.client.findUniqueOrThrow({ where: { id } });
  }

  // Recebe organizationId em vez de userId
  async remove(organizationId: string, id: string): Promise<Client> {
    const client = await this.prisma.client.findFirst({
      where: { id, organizationId }, // Usa no 'where'
    });

    if (!client) {
      throw new NotFoundException(`Cliente com ID ${id} não encontrado.`);
    }

    const saleCount = await this.prisma.sale.count({
      where: { clientId: id },
    });

    if (saleCount > 0) {
      throw new ConflictException(
        'Este cliente não pode ser removido pois possui um histórico de vendas.',
      );
    }

    return this.prisma.client.delete({
      where: { id },
    });
  }

  // Recebe organizationId em vez de userId
  async createMany(organizationId: string, clientsData: ClientLoteDto[]) {
    const clientsToCreate = clientsData.map((client) => ({
      ...client,
      organizationId, // Usa o organizationId recebido
    }));

    return this.prisma.client.createMany({
      data: clientsToCreate,
      skipDuplicates: true,
    });
  }
}
