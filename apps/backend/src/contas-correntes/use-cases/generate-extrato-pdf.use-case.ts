
import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ContasCorrentesService } from '../contas-correntes.service';
import * as puppeteer from 'puppeteer';
import * as fs from 'fs/promises';
import * as path from 'path';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import * as Handlebars from 'handlebars';

export interface GenerateExtratoPdfCommand {
  contaCorrenteId: string;
  organizationId: string;
  startDate: Date;
  endDate: Date;
}

@Injectable()
export class GenerateExtratoPdfUseCase {
  private readonly logger = new Logger(GenerateExtratoPdfUseCase.name);

  constructor(private readonly contasCorrentesService: ContasCorrentesService) {
    this.registerHandlebarsHelpers();
  }

  private registerHandlebarsHelpers() {
    Handlebars.registerHelper('formatCurrency', (value) => {
        if (value === null || value === undefined) return '-';
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value));
    });

    Handlebars.registerHelper('formatGold', (value) => {
        if (value === null || value === undefined) return '-';
        return new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(value)) + ' g';
    });

    Handlebars.registerHelper('isNegative', (value) => {
        return Number(value) < 0;
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

  async execute(command: GenerateExtratoPdfCommand): Promise<Buffer> {
    const { contaCorrenteId, organizationId, startDate, endDate } = command;

    const extratoData = await this.contasCorrentesService.getExtrato(
        organizationId,
        contaCorrenteId,
        startDate,
        endDate
    );

    if (!extratoData) {
      throw new NotFoundException(`Dados do extrato não encontrados.`);
    }

    const baseDir = process.env.NODE_ENV === 'production'
      ? path.join(process.cwd(), 'dist')
      : path.join(process.cwd(), 'src');

    // Caminho para o template
    // Tenta primeiro no caminho de dev (apps/backend/src/...) se não achar no dist
    let templatePath = path.join(baseDir, 'templates', 'extrato-conta-pdf.template.html');
    let htmlTemplateString;
    try {
        htmlTemplateString = await fs.readFile(templatePath, 'utf-8');
    } catch (e) {
        // Fallback para ambiente de desenvolvimento
        htmlTemplateString = await fs.readFile(path.join(process.cwd(), 'apps/backend/src/templates/extrato-conta-pdf.template.html'), 'utf-8');
    }

    // Logo
    const logoPath = path.join(baseDir, 'assets', 'images', 'logoAtual.png');
    let logoUrl = await this.getImageAsBase64(logoPath);
    if (!logoUrl) {
         const altLogoPath = path.join(process.cwd(), 'apps/backend/src/assets/images/logoAtual.png');
         logoUrl = await this.getImageAsBase64(altLogoPath);
    }

    // Calcular saldos acumulados para cada linha
    let runningBalanceBRL = Number(extratoData.saldoAnteriorBRL);
    let runningBalanceGold = Number(extratoData.saldoAnteriorGold);

    const transactionsWithBalance = extratoData.transacoes.map(t => {
        const valorBRL = Number(t.valor);
        const valorGold = Number(t.goldAmount) || 0;

        if (t.tipo === 'CREDITO') {
            runningBalanceBRL += valorBRL;
            runningBalanceGold += valorGold;
        } else {
            runningBalanceBRL -= valorBRL;
            runningBalanceGold -= valorGold;
        }

        // Determinar nome da entidade (Fornecedor ou Contrapartida)
        let entityName = '';
        if (t.fornecedorNome) entityName = t.fornecedorNome;
        else if (t.contrapartida?.contaCorrente?.nome) entityName = `Transferência: ${t.contrapartida.contaCorrente.nome}`;
        else if (t.contaContabilNome) entityName = t.contaContabilNome;

        return {
            date: format(new Date(t.dataHora), 'dd/MM/yy', { locale: ptBR }),
            description: t.descricao,
            entityName,
            quotation: t.goldPrice ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(t.goldPrice)) : '-',
            amountBRL: t.tipo === 'DEBITO' ? -valorBRL : valorBRL,
            amountGold: t.tipo === 'DEBITO' ? -valorGold : valorGold,
            balanceBRL: runningBalanceBRL,
            balanceGold: runningBalanceGold
        };
    });

    const templateData = {
      logoUrl,
      currentDate: format(new Date(), 'dd/MM/yy HH:mm', { locale: ptBR }),
      accountName: extratoData.contaCorrente.nome,
      accountNumber: extratoData.contaCorrente.numeroConta,
      currency: extratoData.contaCorrente.moeda,
      startDate: format(startDate, 'dd/MM/yy'),
      endDate: format(endDate, 'dd/MM/yy'),
      
      saldoAnteriorBRL: extratoData.saldoAnteriorBRL,
      saldoAnteriorGold: extratoData.saldoAnteriorGold,
      
      saldoFinalBRL: extratoData.saldoFinalBRL,
      saldoFinalGold: extratoData.saldoFinalGold,

      transactions: transactionsWithBalance
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
        margin: { top: '10mm', right: '10mm', bottom: '10mm', left: '10mm' },
      });

      return Buffer.from(pdfBuffer);
    } catch (error) {
      this.logger.error('Erro ao gerar PDF do extrato:', error);
      throw new InternalServerErrorException('Falha ao gerar o PDF do relatório.');
    } finally {
      if (browser) await browser.close();
    }
  }
}
