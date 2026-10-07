import {
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import * as puppeteer from 'puppeteer';
import * as fs from 'fs/promises';
import * as path from 'path';
import { format } from 'date-fns';
import { Buffer } from 'buffer';
import * as Handlebars from 'handlebars';
import { GetBalanceSheetReportDto } from '../dto/get-balance-sheet-report.dto';
import { GetBalanceSheetReportUseCase } from './get-balance-sheet-report.use-case';

@Injectable()
export class GenerateBalanceSheetPdfUseCase {
  constructor(
    private readonly getBalanceSheetReportUseCase: GetBalanceSheetReportUseCase,
  ) {
    this.registerHandlebarsHelpers();
  }

  private registerHandlebarsHelpers() {
    Handlebars.registerHelper('formatarNumero', (valor, casasDecimais = 2) => {
      if (valor === null || valor === undefined || isNaN(Number(valor)))
        return '0,00';
      return Number(valor).toLocaleString('pt-BR', {
        minimumFractionDigits: casasDecimais,
        maximumFractionDigits: casasDecimais,
      });
    });

    Handlebars.registerHelper('formatarMoeda', (valor) => {
      if (valor === null || valor === undefined || isNaN(Number(valor)))
        return '0,00';
      return Number(valor).toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
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
      return null;
    }
  }

  async execute(
    organizationId: string,
    dto: GetBalanceSheetReportDto,
  ): Promise<Buffer> {
    const reportData = await this.getBalanceSheetReportUseCase.execute(
      organizationId,
      dto,
    );

    const srcDir = path.join(process.cwd(), 'src');
    const templatePath = path.join(
      srcDir,
      'templates',
      'balanco-patrimonial-pdf.template.html',
    );
    const htmlTemplateString = await fs.readFile(templatePath, 'utf-8');

    const logoPath = path.join(srcDir, 'assets', 'images', 'logoAtual.png');
    const logoBase64 = await this.getImageAsBase64(logoPath);

    const htmlComLogo = htmlTemplateString.replace(
      '%%LOGO_PLACEHOLDER%%',
      logoBase64 || '',
    );

    const asOfDateFormatted = format(
      new Date(reportData.asOfDate.includes('T') ? reportData.asOfDate : `${reportData.asOfDate}T00:00:00`),
      'dd/MM/yyyy',
    );

    const templateData = {
      ...reportData,
      asOfDate: asOfDateFormatted,
      dataEmissao: format(new Date(), 'dd/MM/yyyy HH:mm:ss'),
    };

    const template = Handlebars.compile(htmlComLogo);
    const htmlContent = template(templateData);

    let browser;
    try {
      browser = await puppeteer.launch({
        headless: true,
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
        ],
      });
      const page = await browser.newPage();
      await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

      const pdfBuffer = await page.pdf({
        format: 'A4',
        landscape: true, // Balanço é perfeito em paisagem (Ativo lado a lado com Passivo)
        printBackground: true,
        margin: { top: '15mm', right: '12mm', bottom: '15mm', left: '12mm' },
      });

      return pdfBuffer;
    } catch (error) {
      console.error('Erro ao gerar PDF do Balanço Patrimonial:', error);
      throw new InternalServerErrorException(
        'Falha ao gerar o PDF do Balanço Patrimonial.',
      );
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }
}
