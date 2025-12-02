import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as puppeteer from 'puppeteer';
import * as fs from 'fs/promises';
import * as path from 'path';
import { format } from 'date-fns';
import { Buffer } from 'buffer';
import * as Handlebars from 'handlebars';
import { GetTrialBalanceReportDto } from '../dto/get-trial-balance-report.dto';
import { GenerateTrialBalanceUseCase } from './generate-trial-balance.use-case';
import { Decimal } from 'decimal.js';

export interface GenerateTrialBalancePdfCommand {
  organizationId: string;
  dto: GetTrialBalanceReportDto;
}

@Injectable()
export class GenerateTrialBalancePdfUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly generateTrialBalanceUseCase: GenerateTrialBalanceUseCase,
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
      return `${valor.toFixed(2)}%`.replace('.', ',');
    });

    Handlebars.registerHelper('ifCond', function (v1, operator, v2, options) {
      switch (operator) {
        case '==':
          return v1 == v2 ? options.fn(this) : options.inverse(this);
        case '===':
          return v1 === v2 ? options.fn(this) : options.inverse(this);
        default:
          return options.inverse(this);
      }
    });
  }

  private async getImageAsBase64(filePath: string): Promise<string | null> {
    try {
      const imageBuffer = await fs.readFile(filePath);
      const base64Image = imageBuffer.toString('base64');
      const ext = path.extname(filePath).toLowerCase();
      let mimeType = '';
      if (ext === '.png') mimeType = 'image/png';
      else if (ext === '.jpg' || ext === '.jpeg') mimeType = 'image/jpeg';
      if (mimeType) return `data:${mimeType};base64,${base64Image}`;
      return null;
    } catch (error) {
      console.error(`Erro ao ler imagem para base64: ${filePath}`, error);
      return null;
    }
  }

  async execute(command: GenerateTrialBalancePdfCommand): Promise<Buffer> {
    const { organizationId, dto } = command;
    const { startDate, endDate } = dto;

    const reportData = await this.generateTrialBalanceUseCase.execute(organizationId, dto);

    const srcDir = path.join(process.cwd(), 'src');
    const templatePath = path.join(
      srcDir,
      'templates',
      'trial-balance-pdf.template.html',
    );
    const htmlTemplateString = await fs.readFile(templatePath, 'utf-8');

    const logoPath = path.join(
      srcDir,
      'assets',
      'images',
      'logoAtual.png',
    );
    const logoBase64 = await this.getImageAsBase64(logoPath);

    const htmlComLogo = htmlTemplateString.replace(
      '%%LOGO_PLACEHOLDER%%',
      logoBase64 || '',
    );

    const templateData = {
      reportData: reportData.map(entry => ({
        ...entry,
        saldoInicialDebito: entry.saldoInicialDebito.toFixed(2),
        saldoInicialCredito: entry.saldoInicialCredito.toFixed(2),
        movimentoDebito: entry.movimentoDebito.toFixed(2),
        movimentoCredito: entry.movimentoCredito.toFixed(2),
        saldoFinalDebito: entry.saldoFinalDebito.toFixed(2),
        saldoFinalCredito: entry.saldoFinalCredito.toFixed(2),
        saldoInicialGold: entry.saldoInicialGold.toFixed(4),
        movimentoGold: entry.movimentoGold.toFixed(4),
        saldoFinalGold: entry.saldoFinalGold.toFixed(4),
        transactions: entry.transactions?.map(t => ({
          ...t,
          valor: new Decimal(t.valor).toFixed(2),
          goldAmount: t.goldAmount ? new Decimal(t.goldAmount).toFixed(4) : '0.0000',
          goldPrice: t.goldPrice ? new Decimal(t.goldPrice).toFixed(2) : '0.00',
        }))
      })),
      startDate: format(new Date(startDate), 'dd/MM/yyyy'),
      endDate: format(new Date(endDate), 'dd/MM/yyyy'),
      dataEmissaoPdf: format(new Date(), 'dd/MM/yyyy HH:mm:ss'),
    };

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
      console.error('Erro ao gerar PDF do Balancete:', error);
      throw new InternalServerErrorException('Falha ao gerar o PDF do Balancete.');
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }
}
