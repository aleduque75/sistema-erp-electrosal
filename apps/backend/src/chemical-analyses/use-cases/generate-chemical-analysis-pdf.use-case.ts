import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ChemicalAnalysesRepository } from '../repositories/chemical-analyses.repository';
import * as puppeteer from 'puppeteer';
import * as fs from 'fs/promises';
import * as path from 'path';
import { format } from 'date-fns';
import { Buffer } from 'buffer';
import * as Handlebars from 'handlebars';
import { formatDate } from '../../common/utils/date-utils';

export interface GenerateChemicalAnalysisPdfCommand {
  analiseId: string;
  organizationId: string;
  incluirImagens?: boolean;
}

@Injectable()
export class GenerateChemicalAnalysisPdfUseCase {
  private readonly logger = new Logger(GenerateChemicalAnalysisPdfUseCase.name);

  constructor(private readonly chemicalAnalysesRepository: ChemicalAnalysesRepository) {
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
      return formatDate(data, 'dd/MM/yyyy');
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
      if (!filePath) return null;

      let imageBuffer: Buffer;
      let detectedMime = 'image/jpeg';

      if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
        // Se for rota interna do sistema /api/media/file/, tenta ler direto do disco local se disponível
        if (filePath.includes('/api/media/file/')) {
          const filename = filePath.split('/api/media/file/').pop();
          if (filename) {
            const localUploadPath = path.join(process.cwd(), 'uploads', filename);
            try {
              imageBuffer = await fs.readFile(localUploadPath);
              return this.bufferToBase64(imageBuffer, filename);
            } catch {
              // Prossegue para fetch HTTP se não estiver local
            }
          }
        }

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout
        try {
          const response = await fetch(filePath, { signal: controller.signal });
          clearTimeout(timeout);
          if (!response.ok) {
            this.logger.warn(`Falha ao baixar imagem remota ${filePath}: HTTP ${response.status}`);
            return null;
          }
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.startsWith('image/')) {
            detectedMime = contentType;
          }
          const arrayBuffer = await response.arrayBuffer();
          imageBuffer = Buffer.from(arrayBuffer);
        } catch (fetchErr: any) {
          clearTimeout(timeout);
          this.logger.error(`Erro ao fazer download da imagem ${filePath}: ${fetchErr.message}`);
          return null;
        }
      } else {
        let absolutePath = filePath;
        if (filePath.startsWith('/uploads/')) {
          absolutePath = path.join(process.cwd(), filePath.substring(1));
        } else if (!path.isAbsolute(filePath)) {
          absolutePath = path.join(process.cwd(), filePath);
        }
        imageBuffer = await fs.readFile(absolutePath);
      }

      return this.bufferToBase64(imageBuffer, filePath, detectedMime);
    } catch (error: any) {
      this.logger.error(`Erro ao processar imagem para PDF: ${filePath}`, error);
      return null;
    }
  }

  private bufferToBase64(buffer: Buffer, filePath: string, defaultMime = 'image/jpeg'): string {
    const ext = path.extname(filePath.split('?')[0]).toLowerCase();
    let mimeType = defaultMime;
    if (ext === '.png') mimeType = 'image/png';
    else if (ext === '.webp') mimeType = 'image/webp';
    else if (ext === '.jpg' || ext === '.jpeg') mimeType = 'image/jpeg';
    else if (ext === '.gif') mimeType = 'image/gif';

    const base64Image = buffer.toString('base64');
    return `data:${mimeType};base64,${base64Image}`;
  }

  async execute(command: GenerateChemicalAnalysisPdfCommand): Promise<Buffer> {
    const { analiseId, organizationId, incluirImagens = true } = command;

    const analise = await this.chemicalAnalysesRepository.findByIdWithDetails(
      analiseId,
      organizationId,
    );
    if (!analise) {
      throw new NotFoundException(
        `Análise química com ID ${analiseId} não encontrada.`,
      );
    }

    // Processamento de imagens se solicitado
    let imagensParaPdf: { base64: string; index: number; legenda: string }[] = [];
    if (incluirImagens && Array.isArray(analise.media) && analise.media.length > 0) {
      this.logger.log(
        `Processando ${analise.media.length} mídias para inclusão no laudo da análise ${analise.numeroAnalise || analiseId}...`,
      );

      const promises = analise.media.map(async (item: any, idx: number) => {
        const filePath = item.path || item.url;
        if (!filePath) return null;
        const base64 = await this.getImageAsBase64(filePath);
        if (!base64) return null;
        return {
          base64,
          index: idx + 1,
          legenda: `Foto ${idx + 1}${item.filename ? ` - ${item.filename}` : ''}`,
        };
      });

      const resolved = await Promise.all(promises);
      imagensParaPdf = resolved.filter(
        (img): img is { base64: string; index: number; legenda: string } => img !== null,
      );
      this.logger.log(
        `${imagensParaPdf.length} de ${analise.media.length} imagens convertidas para o PDF.`,
      );
    }

    const baseDir = process.env.NODE_ENV === 'production'
      ? path.join(process.cwd(), 'dist')
      : path.join(process.cwd(), 'src');

    const templatePath = path.join(
      baseDir,
      'templates',
      'analise-quimica-pdf.template.html',
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

    const templateData = {
      ...analise,
      dataEmissaoPdf: new Date(),
      statusAnalise: (analise.status || '').replace(/_/g, ' '),
      temImagens: imagensParaPdf.length > 0,
      imagens: imagensParaPdf,
    };

    const template = Handlebars.compile(htmlComLogo);
    const htmlContent = template(templateData);

    let browser;
    try {
      browser = await puppeteer.launch({
        headless: true,
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
      });
      const page = await browser.newPage();
      await page.setContent(htmlContent, { waitUntil: 'load' });

      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '15mm', right: '12mm', bottom: '15mm', left: '12mm' },
      });

      return Buffer.from(pdfBuffer);
    } catch (error) {
      this.logger.error('Erro ao gerar PDF:', error);
      throw new InternalServerErrorException('Falha ao gerar o PDF da análise.');
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }
}
