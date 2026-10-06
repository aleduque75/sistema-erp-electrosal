import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TelegramBotService } from '../services/telegram-bot.service';

@Injectable()
export class SearchLookupUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly telegramBotService: TelegramBotService,
  ) {}

  async execute(query: { q?: string; type?: 'categoria' | 'conta' | 'cliente' }) {
    const organizationId = this.telegramBotService.getOrganizationId();
    const { q, type } = query;
    const searchTerm = (q || '').trim();

    if (type === 'categoria') {
      const results = await this.prisma.contaContabil.findMany({
        where: {
          organizationId,
          tipo: 'DESPESA',
          aceitaLancamento: true,
          ...(searchTerm ? { nome: { contains: searchTerm, mode: 'insensitive' } } : {}),
        },
        take: 6,
        orderBy: { codigo: 'asc' },
      });
      return { results };
    }

    if (type === 'conta') {
      const results = await this.prisma.contaCorrente.findMany({
        where: {
          organizationId,
          isActive: true,
          type: { in: ['BANCO', 'FORNECEDOR_METAL'] },
          ...(searchTerm ? { nome: { contains: searchTerm, mode: 'insensitive' } } : {}),
        },
        take: 6,
        orderBy: { nome: 'asc' },
      });
      return { results };
    }

    if (type === 'cliente') {
      const results = await this.prisma.contaCorrente.findMany({
        where: {
          organizationId,
          isActive: true,
          type: 'CLIENTE',
          ...(searchTerm ? { nome: { contains: searchTerm, mode: 'insensitive' } } : {}),
        },
        take: 6,
        orderBy: { nome: 'asc' },
      });
      return { results };
    }

    return { results: [] };
  }
}
