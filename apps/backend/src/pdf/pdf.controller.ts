import { Controller, Get, Param, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PdfService } from './pdf.service';
import { PrismaService } from '../prisma/prisma.service';

@UseGuards(JwtAuthGuard)
@Controller('pdf')
export class PdfController {
  constructor(
    private readonly pdfService: PdfService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('recovery-order/:id')
  async getRecoveryOrderReport(
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const recoveryOrder = await this.prisma.recoveryOrder.findUnique({
      where: { id },
    });

    if (!recoveryOrder) {
      return res.status(404).send('Recovery order not found');
    }

    const analisesQuimicas = await this.prisma.analiseQuimica.findMany({
      where: { ordemDeRecuperacaoId: id },
    });

    const pdf = await this.pdfService.generatePdf('recovery-order-report', {
      recoveryOrder: {
        ...recoveryOrder,
        analisesEnvolvidas: analisesQuimicas,
      },
    });

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Length': pdf.length,
      'Content-Disposition': `attachment; filename=recovery-order-report-${id}.pdf`,
    });

    res.send(pdf);
  }
}
