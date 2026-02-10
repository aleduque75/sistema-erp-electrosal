import {
  Injectable,
  Inject,
  NotFoundException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import {
  IMetalCreditRepository,
} from '@sistema-erp-electrosal/core';
import * as puppeteer from 'puppeteer';
import * as fs from 'fs/promises';
import * as path from 'path';
import { format } from 'date-fns';
import { Buffer } from 'buffer';
import * as Handlebars from 'handlebars';
import { PrismaService } from '../../prisma/prisma.service';
import { MetalAccountEntry } from '@prisma/client';

export interface GerarPdfMetalCreditCommand {
  metalCreditId: string;
  organizationId: string;
}

@Injectable()
export class GerarPdfMetalCreditUseCase {
  private readonly logger = new Logger(GerarPdfMetalCreditUseCase.name);

  constructor(
    @Inject('IMetalCreditRepository')
    private readonly metalCreditRepository: IMetalCreditRepository,
    private readonly prisma: PrismaService,
  ) {
    this.registerHandlebarsHelpers();
  }

  private registerHandlebarsHelpers() {
    if (!Handlebars.helpers.formatarNumero) {
      Handlebars.registerHelper(
        'formatarNumero',
        (valor, casasDecimais = 2) => {
          if (valor === null || valor === undefined || isNaN(Number(valor)))
            return 'N/A';
          return Number(valor).toFixed(casasDecimais).replace('.', ',');
        },
      );
    }

    if (!Handlebars.helpers.formatarData) {
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
      this.logger.error(`Erro ao ler imagem para base64: ${filePath}`, error);
      return null;
    }
  }

  async execute(command: GerarPdfMetalCreditCommand): Promise<Buffer> {
    const { metalCreditId, organizationId } = command;

    const dbMetalCredit = await this.prisma.metalCredit.findUnique({
      where: { id: metalCreditId, organizationId },
      include: {
        client: true,
        chemicalAnalysis: true,
      }
    });

    if (!dbMetalCredit) {
      throw new NotFoundException(`Crédito de metal com ID ${metalCreditId} não encontrado.`);
    }

    // Get usage entries (debits from the same metal account)
    const metalAccount = await this.prisma.metalAccount.findUnique({
      where: {
        organizationId_personId_type: {
          organizationId,
          personId: dbMetalCredit.clientId,
          type: dbMetalCredit.metalType,
        },
      },
    });

    let usageEntries: MetalAccountEntry[] = [];
    if (metalAccount) {
      usageEntries = await this.prisma.metalAccountEntry.findMany({
        where: {
          metalAccountId: metalAccount.id,
          grams: { lt: 0 },
        },
        orderBy: { date: 'desc' },
      });
    }

    // Prepare template data
    const baseDir = process.env.NODE_ENV === 'production'
      ? path.join(process.cwd(), 'dist')
      : path.join(process.cwd(), 'src');

    const templatePath = path.join(
      baseDir,
      'templates',
      'metal-credit-pdf.template.html',
    );
    const htmlTemplateString = await fs.readFile(templatePath, 'utf-8');

    const logoPath = path.join(baseDir, 'assets', 'images', 'logoAtual.png');
    const logoBase64 = await this.getImageAsBase64(logoPath);

    const htmlComLogo = htmlTemplateString.replace(
      '%%LOGO_PLACEHOLDER%%',
      logoBase64 || '',
    );

    const templateData = {
      clientName: dbMetalCredit.client.name,
      metalType: dbMetalCredit.metalType,
      grams: Number(dbMetalCredit.grams),
      gramsOriginal: Number(dbMetalCredit.grams) + Number(dbMetalCredit.settledGrams || 0),
      date: dbMetalCredit.date,
      status: dbMetalCredit.status,
      chemicalAnalysis: dbMetalCredit.chemicalAnalysis,
      usageEntries: usageEntries.map(e => ({
        ...e,
        grams: Math.abs(Number(e.grams)),
      })),
      dataEmissaoPdf: new Date(),
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

      return await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '20mm', right: '15mm', bottom: '20mm', left: '15mm' },
      });
    } catch (error) {
      this.logger.error('Erro ao gerar PDF:', error);
      throw new InternalServerErrorException('Falha ao gerar o PDF do crédito.');
    } finally {
      if (browser) await browser.close();
    }
  }
}
