import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ConfirmSaleUseCase } from '../../sales/use-cases/confirm-sale.use-case';
import { MediaService } from '../../media/media.service';
import { TelegramBotService } from '../services/telegram-bot.service';

@Injectable()
export class SettleSaleAutomationUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly confirmSaleUseCase: ConfirmSaleUseCase,
    private readonly mediaService: MediaService,
    private readonly telegramBotService: TelegramBotService,
  ) {}

  async execute(dto: {
    saleId: string;
    contaCorrenteId: string;
    amount?: number;
    date?: string;
    observation?: string;
    fileBase64?: string;
    mimeType?: string;
    fileId?: string;
  }) {
    const organizationId = this.telegramBotService.getOrganizationId();
    const { saleId, contaCorrenteId } = dto;

    const sale = await this.prisma.sale.findFirst({
      where: { id: saleId, organizationId },
      include: { pessoa: true },
    });

    if (!sale) {
      throw new NotFoundException(`Venda com ID ${saleId} não encontrada.`);
    }

    const contaCorrente = await this.prisma.contaCorrente.findFirst({
      where: { id: contaCorrenteId, organizationId },
    });

    if (!contaCorrente) {
      throw new NotFoundException(`Conta Corrente com ID ${contaCorrenteId} não encontrada.`);
    }

    // Execute confirmation with A_VISTA pointing to selected contaCorrente
    await this.confirmSaleUseCase.execute(
      organizationId,
      'automation-system',
      saleId,
      {
        paymentMethod: 'A_VISTA',
        contaCorrenteId: contaCorrente.id,
        keepSaleStatusPending: false,
      },
    );

    // If receipt photo is sent via base64, upload to AWS S3
    if (dto.fileBase64) {
      try {
        const buffer = Buffer.from(dto.fileBase64, 'base64');
        const multerFile = {
          buffer,
          originalname: `comprovante-venda-${sale.orderNumber}-${Date.now()}.jpg`,
          mimetype: dto.mimeType || 'image/jpeg',
          size: buffer.length,
        } as Express.Multer.File;

        await this.mediaService.create(multerFile, organizationId);
      } catch (err) {
        console.error('Erro ao fazer upload do comprovante para AWS S3:', err);
      }
    } else if (dto.fileId) {
      await this.telegramBotService.uploadTelegramFileToS3(dto.fileId);
    }

    return {
      success: true,
      message: `Venda #${sale.orderNumber} (${sale.pessoa?.name}) baixada com sucesso e creditada em ${contaCorrente.nome}!`,
      orderNumber: sale.orderNumber,
      clientName: sale.pessoa?.name,
      contaCorrenteNome: contaCorrente.nome,
    };
  }
}
