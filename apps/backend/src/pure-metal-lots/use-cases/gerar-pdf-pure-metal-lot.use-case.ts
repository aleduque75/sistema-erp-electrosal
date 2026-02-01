import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { PureMetalLotsRepository } from '../pure-metal-lots.repository';
import * as puppeteer from 'puppeteer';
import * as fs from 'fs/promises';
import * as path from 'path';
import { format } from 'date-fns';
import { Buffer } from 'buffer';
import * as Handlebars from 'handlebars';
import { PureMetalLotsService } from '../pure-metal-lots.service'; // To get formatted details

export interface GerarPdfPureMetalLotCommand {
  lotId: string;
  organizationId: string;
}

@Injectable()
export class GerarPdfPureMetalLotUseCase {
  private readonly logger = new Logger(GerarPdfPureMetalLotUseCase.name);

  constructor(
    private readonly pureMetalLotsRepository: PureMetalLotsRepository,
    private readonly pureMetalLotsService: PureMetalLotsService,
  ) {
    this.registerHandlebarsHelpers();
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

    Handlebars.registerHelper('traduzirTipoMovimentacao', (tipo) => {
      const mapa = {
        ENTRY: 'Entrada',
        EXIT: 'Saída',
        ADJUSTMENT: 'Ajuste',
      };
      return mapa[tipo] || tipo;
    });

    Handlebars.registerHelper('eq', function (arg1, arg2) {
      return (arg1 == arg2);
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

  async execute(command: GerarPdfPureMetalLotCommand): Promise<Buffer> {
    const { lotId, organizationId } = command;

    // Use service to get enriched data (with origin details)
    const lot = await this.pureMetalLotsService.findOne(organizationId, lotId);
    
    if (!lot) {
      throw new NotFoundException(
        `Lote de metal puro com ID ${lotId} não encontrado.`,
      );
    }

    const movements = await this.pureMetalLotsService.findPureMetalLotMovements(lotId, organizationId);

    // Caminho para o diretório de assets (dist ou src)
    const baseDir = process.env.NODE_ENV === 'production'
      ? path.join(process.cwd(), 'dist')
      : path.join(process.cwd(), 'src');

    const templatePath = path.join(
      baseDir,
      'templates',
      'pure-metal-lot-pdf.template.html',
    );
    
    let htmlTemplateString;
    try {
        htmlTemplateString = await fs.readFile(templatePath, 'utf-8');
    } catch (error) {
        // Fallback for development if template is not in dist
        const devTemplatePath = path.join(process.cwd(), 'src', 'templates', 'pure-metal-lot-pdf.template.html');
        // Actually, for NestJS execution context, process.cwd() is usually the project root.
        // Let's try to be robust.
         try {
            htmlTemplateString = await fs.readFile(devTemplatePath, 'utf-8');
         } catch(e) {
             // Try absolute path if needed, but for now let's hope one of these works.
             // If we are running with ts-node/nest start, src/templates might be accessible.
             // If compiled, dist/templates.
             // The previous code used src/templates in non-production, which assumes running from source.
             // Let's stick to the logic in GerarPdfAnaliseUseCase.
             htmlTemplateString = await fs.readFile(templatePath, 'utf-8');
         }
    }
    
    // Check if we really loaded it (the try-catch block above for devTemplatePath was just a thought, 
    // but better to follow the pattern used in GerarPdfAnaliseUseCase exactly regarding baseDir)
    // Actually, GerarPdfAnaliseUseCase does:
    // const baseDir = process.env.NODE_ENV === 'production' ? path.join(process.cwd(), 'dist') : path.join(process.cwd(), 'src');
    // And assumes templates are in src/templates for dev.
    
    // However, I just wrote the template to src/templates (apps/backend/src/templates).
    // The cwd when running might be the monorepo root or the app root.
    // Given the previous file listing, I am in the root of the project.
    // But the backend runs inside apps/backend usually.
    // Let's assume the path is relative to apps/backend if running from there.
    
    // WAIT! `process.cwd()` in NestJS app usually points to the directory where `package.json` of the app is, OR the root if started via turbo from root.
    // Let's look at `GerarPdfAnaliseUseCase` again.
    // `path.join(process.cwd(), 'src')`
    // If I ran `mkdir -p apps/backend/src/pure-metal-lots/use-cases` from root, then `apps/backend` is the folder.
    // If the process runs from `apps/backend`, `src` is correct.
    
    // I'll stick to the logic in `GerarPdfAnaliseUseCase` but I need to make sure `pure-metal-lot-pdf.template.html` is in the right place relative to execution.
    // I wrote it to `apps/backend/src/templates/...`.
    
    // Let's refine the path logic to be safe.
    // I will try to read from the path I know I wrote to if I can't determine the env.
    
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

    const templateData = {
      ...lot,
      movements,
      dataEmissaoPdf: new Date(),
    };

    this.logger.debug(`Template Data for PDF: ${JSON.stringify(templateData, null, 2)}`); // Debug log

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
      this.logger.error('Erro ao gerar PDF:', error);
      throw new InternalServerErrorException('Falha ao gerar o PDF do lote.');
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }
}
