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
