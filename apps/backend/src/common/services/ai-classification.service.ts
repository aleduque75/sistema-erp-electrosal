import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class AIClassificationService {
  private readonly logger = new Logger(AIClassificationService.name);
  private readonly AI_ENDPOINT = 'http://localhost:11434/api/generate';

  constructor(private readonly httpService: HttpService) {}

  async classifyTransaction(description: string, amount: number) {
    try {
      const prompt = `Classifique esta transação bancária brasileira em uma categoria contábil:
      Descrição: ${description}
      Valor: R$ ${amount}
      Responda APENAS um JSON no formato: {"categoria": "nome", "confianca": 0.9}`;

      const response = await firstValueFrom(
        this.httpService.post(this.AI_ENDPOINT, {
          model: 'llama3.2:1b',
          prompt,
          stream: false,
        })
      );
      return JSON.parse(response.data.response);
    } catch (e) {
      this.logger.error('Erro na IA: ' + e.message);
      return { categoria: 'Não Classificado', confianca: 0 };
    }
  }
}
import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

export interface AIClassificationRequest {
  description: string;
  amount: number;
  date: string;
}

export interface AIClassificationResponse {
  contaId?: string;
  categoria: string;
  confianca: number;
  observacoes?: string;
}

@Injectable()
export class AIClassificationService {
  private readonly logger = new Logger(AIClassificationService.name);
  private readonly AI_ENDPOINT = 'http://localhost:11434/api/generate';

  constructor(private readonly httpService: HttpService) {}

  async classifyTransaction(request: AIClassificationRequest): Promise<AIClassificationResponse> {
    try {
      const prompt = this.buildClassificationPrompt(request);
      
      const response = await firstValueFrom(
        this.httpService.post(this.AI_ENDPOINT, {
          model: 'llama3.2:1b',
          prompt,
          stream: false,
          options: {
            temperature: 0.1,
            top_p: 0.9,
          }
        })
      );

      return this.parseAIResponse(response.data.response);
    } catch (error) {
      this.logger.error(`Erro na classificação IA: ${error.message}`, error.stack);
      return {
        categoria: 'Não Classificado',
        confianca: 0,
        observacoes: 'Erro na classificação automática'
      };
    }
  }

  private buildClassificationPrompt(request: AIClassificationRequest): string {
    return `
Você é um especialista em contabilidade e classificação de transações bancárias.

Analise a seguinte transação e classifique-a baseada no plano de contas padrão:

Descrição: ${request.description}
Valor: R$ ${request.amount.toFixed(2)}
Data: ${request.date}

Plano de Contas Disponível:
- Receitas de Vendas
- Custos de Mercadorias Vendidas
- Despesas Operacionais
- Despesas Administrativas
- Despesas Financeiras
- Receitas Financeiras
- Impostos e Taxas
- Fornecedores
- Clientes
- Bancos e Caixas
- Estoque
- Imobilizado
- Não Classificado

Responda APENAS no formato JSON:
{
  "categoria": "nome_da_categoria",
  "confianca": 0.95,
  "observacoes": "explicação_breve"
}

Seja preciso e considere o contexto brasileiro de contabilidade empresarial.
`;
  }

  private parseAIResponse(aiResponse: string): AIClassificationResponse {
    try {
      // Remove possíveis caracteres extras e tenta extrair JSON
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Resposta não contém JSON válido');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      return {
        categoria: parsed.categoria || 'Não Classificado',
        confianca: Math.min(Math.max(parsed.confianca || 0, 0), 1),
        observacoes: parsed.observacoes || ''
      };
    } catch (error) {
      this.logger.warn(`Erro ao parsear resposta da IA: ${error.message}`);
      return {
        categoria: 'Não Classificado',
        confianca: 0,
        observacoes: 'Erro no parsing da resposta da IA'
      };
    }
  }

  // Método para processar em lote com throttling
  async classifyTransactionsBatch(
    requests: AIClassificationRequest[],
    delayMs: number = 1000
  ): Promise<AIClassificationResponse[]> {
    const results: AIClassificationResponse[] = [];
    
    for (let i = 0; i < requests.length; i++) {
      this.logger.log(`Classificando transação ${i + 1}/${requests.length}`);
      
      const result = await this.classifyTransaction(requests[i]);
      results.push(result);
      
      // Delay para manter CPU estável
      if (i < requests.length - 1) {
        await this.delay(delayMs);
      }
    }
    
    return results;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
