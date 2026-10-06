import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MediaService } from '../../media/media.service';
import { TelegramBotService } from '../services/telegram-bot.service';

@Injectable()
export class CreateDirectExpenseUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mediaService: MediaService,
    private readonly telegramBotService: TelegramBotService,
  ) {}

  async execute(dto: {
    amount: number;
    contaCorrenteId: string;
    categoria: string;
    quotation?: number;
    description?: string;
    date?: string;
    fileBase64?: string;
    mimeType?: string;
    fileId?: string;
  }) {
    const organizationId = this.telegramBotService.getOrganizationId();
    const { amount, contaCorrenteId, categoria, description, date } = dto;

    const contasMap: Record<string, string> = {
      frete: 'fecc1af8-54ca-4e2b-a904-ab151fbcb6a6',
      consumo: '51f1ee92-82e3-484b-9371-d2196d50d8c4',
      aluguel: 'edef269f-9c41-4f5f-94a1-31b771aac51a',
      salario: '9a28d458-a651-4874-858a-06fd3614ce80',
      gerais: '65824286-aa95-4406-b5cb-6755fde5c8ab',
    };

    let contaContabilId = contasMap[categoria.toLowerCase()];
    if (!contaContabilId) {
      if (categoria && categoria.length === 36 && categoria.includes('-')) {
        contaContabilId = categoria;
      } else {
        contaContabilId = contasMap.gerais;
      }
    }

    let goldPrice = dto.quotation;
    if (!goldPrice || goldPrice <= 0) {
      const quotation = await this.prisma.quotation.findFirst({
        where: { organizationId, metal: 'AU' },
        orderBy: { date: 'desc' },
      });
      goldPrice = quotation ? Number(quotation.buyPrice) : 715;
    }
    const goldAmount = goldPrice > 0 ? Number(amount) / goldPrice : 0;

    const contaCorrente = await this.prisma.contaCorrente.findUnique({
      where: { id: contaCorrenteId },
    });
    if (!contaCorrente) {
      throw new NotFoundException('Conta corrente não encontrada');
    }

    const contaContabil = await this.prisma.contaContabil.findUnique({
      where: { id: contaContabilId },
    });

    const descFinal = description || `Despesa ${contaContabil?.nome || categoria.toUpperCase()} via Telegram`;

    // Create DEBITO transaction
    const transaction = await this.prisma.transacao.create({
      data: {
        organizationId,
        tipo: 'DEBITO',
        valor: Number(amount),
        goldAmount,
        goldPrice,
        moeda: 'BRL',
        descricao: descFinal,
        dataHora: date ? new Date(date) : new Date(),
        contaContabilId,
        contaCorrenteId,
      },
    });

    // Upload attachment if present
    if (dto.fileBase64) {
      try {
        const buffer = Buffer.from(dto.fileBase64, 'base64');
        const multerFile = {
          buffer,
          originalname: `comprovante-despesa-${Date.now()}.jpg`,
          mimetype: dto.mimeType || 'image/jpeg',
          size: buffer.length,
        } as Express.Multer.File;

        await this.mediaService.create(multerFile, organizationId, {
          transacaoId: transaction.id,
        });
      } catch (err) {
        console.error('Erro ao fazer upload do comprovante para AWS S3:', err);
      }
    } else if (dto.fileId && transaction.id) {
      await this.telegramBotService.uploadTelegramFileToS3(dto.fileId, transaction.id);
    }

    return {
      success: true,
      message: `Despesa de R$ ${Number(amount).toFixed(2)} (${goldAmount.toFixed(3)}g Au) lançada com sucesso em ${contaCorrente.nome}!`,
      amount: Number(amount),
      goldAmount,
      goldPrice,
      contaCorrenteNome: contaCorrente.nome,
      categoriaNome: contaContabil?.nome || categoria,
      transactionId: transaction.id,
    };
  }
}
