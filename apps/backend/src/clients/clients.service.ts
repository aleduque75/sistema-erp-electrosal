import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common'; // Adicione ConflictException
import { PrismaService } from '../prisma/prisma.service';
import { Client } from '@prisma/client';
import { CreateClientDto, UpdateClientDto } from './dtos/client.dto';

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
    return this.prisma.client.findUnique({
      where: {
        id,
        userId,
      },
    });
  }

  async update(
    userId: string,
    id: string,
    data: UpdateClientDto,
  ): Promise<Client> {
    return this.prisma.client.update({
      where: {
        id,
        userId,
      },
      data,
    });
  }

  async remove(userId: string, id: string): Promise<Client> {
    // Primeiro, garante que o cliente existe e pertence ao usuário
    const client = await this.prisma.client.findUnique({
      where: { id, userId },
    });

    if (!client) {
      throw new NotFoundException(`Cliente com ID ${id} não encontrado.`);
    }

    // Agora, verifica se o cliente tem vendas associadas
    const saleCount = await this.prisma.sale.count({
      where: { clientId: id },
    });

    if (saleCount > 0) {
      throw new ConflictException(
        'Este cliente não pode ser removido pois possui um histórico de vendas.',
      );
    }

    // Se não houver vendas, pode deletar com segurança
    return this.prisma.client.delete({
      where: { id },
    });
  }
}
