import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTransferUseCase } from '../../transacoes/use-cases/create-transfer.use-case';
import { MediaService } from '../../media/media.service';
import { TelegramBotService } from '../services/telegram-bot.service';

@Injectable()
export class TransferToSupplierUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly createTransferUseCase: CreateTransferUseCase,
    private readonly mediaService: MediaService,
    private readonly telegramBotService: TelegramBotService,
  ) {}

  async execute(dto: {
    sourceAccountId: string;
    destinationAccountId: string;
    amount: number;
    quotation?: number;
    description?: string;
    date?: string;
    contaContabilId?: string;
    fileBase64?: string;
    mimeType?: string;
    fileId?: string;
  }) {
    const organizationId = this.telegramBotService.getOrganizationId();
    const { sourceAccountId, destinationAccountId, amount, description, date } = dto;

    let contaContabilId = dto.contaContabilId;
    if (!contaContabilId) {
      const sourceAcc = await this.prisma.contaCorrente.findUnique({
        where: { id: sourceAccountId },
      });
      if (sourceAcc?.contaContabilId) {
        contaContabilId = sourceAcc.contaContabilId;
      } else {
        const firstContabil = await this.prisma.contaContabil.findFirst({
          where: { organizationId },
        });
        contaContabilId = firstContabil?.id;
      }
    }

    if (!contaContabilId) {
      throw new NotFoundException('Conta Contábil não encontrada para realizar a transferência.');
    }

    let goldPrice = dto.quotation;
    if (!goldPrice || goldPrice <= 0) {
      const quotation = await this.prisma.quotation.findFirst({
        where: { organizationId, metal: 'AU' },
        orderBy: { date: 'desc' },
      });
      goldPrice = quotation ? Number(quotation.buyPrice) : 715;
    }

    const result = await this.createTransferUseCase.execute(organizationId, {
      sourceAccountId,
      destinationAccountId,
      amount: Number(amount),
      quotation: goldPrice,
      description: description || 'Transferência via Automação Telegram',
      dataHora: date ? new Date(date) : new Date(),
      contaContabilId,
    });

    // If receipt photo is sent, upload to AWS S3 and attach to the debit transaction
    if (dto.fileBase64) {
      try {
        const buffer = Buffer.from(dto.fileBase64, 'base64');
        const multerFile = {
          buffer,
          originalname: `comprovante-transferencia-${Date.now()}.jpg`,
          mimetype: dto.mimeType || 'image/jpeg',
          size: buffer.length,
        } as Express.Multer.File;

        await this.mediaService.create(multerFile, organizationId, {
          transacaoId: result.debitTransaction.id,
        });
      } catch (err) {
        console.error('Erro ao fazer upload do comprovante para AWS S3:', err);
      }
    } else if (dto.fileId && result.debitTransaction?.id) {
      await this.telegramBotService.uploadTelegramFileToS3(dto.fileId, result.debitTransaction.id);
      if (result.creditTransaction?.id) {
        await this.telegramBotService.uploadTelegramFileToS3(dto.fileId, result.creditTransaction.id);
      }
    }

    return {
      success: true,
      message: `Transferência de R$ ${Number(amount).toFixed(2)} realizada com sucesso!`,
      debitTransactionId: result.debitTransaction.id,
      creditTransactionId: result.creditTransaction.id,
    };
  }
}
