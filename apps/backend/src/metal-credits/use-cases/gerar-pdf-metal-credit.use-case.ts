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

import { filterEntriesForCredit, enrichUsageEntry } from '../utils/metal-credit-usage.helper';

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

    if (!Handlebars.helpers.formatarNumeroAnalise) {
      Handlebars.registerHelper('formatarNumeroAnalise', (numero) => {
        if (!numero) return '';
        const clean = String(numero).replace(/^[#\s]*crr-?/i, '').trim();
        return `#CRR-${clean || numero}`;
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
      const allNegativeEntries = await this.prisma.metalAccountEntry.findMany({
        where: {
          metalAccountId: metalAccount.id,
          grams: { lt: 0 },
        },
        orderBy: { date: 'desc' },
      });

      const txIds = allNegativeEntries
        .filter((e) => e.type === 'CASH_PAYMENT' || e.type === 'CLIENT_CREDIT_PAYMENT')
        .map((e) => e.sourceId)
        .filter((id): id is string => !!id);

      const txMap = new Map<string, string>();
      if (txIds.length > 0) {
        const transactions = await this.prisma.transacao.findMany({
          where: { id: { in: txIds } },
          select: { id: true, descricao: true },
        });
        transactions.forEach((t) => txMap.set(t.id, t.descricao || ''));
      }

      usageEntries = filterEntriesForCredit(
        {
          id: dbMetalCredit.id,
          clientId: dbMetalCredit.clientId,
          metalType: dbMetalCredit.metalType,
          grams: dbMetalCredit.grams,
          settledGrams: dbMetalCredit.settledGrams,
          date: dbMetalCredit.date,
          createdAt: dbMetalCredit.createdAt,
          chemicalAnalysisId: dbMetalCredit.chemicalAnalysisId,
          chemicalAnalysis: dbMetalCredit.chemicalAnalysis,
        },
        allNegativeEntries,
        txMap,
      );
    }

    // Prepare template data
    let htmlTemplateString = '';
    const possibleTemplatePaths = [
      path.join(process.cwd(), 'apps', 'backend', 'dist', 'templates', 'metal-credit-pdf.template.html'),
      path.join(process.cwd(), 'apps', 'backend', 'src', 'templates', 'metal-credit-pdf.template.html'),
      path.join(process.cwd(), 'dist', 'templates', 'metal-credit-pdf.template.html'),
      path.join(process.cwd(), 'src', 'templates', 'metal-credit-pdf.template.html'),
      path.join(__dirname, '..', '..', 'templates', 'metal-credit-pdf.template.html'),
      path.join(__dirname, '..', '..', '..', 'src', 'templates', 'metal-credit-pdf.template.html'),
      path.join(__dirname, '..', '..', '..', 'dist', 'templates', 'metal-credit-pdf.template.html'),
    ];

    for (const p of possibleTemplatePaths) {
      try {
        htmlTemplateString = await fs.readFile(p, 'utf-8');
        if (htmlTemplateString) break;
      } catch (e) {
        // try next path
      }
    }

    if (!htmlTemplateString) {
      this.logger.error(`Template metal-credit-pdf.template.html não encontrado em nenhum dos caminhos: ${possibleTemplatePaths.join(', ')}`);
      throw new InternalServerErrorException('Template do extrato de crédito não encontrado.');
    }

    let logoBase64: string | null = null;
    const possibleLogoPaths = [
      path.join(process.cwd(), 'apps', 'backend', 'src', 'assets', 'images', 'logoAtual.png'),
      path.join(process.cwd(), 'apps', 'backend', 'dist', 'assets', 'images', 'logoAtual.png'),
      path.join(process.cwd(), 'src', 'assets', 'images', 'logoAtual.png'),
      path.join(process.cwd(), 'dist', 'assets', 'images', 'logoAtual.png'),
      path.join(__dirname, '..', '..', 'assets', 'images', 'logoAtual.png'),
      path.join(__dirname, '..', '..', '..', 'src', 'assets', 'images', 'logoAtual.png'),
    ];

    for (const lp of possibleLogoPaths) {
      try {
        logoBase64 = await this.getImageAsBase64(lp);
        if (logoBase64) break;
      } catch (e) {
        // try next logo
      }
    }

    const htmlComLogo = htmlTemplateString.replace(
      '%%LOGO_PLACEHOLDER%%',
      logoBase64 || '',
    );

    const enrichedUsageEntries: any[] = [];
    for (const entry of usageEntries) {
      try {
        const enriched = await enrichUsageEntry(this.prisma, entry);
        enrichedUsageEntries.push({
          ...enriched,
          grams: Math.abs(Number(enriched.grams)),
        });
      } catch (err) {
        enrichedUsageEntries.push({
          ...entry,
          grams: Math.abs(Number(entry.grams)),
        });
      }
    }

    const templateData = {
      clientName: dbMetalCredit.client.name,
      metalType: dbMetalCredit.metalType,
      grams: Number(dbMetalCredit.grams),
      gramsOriginal: Number(dbMetalCredit.grams) + Number(dbMetalCredit.settledGrams || 0),
      date: dbMetalCredit.date,
      status: dbMetalCredit.status,
      chemicalAnalysis: dbMetalCredit.chemicalAnalysis,
      usageEntries: enrichedUsageEntries,
      dataEmissaoPdf: new Date(),
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
          '--no-first-run',
          '--no-zygote',
        ],
      });
      const page = await browser.newPage();
      await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

      const pdfUint8 = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '15mm', right: '15mm', bottom: '15mm', left: '15mm' },
      });

      return Buffer.from(pdfUint8);
    } catch (error) {
      this.logger.error('Erro ao gerar PDF do crédito de metal:', error);
      throw new InternalServerErrorException('Falha ao gerar o PDF do crédito.');
    } finally {
      if (browser) {
        try {
          await browser.close();
        } catch (closeErr) {
          this.logger.warn('Erro ao fechar o browser do puppeteer:', closeErr);
        }
      }
    }
  }
}
