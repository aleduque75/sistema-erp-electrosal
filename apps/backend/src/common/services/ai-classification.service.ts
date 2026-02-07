import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

export interface AIClassificationRequest {
  description: string;
  amount: number;
  date: string;
}

@Injectable()
export class AIClassificationService {
  private readonly logger = new Logger(AIClassificationService.name);
  private readonly AI_ENDPOINT = 'http://localhost:11434/api/generate';

  constructor(private readonly httpService: HttpService) {}

  async classifyTransaction(request: AIClassificationRequest) {
    try {
      const prompt = `Classifique a transação: ${request.description}, Valor: ${request.amount}. Responda apenas JSON: {"categoria": "nome", "confianca": 0.9, "observacoes": ""}`;
      const response = await firstValueFrom(
        this.httpService.post(this.AI_ENDPOINT, {
          model: 'llama3.2:1b',
          prompt,
          stream: false,
        })
      );
      const parsed = JSON.parse(response.data.response);
      return {
        categoria: parsed.categoria || 'Não Classificado',
        confianca: parsed.confianca || 0,
        observacoes: parsed.observacoes || ''
      };
    } catch (error) {
      this.logger.error('Erro na classificação IA');
      return { categoria: 'Não Classificado', confianca: 0, observacoes: error.message };
    }
  }
}
