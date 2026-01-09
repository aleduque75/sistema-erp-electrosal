import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as puppeteer from 'puppeteer';
import * as fs from 'fs/promises';
import * as path from 'path';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Buffer } from 'buffer';
import * as Handlebars from 'handlebars';
import { Decimal } from 'decimal.js';

export interface GerarPdfResumoFinanceiroCommand {
  organizationId: string;
  startDate: string;
  endDate: string;
}

@Injectable()
export class GerarPdfResumoFinanceiroUseCase {
  constructor(private prisma: PrismaService) {
    if (!Handlebars.helpers.formatarNumero) {
      this.registerHandlebarsHelpers();
    }
  }

  private registerHandlebarsHelpers() {
    Handlebars.registerHelper('formatarNumero', (valor: number | Decimal | null | undefined, casasDecimais = 2) => {
      if (valor === null || valor === undefined || isNaN(Number(valor))) {
        return 'N/A';
      }
      return Number(valor).toFixed(casasDecimais).replace('.', ',');
    });

    Handlebars.registerHelper('formatarData', (data: Date | string | null | undefined) => {
      if (!data) return 'N/A';
      try {
        const dateObj = new Date(data);
        if (isNaN(dateObj.getTime())) return 'Data inválida';
        return format(dateObj, 'dd/MM/yyyy');
      } catch (e) {
        return '';
      }
    });

    Handlebars.registerHelper('isPositive', (valor: number | Decimal | null | undefined) => {
        if (valor === null || valor === undefined) return false;
        return Number(valor) >= 0;
    });
  }

  async execute(command: GerarPdfResumoFinanceiroCommand): Promise<Buffer> {
    const { organizationId, startDate, endDate } = command;
    const start = new Date(startDate);
    const end = new Date(endDate);

    const [salesResults, expenses] = await Promise.all([
        this.prisma.sale.findMany({
          where: {
            organizationId,
            status: { not: 'CANCELADO' },
            createdAt: { gte: start, lte: end },
          },
          select: {
            orderNumber: true,
            createdAt: true,
            goldValue: true,
            pessoa: {
              select: {
                name: true,
              }
            },
            adjustment: {
              select: {
                netDiscrepancyGrams: true,
              }
            }
          },
          orderBy: { createdAt: 'asc' },
        }),
        this.prisma.transacao.findMany({
          where: {
            organizationId,
            tipo: 'DEBITO',
            goldAmount: { gt: 0 },
            dataHora: { gte: start, lte: end },
            contaContabil: {
              tipo: 'DESPESA',
            }
          },
          select: {
            descricao: true,
            dataHora: true,
            goldAmount: true,
          },
          orderBy: { dataHora: 'asc' },
        }),
    ]);

    const sales = salesResults.map(sale => {
        const goldValue = sale.goldValue?.toNumber() || 0;
        const profitGold = sale.adjustment?.netDiscrepancyGrams?.toNumber() || 0;
        return { 
          ...sale,
          goldValue,
          profitGold,
          pessoa: { name: sale.pessoa.name },
        };
    });

    const totalSalesGold = sales.reduce((sum, s) => sum + s.goldValue, 0);
    const totalProfitGold = sales.reduce((sum, s) => sum + s.profitGold, 0);
    const totalExpensesGold = expenses.reduce((sum, e) => sum + (e.goldAmount?.toNumber() || 0), 0);
    const finalResultGold = totalProfitGold - totalExpensesGold;

    const templatePath = path.join(
      __dirname,
      '..',
      '..',
      'templates',
      'resumo-financeiro-pdf.template.html',
    );
    const htmlTemplateString = await fs.readFile(templatePath, 'utf-8');
    
    const periodo = `${format(start, 'dd/MM/yyyy')} a ${format(end, 'dd/MM/yyyy')}`;

    const templateData = {
      periodo,
      sales: sales.map(s => ({...s, goldValue: s.goldValue, profitGold: s.profitGold})),
      expenses: expenses.map(e => ({...e, goldAmount: e.goldAmount?.toNumber()})),
      totais: {
        vendasGold: totalSalesGold,
        lucroGold: totalProfitGold,
        despesasGold: totalExpensesGold,
        resultadoFinalGold: finalResultGold,
      },
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
        margin: { top: '20mm', right: '15mm', bottom: '20mm', left: '15mm' },
      });

      return pdfBuffer;
    } catch (error) {
      console.error('Erro ao gerar PDF do Resumo Financeiro:', error);
      throw new InternalServerErrorException('Falha ao gerar o PDF do Resumo Financeiro.');
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }
}
