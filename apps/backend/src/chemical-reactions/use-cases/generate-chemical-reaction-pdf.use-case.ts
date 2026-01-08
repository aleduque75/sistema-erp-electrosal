import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as puppeteer from 'puppeteer';
import * as fs from 'fs/promises';
import * as path from 'path';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import * as Handlebars from 'handlebars';
import { ChemicalReactionStatusPrisma } from '@prisma/client';

export interface GenerateChemicalReactionPdfCommand {
  reactionId: string;
  organizationId: string;
}

@Injectable()
export class GenerateChemicalReactionPdfUseCase {
  private readonly logger = new Logger(GenerateChemicalReactionPdfUseCase.name);

  constructor(private readonly prisma: PrismaService) {
    this.registerHandlebarsHelpers();
  }

  private registerHandlebarsHelpers() {
    if (!Handlebars.helpers.formatNumber) {
      Handlebars.registerHelper(
        'formatNumber',
        (valor, casasDecimais = 2) => {
          if (valor === null || valor === undefined || isNaN(Number(valor)))
            return '0,00';
          return new Intl.NumberFormat('pt-BR', {
            minimumFractionDigits: casasDecimais,
            maximumFractionDigits: casasDecimais,
          }).format(Number(valor));
        },
      );
    }

    if (!Handlebars.helpers.formatDate) {
      Handlebars.registerHelper('formatDate', (data) => {
        if (!data) return '-';
        try {
          const dateObj = new Date(data);
          if (isNaN(dateObj.getTime())) return '-';
          return format(dateObj, 'dd/MM/yyyy', { locale: ptBR });
        } catch (e) {
          return '-';
        }
      });
    }
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
      this.logger.warn(`Erro ao ler imagem para base64: ${filePath}`, error);
      return null;
    }
  }

  async execute(command: GenerateChemicalReactionPdfCommand): Promise<Buffer> {
    const { reactionId, organizationId } = command;

    const reaction = await this.prisma.chemical_reactions.findUnique({
      where: { id: reactionId, organizationId },
      include: {
        outputProduct: true,
        productionBatch: true,
        lots: {
          include: {
            pureMetalLot: true,
          },
        },
        rawMaterialsUsed: {
          include: {
            rawMaterial: true,
          },
        },
      },
    });

    if (!reaction) {
      throw new NotFoundException(`Reação química com ID ${reactionId} não encontrada.`);
    }

    // Preparar dados para o template
    const baseDir = process.env.NODE_ENV === 'production'
      ? path.join(process.cwd(), 'dist')
      : path.join(process.cwd(), 'src');

    const templatePath = path.join(
      baseDir,
      'templates',
      'chemical-reaction-pdf.template.html',
    );
    
    let htmlTemplateString;
    try {
        htmlTemplateString = await fs.readFile(templatePath, 'utf-8');
    } catch (e) {
        // Fallback for dev environment path issues
        htmlTemplateString = await fs.readFile(path.join(process.cwd(), 'apps/backend/src/templates/chemical-reaction-pdf.template.html'), 'utf-8');
    }

    const logoPath = path.join(baseDir, 'assets', 'images', 'logoAtual.png');
    // Em dev, pode ser que o asset esteja em outro lugar, tentar caminho relativo se falhar
    let logoUrl = await this.getImageAsBase64(logoPath);
    if (!logoUrl) {
         // Tentar caminho alternativo comum em dev monorepo
         const altLogoPath = path.join(process.cwd(), 'apps/backend/src/assets/images/logoAtual.png');
         logoUrl = await this.getImageAsBase64(altLogoPath);
    }

    const statusMap: Record<string, string> = {
        STARTED: 'Iniciada',
        PROCESSING: 'Em Processamento',
        PENDING_PURITY: 'Aguardando Pureza',
        PENDING_PURITY_ADJUSTMENT: 'Aguardando Ajuste',
        COMPLETED: 'Finalizada',
        CANCELED: 'Cancelada'
    };

    const isCompleted = reaction.status === ChemicalReactionStatusPrisma.COMPLETED;
    
    // Cálculos de totais
    const totalOutputMetal = (Number(reaction.outputGoldGrams) || 0) + 
                             (Number(reaction.outputBasketLeftoverGrams) || 0) + 
                             (Number(reaction.outputDistillateLeftoverGrams) || 0);
    
    const inputGoldGrams = Number(reaction.inputGoldGrams) || 0;
    const balance = inputGoldGrams - totalOutputMetal;
    const efficiency = inputGoldGrams > 0 
        ? ((totalOutputMetal / inputGoldGrams) * 100).toFixed(2)
        : '0.00';

    const balanceColor = Math.abs(balance) < 0.01 ? 'green' : (balance > 0 ? 'red' : 'blue');

    const templateData = {
      logoUrl,
      currentDate: format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR }),
      reactionNumber: reaction.reactionNumber,
      reactionDate: reaction.reactionDate,
      status: reaction.status,
      statusTranslated: statusMap[reaction.status] || reaction.status,
      metalType: reaction.metalType,
      productName: reaction.outputProduct?.name || 'Produto não definido',
      batchNumber: reaction.productionBatch?.batchNumber,
      notes: reaction.notes,
      
      // Entrada
      inputGoldGrams: reaction.inputGoldGrams,
      sourceLots: reaction.lots.map(l => ({
        lotNumber: l.pureMetalLot?.lotNumber || l.pureMetalLotId.substring(0, 8),
        description: l.pureMetalLot?.description || '-',
        gramsToUse: l.gramsToUse
      })),
      rawMaterials: reaction.rawMaterialsUsed.map(r => ({
        name: r.rawMaterial.name,
        quantity: r.quantity
      })),

      // Saída
      isCompleted,
      outputProductGrams: reaction.outputProductGrams,
      outputGoldGrams: reaction.outputGoldGrams,
      outputBasketLeftoverGrams: reaction.outputBasketLeftoverGrams,
      outputDistillateLeftoverGrams: reaction.outputDistillateLeftoverGrams,
      totalOutputMetal,
      
      // Balanço
      balance,
      balanceColor,
      efficiency
    };

    const template = Handlebars.compile(htmlTemplateString);
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
        margin: { top: '15mm', right: '15mm', bottom: '15mm', left: '15mm' },
      });

      return Buffer.from(pdfBuffer);
    } catch (error) {
      this.logger.error('Erro ao gerar PDF da reação química:', error);
      throw new InternalServerErrorException('Falha ao gerar o PDF do relatório.');
    } finally {
      if (browser) await browser.close();
    }
  }
}
