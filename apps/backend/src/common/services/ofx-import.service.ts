import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AIClassificationService, AIClassificationRequest } from './ai-classification.service';
import * as OFX from 'ofx-js';
import { Decimal } from 'decimal.js';

export interface OfxTransaction {
  fitId: string;
  type: string;
  datePosted: Date;
  amount: number;
  description: string;
  memo?: string;
}

export interface ImportResult {
  totalProcessed: number;
  newTransactions: number;
  duplicatesSkipped: number;
  errors: string[];
  classificationResults: {
    classified: number;
    failed: number;
  };
}

@Injectable()
export class OfxImportService {
  private readonly logger = new Logger(OfxImportService.name);
  
  constructor(
    private readonly prisma: PrismaService,
    private readonly ai: AIClassificationService
  ) {}

  async importOfxFile(
    fileBuffer: Buffer, 
    contaCorrenteId: string, 
    enableAI: boolean = true, 
    delay: number = 1000
  ): Promise<ImportResult> {
    const result: ImportResult = {
      totalProcessed: 0,
      newTransactions: 0,
      duplicatesSkipped: 0,
      errors: [],
      classificationResults: {
        classified: 0,
        failed: 0
      }
    };

    try {
      // Parse do arquivo OFX
      const ofxData = await this.parseOfxFile(fileBuffer);
      const transactions = this.extractTransactions(ofxData);
      
      result.totalProcessed = transactions.length;
      this.logger.log(`Processando ${transactions.length} transações do arquivo OFX`);

      // Processar transações uma a uma com throttling
      for (let i = 0; i < transactions.length; i++) {
        const transaction = transactions[i];
        
        try {
          await this.processTransaction(
            transaction, 
            contaCorrenteId, 
            enableAI,
            result
          );

          // Throttling para manter CPU estável
          if (i < transactions.length - 1) {
            await this.delay(delay);
          }

        } catch (error) {
          const errorMsg = `Erro ao processar transação ${transaction.fitId}: ${error.message}`;
          this.logger.error(errorMsg);
          result.errors.push(errorMsg);
        }
      }

      this.logger.log(`Importação concluída: ${result.newTransactions} novas, ${result.duplicatesSkipped} duplicatas`);
      return result;

    } catch (error) {
      const errorMsg = `Erro geral na importação OFX: ${error.message}`;
      this.logger.error(errorMsg, error.stack);
      result.errors.push(errorMsg);
      return result;
    }
  }

  private async parseOfxFile(fileBuffer: Buffer): Promise<any> {
    return new Promise((resolve, reject) => {
      try {
        const ofxString = fileBuffer.toString('utf-8');
        const data = OFX.parse(ofxString);
        resolve(data);
      } catch (error) {
        reject(new Error(`Erro ao parsear arquivo OFX: ${error.message}`));
      }
    });
  }

  private extractTransactions(ofxData: any): OfxTransaction[] {
    const transactions: OfxTransaction[] = [];
    
    try {
      // Navegar pela estrutura OFX para encontrar transações
      const bankmsgsrsv1 = ofxData.OFX?.BANKMSGSRSV1;
      if (!bankmsgsrsv1) {
        throw new Error('Estrutura OFX inválida: BANKMSGSRSV1 não encontrado');
      }

      const stmttrnrs = bankmsgsrsv1.STMTTRNRS;
      if (!stmttrnrs) {
        throw new Error('Estrutura OFX inválida: STMTTRNRS não encontrado');
      }

      const stmtrs = stmttrnrs.STMTRS;
      if (!stmtrs) {
        throw new Error('Estrutura OFX inválida: STMTRS não encontrado');
      }

      const banktranlist = stmtrs.BANKTRANLIST;
      if (!banktranlist || !banktranlist.STMTTRN) {
        throw new Error('Nenhuma transação encontrada no arquivo OFX');
      }

      const stmttrns = Array.isArray(banktranlist.STMTTRN) 
        ? banktranlist.STMTTRN 
        : [banktranlist.STMTTRN];

      for (const trn of stmttrns) {
        if (trn.FITID && trn.DTPOSTED && trn.TRNAMT) {
          transactions.push({
            fitId: trn.FITID.toString(),
            type: trn.TRNTYPE || 'OTHER',
            datePosted: this.parseOfxDate(trn.DTPOSTED),
            amount: parseFloat(trn.TRNAMT),
            description: trn.NAME || trn.MEMO || 'Transação sem descrição',
            memo: trn.MEMO
          });
        }
      }

      return transactions;
    } catch (error) {
      throw new Error(`Erro ao extrair transações: ${error.message}`);
    }
  }

  private parseOfxDate(ofxDate: string): Date {
    // OFX dates are typically in format YYYYMMDDHHMMSS
    const dateStr = ofxDate.toString();
    const year = parseInt(dateStr.substring(0, 4));
    const month = parseInt(dateStr.substring(4, 6)) - 1; // Month is 0-indexed
    const day = parseInt(dateStr.substring(6, 8));
    
    return new Date(year, month, day);
  }

  private async processTransaction(
    transaction: OfxTransaction,
    contaCorrenteId: string,
    enableAI: boolean,
    result: ImportResult
  ): Promise<void> {
    // Verificar se já existe (evitar duplicatas usando chave composta)
    const existing = await this.prisma.transacao.findUnique({
      where: { 
        contaCorrenteId_fitId: {
          contaCorrenteId,
          fitId: transaction.fitId
        }
      }
    });

    if (existing) {
      result.duplicatesSkipped++;
      this.logger.debug(`Transação duplicada ignorada: ${transaction.fitId}`);
      return;
    }

    // Preparar dados para classificação IA
    let contaContabilId: string | null = null;

    if (enableAI) {
      try {
        const aiRequest: AIClassificationRequest = {
          description: transaction.description,
          amount: transaction.amount,
          date: transaction.datePosted.toISOString()
        };

        const aiResult = await this.ai.classifyTransaction(aiRequest);
        
        if (aiResult.confianca > 0.7) {
          // Buscar conta baseada na categoria sugerida pela IA
          const orgId = await this.getOrganizationId(contaCorrenteId);
          const conta = await this.findAccountByCategory(aiResult.categoria, orgId);
          if (conta) {
            contaContabilId = conta.id;
          }
        }

        result.classificationResults.classified++;

      } catch (error) {
        this.logger.warn(`Falha na classificação IA para ${transaction.fitId}: ${error.message}`);
        result.classificationResults.failed++;
      }
    }

    // Se não conseguiu classificar com IA, usar conta padrão
    if (!contaContabilId) {
      contaContabilId = await this.getDefaultAccountId(contaCorrenteId);
    }

    // Criar transação no banco
    await this.prisma.transacao.create({
      data: {
        fitId: transaction.fitId,
        contaCorrenteId,
        contaContabilId,
        dataHora: transaction.datePosted,
        descricao: transaction.description,
        valor: new Decimal(transaction.amount),
        tipo: transaction.amount >= 0 ? 'CREDITO' : 'DEBITO',
        moeda: 'BRL',
        status: 'ATIVA',
        organizationId: await this.getOrganizationId(contaCorrenteId),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    result.newTransactions++;
    this.logger.debug(`Nova transação criada: ${transaction.fitId}`);
  }

  private async getDefaultAccountId(contaCorrenteId: string): Promise<string> {
    const organizationId = await this.getOrganizationId(contaCorrenteId);
    
    // Buscar uma conta contábil padrão para transações não classificadas
    const defaultAccount = await this.prisma.contaContabil.findFirst({
      where: {
        organizationId,
        nome: {
          contains: 'Não Classificado',
          mode: 'insensitive'
        }
      }
    });

    if (defaultAccount) {
      return defaultAccount.id;
    }

    // Se não encontrar, criar uma conta padrão
    const newAccount = await this.prisma.contaContabil.create({
      data: {
        codigo: '999.999',
        nome: 'Transações Não Classificadas',
        tipo: 'DESPESA',
        organizationId
      }
    });

    return newAccount.id;
  }

  private async getOrganizationId(contaCorrenteId: string): Promise<string> {
    const contaCorrente = await this.prisma.contaCorrente.findUnique({
      where: { id: contaCorrenteId },
      select: { organizationId: true }
    });

    if (!contaCorrente) {
      throw new Error(`Conta corrente não encontrada: ${contaCorrenteId}`);
    }

    return contaCorrente.organizationId;
  }

  private async findAccountByCategory(categoria: string, organizationId: string): Promise<{ id: string } | null> {
    // Mapear categorias da IA para contas do sistema
    const categoryMapping: Record<string, string[]> = {
      'Receitas de Vendas': ['receita', 'venda', 'faturamento'],
      'Despesas Operacionais': ['despesa', 'operacional', 'administrativa'],
      'Despesas Financeiras': ['juros', 'tarifa', 'taxa bancária'],
      'Receitas Financeiras': ['rendimento', 'aplicação', 'juros recebidos'],
      'Fornecedores': ['fornecedor', 'compra', 'pagamento'],
      'Impostos e Taxas': ['imposto', 'taxa', 'tributo'],
    };

    const searchTerms = categoryMapping[categoria] || [categoria.toLowerCase()];
    
    for (const term of searchTerms) {
      const conta = await this.prisma.contaContabil.findFirst({
        where: {
          organizationId,
          nome: {
            contains: term,
            mode: 'insensitive'
          }
        }
      });
      
      if (conta) {
        return conta;
      }
    }

    return null;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Método para reprocessar transações existentes com IA
  async reprocessWithAI(
    startDate?: Date,
    endDate?: Date,
    throttleDelayMs: number = 1000
  ): Promise<ImportResult> {
    const result: ImportResult = {
      totalProcessed: 0,
      newTransactions: 0,
      duplicatesSkipped: 0,
      errors: [],
      classificationResults: {
        classified: 0,
        failed: 0
      }
    };

    try {
      const whereClause: any = {
        contaContabilId: null, // Apenas transações não classificadas
      };

      if (startDate) {
        whereClause.dataHora = { gte: startDate };
      }
      if (endDate) {
        whereClause.dataHora = { ...whereClause.dataHora, lte: endDate };
      }

      const unclassifiedTransactions = await this.prisma.transacao.findMany({
        where: whereClause,
        orderBy: { dataHora: 'asc' }
      });

      result.totalProcessed = unclassifiedTransactions.length;
      this.logger.log(`Reprocessando ${unclassifiedTransactions.length} transações não classificadas`);

      for (let i = 0; i < unclassifiedTransactions.length; i++) {
        const transaction = unclassifiedTransactions[i];
        
        try {
          const aiRequest: AIClassificationRequest = {
            description: transaction.descricao || '',
            amount: transaction.valor.toNumber(),
            date: transaction.dataHora.toISOString()
          };

          const aiResult = await this.ai.classifyTransaction(aiRequest);
          
          if (aiResult.confianca > 0.7) {
            const conta = await this.findAccountByCategory(aiResult.categoria, transaction.organizationId);
            
            if (conta) {
              await this.prisma.transacao.update({
                where: { id: transaction.id },
                data: {
                  contaContabilId: conta.id,
                  updatedAt: new Date()
                }
              });

              result.classificationResults.classified++;
            } else {
              result.classificationResults.failed++;
            }
          } else {
            result.classificationResults.failed++;
          }

          // Throttling
          if (i < unclassifiedTransactions.length - 1) {
            await this.delay(throttleDelayMs);
          }

        } catch (error) {
          const errorMsg = `Erro ao reprocessar transação ${transaction.id}: ${error.message}`;
          this.logger.error(errorMsg);
          result.errors.push(errorMsg);
          result.classificationResults.failed++;
        }
      }

      return result;
    } catch (error) {
      const errorMsg = `Erro no reprocessamento: ${error.message}`;
      this.logger.error(errorMsg, error.stack);
      result.errors.push(errorMsg);
      return result;
    }
  }
}
