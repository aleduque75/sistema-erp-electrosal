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
import { GetAccountsPayableReportUseCase } from './get-accounts-payable-report.use-case';
import { GetAccountsPayableReportQueryDto } from '../dto/get-accounts-payable-report.dto';

@Injectable()
export class GerarPdfContasAPagarUseCase {
  constructor(
    private readonly getAccountsPayableReportUseCase: GetAccountsPayableReportUseCase,
  ) {
    if (!Handlebars.helpers.formatarMoeda) {
      this.registerHandlebarsHelpers();
    }
  }

  private registerHandlebarsHelpers() {
    Handlebars.registerHelper(
      'formatarNumero',
      (valor, casasDecimais = 2) => {
        if (valor === null || valor === undefined || isNaN(Number(valor)))
          return 'N/A';
        return Number(valor).toLocaleString('pt-BR', {
          minimumFractionDigits: casasDecimais,
          maximumFractionDigits: casasDecimais,
        });
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

    Handlebars.registerHelper('formatarMoeda', (valor) => {
        if (valor === null || valor === undefined || isNaN(Number(valor)))
            return 'R$ 0,00';
        return Number(valor).toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL',
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
      console.error(`Erro ao ler imagem para base64: ${filePath}`, error);
      return null;
    }
  }

  async execute(query: GetAccountsPayableReportQueryDto): Promise<Buffer> {
    const reportData = await this.getAccountsPayableReportUseCase.execute(query);

    const srcDir = path.join(process.cwd(), 'src');

    const templatePath = path.join(
      srcDir,
      'templates',
      'contas-a-pagar-pdf.template.html',
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
      ...reportData,
      dataEmissaoPdf: new Date(),
      filters: query,
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
      console.error('Erro ao gerar PDF:', error);
      throw new InternalServerErrorException('Falha ao gerar o PDF do relatório de contas a pagar.');
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }
}
