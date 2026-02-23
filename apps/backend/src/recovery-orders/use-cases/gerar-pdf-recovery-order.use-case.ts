import {
  Injectable,
  Inject,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { IRecoveryOrderRepository } from '@sistema-erp-electrosal/core';
import * as puppeteer from 'puppeteer';
import * as fs from 'fs/promises';
import * as path from 'path';
import { format } from 'date-fns';
import { Buffer } from 'buffer';
import * as Handlebars from 'handlebars';

export interface GerarPdfRecoveryOrderCommand {
  recoveryOrderId: string;
  organizationId: string;
}

@Injectable()
export class GerarPdfRecoveryOrderUseCase {
  constructor(
    @Inject('IRecoveryOrderRepository')
    private readonly recoveryOrderRepository: IRecoveryOrderRepository,
  ) {
    if (!Handlebars.helpers.formatarNumero) {
      this.registerHandlebarsHelpers();
    }
  }

  private registerHandlebarsHelpers() {
    Handlebars.registerHelper(
      'formatarNumero',
      (valor, casasDecimais = 2) => {
        if (valor === null || valor === undefined || isNaN(Number(valor)))
          return 'N/A';
        return Number(valor).toFixed(casasDecimais).replace('.', ',');
      },
    );

    Handlebars.registerHelper('formatarData', (data) => {
      if (!data) return 'N/A';
      try {
        const dateObj = new Date(data);
        if (isNaN(dateObj.getTime())) return 'Data inválida';
        return format(dateObj, 'dd/MM/yyyy');
      } catch (e) {
        return '';
      }
    });

    Handlebars.registerHelper('formatarPercentual', (valor) => {
      if (typeof valor !== 'number' || isNaN(valor)) return 'N/A';
      return `${(valor * 100).toFixed(2)}%`.replace('.', ',');
    });
  }

  private async getImageAsBase64(filePath: string): Promise<string | null> {
    try {
      if (!filePath) return null;

      let imageBuffer: Buffer;

      if (filePath.startsWith('http')) {
        // Download from S3 or external URL
        const response = await fetch(filePath);
        if (!response.ok) throw new Error(`Falha ao baixar imagem: ${response.statusText}`);
        const arrayBuffer = await response.arrayBuffer();
        imageBuffer = Buffer.from(arrayBuffer);
      } else {
        // Local file
        let absolutePath = filePath;
        if (filePath.startsWith('/uploads/')) {
          absolutePath = path.join(process.cwd(), filePath.substring(1));
        }
        imageBuffer = await fs.readFile(absolutePath);
      }

      const base64Image = imageBuffer.toString('base64');
      const ext = path.extname(filePath.split('?')[0]).toLowerCase();
      let mimeType = 'image/jpeg'; // Default
      if (ext === '.png') mimeType = 'image/png';
      else if (ext === '.jpg' || ext === '.jpeg') mimeType = 'image/jpeg';

      return `data:${mimeType};base64,${base64Image}`;
    } catch (error) {
      console.error(`Erro ao processar imagem para PDF: ${filePath}`, error);
      return null;
    }
  }

  async execute(command: GerarPdfRecoveryOrderCommand): Promise<Buffer> {
    const { recoveryOrderId, organizationId } = command;

    const recoveryOrder = await this.recoveryOrderRepository.findById(
      recoveryOrderId,
      organizationId,
    );
    if (!recoveryOrder) {
      throw new NotFoundException(
        `Ordem de Recuperação com ID ${recoveryOrderId} não encontrada.`,
      );
    }

    const baseDir = process.env.NODE_ENV === 'production'
      ? path.join(process.cwd(), 'dist')
      : path.join(process.cwd(), 'src');

    const templatePath = path.join(
      baseDir,
      'templates',
      'recovery-order-pdf.template.html',
    );
    const htmlTemplateString = await fs.readFile(templatePath, 'utf-8');

    const logoPath = path.join(
      baseDir,
      'assets',
      'images',
      'logoAtual.png',
    );
    const logoBase64 = await this.getImageAsBase64(logoPath);

    const htmlComLogo = htmlTemplateString.replace(
      '%%LOGO_PLACEHOLDER%%',
      logoBase64 || '',
    );

    const imagesBase64 = await Promise.all(
      (recoveryOrder.images || []).map((image) =>
        this.getImageAsBase64(image.path),
      ),
    );

    const templateData: any = {
      ...recoveryOrder.toObject(),
      dataEmissaoPdf: new Date(),
      status: recoveryOrder.status.replace(/_/g, ' '),
      imagesBase64: imagesBase64.filter((img) => img !== null),
    };

    templateData.totalCreditoClienteGramas = (
      templateData.analisesEnvolvidas || []
    ).reduce(
      (acc, analise) => acc + (analise.auLiquidoParaClienteGramas || 0),
      0,
    );

    const template = Handlebars.compile(htmlComLogo);
    const htmlContent = template(templateData);

    let browser;
    try {
      browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });
      const page = await browser.newPage();
      await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '20mm', right: '15mm', bottom: '20mm', left: '15mm' },
      });

      return pdfBuffer;
    } catch (error) {
      console.error('Erro ao gerar PDF da Ordem de Recuperação:', error);
      throw new InternalServerErrorException('Falha ao gerar o PDF da Ordem de Recuperação.');
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }
}
