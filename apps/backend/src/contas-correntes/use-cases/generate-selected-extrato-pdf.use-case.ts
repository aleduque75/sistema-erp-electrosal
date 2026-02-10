
import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as puppeteer from 'puppeteer';
import * as fs from 'fs/promises';
import * as path from 'path';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import * as Handlebars from 'handlebars';
import { Decimal } from 'decimal.js';

export interface GenerateSelectedExtratoPdfCommand {
  transactionIds: string[];
  organizationId: string;
}

@Injectable()
export class GenerateSelectedExtratoPdfUseCase {
  private readonly logger = new Logger(GenerateSelectedExtratoPdfUseCase.name);

  constructor(private readonly prisma: PrismaService) {
    this.registerHandlebarsHelpers();
  }

  private registerHandlebarsHelpers() {
    Handlebars.registerHelper('formatCurrency', (value) => {
      if (value === null || value === undefined) return '-';
      return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value));
    });

    Handlebars.registerHelper('formatGold', (value) => {
        if (value === null || value === undefined) return '-';
        return new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 4, maximumFractionDigits: 4 }).format(Number(value)) + ' g';
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
      this.logger.warn(`Erro ao ler imagem para base64: ${filePath}`, error);
      return null;
    }
  }

  async execute(command: GenerateSelectedExtratoPdfCommand): Promise<Buffer> {
    const { transactionIds, organizationId } = command;

    if (!transactionIds || transactionIds.length === 0) {
      throw new BadRequestException('Nenhuma transação selecionada.');
    }

    const transactions = await this.prisma.transacao.findMany({
      where: {
        id: { in: transactionIds },
        organizationId,
      },
      include: {
        contaCorrente: true,
        contaContabil: true,
        fornecedor: { include: { pessoa: true } },
        linkedTransaction: { include: { contaCorrente: true } },
      },
      orderBy: {
        dataHora: 'asc',
      },
    });

    if (transactions.length === 0) {
      throw new NotFoundException('Nenhuma das transações selecionadas foi encontrada.');
    }

    const contaCorrente = transactions[0].contaCorrente;
    if (!contaCorrente) {
      throw new NotFoundException('Conta corrente não encontrada para as transações selecionadas.');
    }

    // Totals calculation
    let totalBRL = new Decimal(0);
    let totalGold = new Decimal(0);

    const transactionsWithDetails = transactions.map(t => {
        const valorBRL = new Decimal(t.valor);
        const valorGold = new Decimal(t.goldAmount || 0);

        if (t.tipo === 'CREDITO') {
            totalBRL = totalBRL.add(valorBRL);
            totalGold = totalGold.add(valorGold);
        } else {
            totalBRL = totalBRL.sub(valorBRL);
            totalGold = totalGold.sub(valorGold);
        }
        
        let entityName = '';
        if (t.fornecedor?.pessoa?.name) entityName = t.fornecedor.pessoa.name;
        else if (t.linkedTransaction?.contaCorrente?.nome) entityName = `Transferência: ${t.linkedTransaction.contaCorrente.nome}`;
        else if (t.contaContabil?.nome) entityName = t.contaContabil.nome;

        return {
            date: format(new Date(t.dataHora), 'dd/MM/yy', { locale: ptBR }),
            description: t.descricao,
            entityName,
            quotation: t.goldPrice ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(t.goldPrice)) : '-',
            amountBRL: t.tipo === 'DEBITO' ? valorBRL.negated() : valorBRL,
            amountGold: t.tipo === 'DEBITO' ? valorGold.negated() : valorGold,
        };
    });

    const baseDir = process.env.NODE_ENV === 'production' ? path.join(process.cwd(), 'dist') : path.join(process.cwd(), 'src');
    const templatePath = path.join(baseDir, 'templates', 'extrato-selecionado-pdf.template.html');
    let htmlTemplateString;
    try {
        htmlTemplateString = await fs.readFile(templatePath, 'utf-8');
    } catch (e) {
        htmlTemplateString = await fs.readFile(path.join(process.cwd(), 'apps/backend/src/templates/extrato-selecionado-pdf.template.html'), 'utf-8');
    }
    
    const logoPath = path.join(baseDir, 'assets', 'images', 'logoAtual.png');
    let logoUrl = await this.getImageAsBase64(logoPath);
    if (!logoUrl) {
         const altLogoPath = path.join(process.cwd(), 'apps/backend/src/assets/images/logoAtual.png');
         logoUrl = await this.getImageAsBase64(altLogoPath);
    }

    const templateData = {
      logoUrl,
      currentDate: format(new Date(), 'dd/MM/yy HH:mm', { locale: ptBR }),
      accountName: contaCorrente.nome,
      accountNumber: contaCorrente.numeroConta,
      totalBRL: totalBRL.toNumber(),
      totalGold: totalGold.toNumber(),
      transactions: transactionsWithDetails,
    };

    const template = Handlebars.compile(htmlTemplateString);
    const htmlContent = template(templateData);

    let browser;
    try {
      browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
      const page = await browser.newPage();
      await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '10mm', right: '10mm', bottom: '10mm', left: '10mm' },
      });

      return Buffer.from(pdfBuffer);
    } catch (error) {
      this.logger.error('Erro ao gerar PDF do extrato selecionado:', error);
      throw new InternalServerErrorException('Falha ao gerar o PDF do relatório.');
    } finally {
      if (browser) await browser.close();
    }
  }
}
