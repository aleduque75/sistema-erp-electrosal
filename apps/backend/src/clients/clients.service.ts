import {
  ConflictException, // <-- Import adicionado
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateClientDto,
  UpdateClientDto,
  ClientLoteDto,
} from './dtos/create-client.dto';
import { Client } from '@prisma/client'; // <-- Import adicionado

@Injectable()
export class ClientsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, data: CreateClientDto): Promise<Client> {
    return this.prisma.client.create({
      data: {
        ...data,
        userId,
      },
    });
  }

  async findAll(userId: string): Promise<Client[]> {
    return this.prisma.client.findMany({ where: { userId } });
  }

  async findOne(userId: string, id: string): Promise<Client | null> {
    // CORRIGIDO: Usa findFirst para checar o 'id' e a posse do 'userId'
    const client = await this.prisma.client.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!client) {
      throw new NotFoundException(`Cliente com ID ${id} não encontrado.`);
    }
    return client;
  }

  async update(
    userId: string,
    id: string,
    data: UpdateClientDto,
  ): Promise<Client> {
    const { count } = await this.prisma.client.updateMany({
      where: {
        id,
        userId,
      },
      data,
    });

    if (count === 0) {
      throw new NotFoundException(
        `Cliente com ID ${id} não encontrado ou não pertence ao usuário.`,
      );
    }

    // CORRIGIDO: Usa findUniqueOrThrow para garantir que o retorno não será nulo
    return this.prisma.client.findUniqueOrThrow({ where: { id } });
  }

  async remove(userId: string, id: string): Promise<Client> {
    // CORRIGIDO: Usa findFirst para garantir a posse antes de qualquer ação
    const client = await this.prisma.client.findFirst({
      where: { id, userId },
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

  async createMany(userId: string, clientsData: ClientLoteDto[]) {
    const clientsToCreate = clientsData.map((client) => ({
      ...client,
      userId,
    }));
    return this.prisma.client.createMany({
      data: clientsToCreate,
      skipDuplicates: true,
    });
  }
}
