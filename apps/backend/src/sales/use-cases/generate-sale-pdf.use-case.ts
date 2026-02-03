import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { SalesService } from '../sales.service';
import * as puppeteer from 'puppeteer';
import * as fs from 'fs/promises';
import * as path from 'path';
import { format } from 'date-fns';
import { Buffer } from 'buffer';
import * as Handlebars from 'handlebars';

export interface GenerateSalePdfCommand {
  saleId: string;
  organizationId: string;
}

@Injectable()
export class GenerateSalePdfUseCase {
  private readonly logger = new Logger(GenerateSalePdfUseCase.name);

  constructor(private readonly salesService: SalesService) {
    this.registerHandlebarsHelpers();
  }

  private registerHandlebarsHelpers() {
    Handlebars.registerHelper('formatarNumero', (valor, casasDecimais = 2) => {
      if (valor === null || valor === undefined || isNaN(Number(valor)))
        return '0,00';
      // Check if casasDecimais is actually the options object from Handlebars
      if (typeof casasDecimais === 'object') {
        casasDecimais = 2;
      }
      return Number(valor).toFixed(casasDecimais).replace('.', ',');
    });

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

    Handlebars.registerHelper('multiply', (a, b) => {
      return Number(a) * Number(b);
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

  async execute(command: GenerateSalePdfCommand): Promise<Buffer> {
    const { saleId, organizationId } = command;

    const sale = await this.salesService.findOne(organizationId, saleId);

    if (!sale) {
      throw new NotFoundException(`Venda com ID ${saleId} não encontrada.`);
    }

    // Caminho para o diretório de assets (dist ou src)
    const baseDir =
      process.env.NODE_ENV === 'production'
        ? path.join(process.cwd(), 'dist')
        : path.join(process.cwd(), 'src');

    const templatePath = path.join(
      baseDir,
      'templates',
      'sale-pdf.template.html',
    );

    let htmlTemplateString;
    try {
      htmlTemplateString = await fs.readFile(templatePath, 'utf-8');
    } catch (error) {
      // Fallback logic similar to other use cases
      const devTemplatePath = path.join(
        process.cwd(),
        'src',
        'templates',
        'sale-pdf.template.html',
      );
      try {
        htmlTemplateString = await fs.readFile(devTemplatePath, 'utf-8');
      } catch (e) {
        // Try apps/backend/src/templates
        const monorepoPath = path.join(
          process.cwd(),
          'apps/backend/src/templates/sale-pdf.template.html',
        );
        htmlTemplateString = await fs.readFile(monorepoPath, 'utf-8');
      }
    }

    const logoPath = path.join(baseDir, 'assets', 'images', 'logoAtual.png');
    const logoBase64 = await this.getImageAsBase64(logoPath);

    const htmlComLogo = htmlTemplateString.replace(
      '%%LOGO_PLACEHOLDER%%',
      logoBase64 || '',
    );

    const templateData = {
      ...sale,
      dataEmissaoPdf: new Date(),
    };

    const template = Handlebars.compile(htmlComLogo);
    const htmlContent = template(templateData);

    let browser;
    try {
      browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage', // Adicione esta linha para evitar crashes de memória na VPS
          '--disable-gpu', // Opcional: economiza recursos em servidores sem placa de vídeo
        ],
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
      this.logger.error('Erro ao gerar PDF:', error);
      throw new InternalServerErrorException('Falha ao gerar o PDF da venda.');
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }
}
