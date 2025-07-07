import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateSaleDto, UpdateSaleDto } from './dtos/sales.dto';
import { CreateSaleUseCase } from './use-cases/create-sale.use-case';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SalesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly createSaleUseCase: CreateSaleUseCase,
  ) {}

  async create(userId: string, createSaleDto: CreateSaleDto) {
    const saleEntity = await this.createSaleUseCase.execute(
      userId,
      createSaleDto,
    );
    // Retorna o dado real que foi salvo no banco, garantindo consistência
    return this.findOne(userId, saleEntity.id);
  }

  async findAll(userId: string, search?: string) {
    const whereClause: any = { userId };
    if (search) {
      whereClause.client = { name: { contains: search, mode: 'insensitive' } };
    }

    return this.prisma.sale.findMany({
      where: whereClause,
      include: { client: true },
      // ✅ CORREÇÃO: Usar 'createdAt' ou o nome correto do campo de data do seu schema.prisma
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(userId: string, id: string) {
    const sale = await this.prisma.sale.findFirst({
      where: { id, userId },
      include: { client: true, saleItems: { include: { product: true } } },
    });
    if (!sale) {
      throw new NotFoundException(`Venda com ID ${id} não encontrada.`);
    }
    return sale;
  }

  async update(userId: string, id: string, updateSaleDto: UpdateSaleDto) {
    await this.findOne(userId, id); // Garante que a venda existe
    return this.prisma.sale.update({
      where: { id },
      data: updateSaleDto,
    });
  }

  async remove(userId: string, id: string) {
    await this.findOne(userId, id); // Garante que a venda existe
    // Em uma transação, reverta estoque, exclua contas a receber, etc. (lógica futura)
    // Por agora, uma exclusão simples:
    await this.prisma.saleItem.deleteMany({ where: { saleId: id } });
    return this.prisma.sale.delete({ where: { id } });
  }
}
