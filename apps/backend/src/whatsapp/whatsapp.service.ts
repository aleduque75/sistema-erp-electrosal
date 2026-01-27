
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { TipoTransacaoPrisma } from '@prisma/client';
import { HttpService } from '@nestjs/axios';
import { AccountsPayService } from '../accounts-pay/accounts-pay.service';
import { Decimal } from 'decimal.js';
import {
  WhatsAppWebhookPayload,
  MessageUpsertData,
} from './types/whatsapp-webhook.types';
import { AxiosError } from 'axios';

// Interface para tipar o corpo do webhook da Evolution API
export interface EvolutionWebhookBody {
  event: string;
  data?: {
    key: {
      remoteJid: string;
      fromMe: boolean;
      id: string;
    };
    message?: {
      conversation?: string;
      extendedTextMessage?: {
        text?: string;
      };
    };
  };
}

@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);
  private readonly evolutionApiUrl = 'http://localhost:8080';
  private readonly evolutionApiKey = process.env.EVOLUTION_API_KEY;
  private readonly evolutionInstanceName = 'electrosal-bot';

  constructor(
    private prisma: PrismaService,
    private readonly httpService: HttpService,
    private readonly accountsPayService: AccountsPayService,
  ) {}

  // Estado da conversa por usuário
  private conversationState: Record<string, any> = {};

  private processedMessageIds = new Set<string>();

  async handleIncomingMessage(body: WhatsAppWebhookPayload): Promise<void> {
    this.logger.log('--- WHATSAPP WEBHOOK RECEBIDO ---');
    this.logger.log(JSON.stringify(body, null, 2));

    // Condição de guarda para garantir que estamos lidando com uma mensagem de texto de entrada
    if (
      body.event !== 'messages.upsert' ||
      !body.data ||
      !body.data.key ||
      !body.data.key.id
    ) {
      this.logger.log(
        'Webhook ignorado: não é uma mensagem de usuário ou evento irrelevante.',
      );
      return;
    }

    const messageId = body.data.key.id;
    if (this.processedMessageIds.has(messageId)) {
      this.logger.log(
        `Webhook ignorado: Mensagem com ID ${messageId} já foi processada.`,
      );
      return;
    }
    this.processedMessageIds.add(messageId);

    // Limpa o cache de IDs de mensagens antigas para evitar consumo de memória
    // (Ex: remove IDs mais velhos que 5 minutos)
    setTimeout(() => {
      this.processedMessageIds.delete(messageId);
    }, 5 * 60 * 1000);

    const messageData = body.data as MessageUpsertData;

  const message = messageData.message;
  // Log detalhado do remoteJid recebido
  this.logger.log(`[DEBUG] remoteJid recebido: ${messageData.key.remoteJid}`);

    if (
      !message ||
      (!message.conversation && !message.extendedTextMessage?.text)
    ) {
      this.logger.log('Webhook ignorado: mensagem sem conteúdo de texto.');
      return;
    }

    const messageText = (
      message.conversation ||
      message.extendedTextMessage?.text ||
      ''
    ).trim();
    let remoteJid = messageData.key.remoteJid;

    if (remoteJid.endsWith('@lid')) {
        this.logger.log(`[DEBUG] remoteJid é um LID. Usando sender: ${body.sender}`);
        remoteJid = body.sender;
    }

    // Ignora JIDs que não são de usuários (ex: @lid, @broadcast)
    if (
      !remoteJid.endsWith('@s.whatsapp.net') &&
      !remoteJid.endsWith('@c.us')
    ) {
      this.logger.log(`Webhook ignorado: JID inválido para interação (${remoteJid}).`);
      return;
    }

    this.logger.log(`Mensagem recebida de ${remoteJid}: "${messageText}"`);

    if (messageText.toLowerCase() === '/contas a pagar') {
      await this.handleContasAPagar(remoteJid);
      return;
    }
    if (messageText.toLowerCase() === '/pagar') {
      this.conversationState[remoteJid] = { step: 'awaiting_date' };
      await this.sendWhatsappMessage(remoteJid, 'Informe a data do pagamento (ex: 26/01/26):');
      return;
    }

    // Fluxo interativo do comando /pagar
    const state = this.conversationState[remoteJid];
    if (state) {
      if (state.step === 'awaiting_date') {
        // Validar e salvar data
        const dateRegex = /^(\d{2})\/(\d{2})\/(\d{2,4})$/;
        const match = messageText.match(dateRegex);
        if (!match) {
          await this.sendWhatsappMessage(remoteJid, 'Data inválida. Informe no formato DD/MM/AA.');
          return;
        }
        // Formatar para Date
        const [_, day, month, year] = match;
        const fullYear = year.length === 2 ? '20' + year : year;
        const date = new Date(parseInt(fullYear), parseInt(month) - 1, parseInt(day));

        if (isNaN(date.getTime())) {
          await this.sendWhatsappMessage(remoteJid, 'Data inválida. Tente novamente.');
          return;
        }

        state.date = date;
        state.step = 'awaiting_conta_corrente';
        
        const org = await this.getOrg(remoteJid);
        if (!org) {
          delete this.conversationState[remoteJid];
          return;
        }

        const contas = await this.prisma.contaCorrente.findMany({ where: { organizationId: org.id, isActive: true } });
        if (contas.length === 0) {
          await this.sendWhatsappMessage(remoteJid, 'Nenhuma conta corrente ativa encontrada.');
          delete this.conversationState[remoteJid];
          return;
        }
        let msgContaCorrente = 'Escolha a conta corrente:\n';
        contas.forEach((c, idx) => {
          msgContaCorrente += `${idx + 1} - ${c.nome} (${c.numeroConta})\n`;
        });
        state.contasCorrentes = contas;
        await this.sendWhatsappMessage(remoteJid, msgContaCorrente + '\nResponda com o número da opção.');
        return;

      } else if (state.step === 'awaiting_conta_corrente') {
        const idx = parseInt(messageText.trim());
        if (isNaN(idx) || idx < 1 || idx > state.contasCorrentes.length) {
          await this.sendWhatsappMessage(remoteJid, 'Opção inválida. Responda com o número da conta corrente.');
          return;
        }
        state.contaCorrente = state.contasCorrentes[idx - 1];
        state.step = 'awaiting_conta_contabil';

        const org = await this.getOrg(remoteJid);
        if (!org) {
          delete this.conversationState[remoteJid];
          return;
        }

        const contasContabeis = await this.prisma.contaContabil.findMany({ where: { organizationId: org.id } });
        if (contasContabeis.length === 0) {
          await this.sendWhatsappMessage(remoteJid, 'Nenhuma conta contábil encontrada.');
          delete this.conversationState[remoteJid];
          return;
        }
        let msgContaContabil = 'Escolha a conta contábil:\n';
        contasContabeis.forEach((c, idx) => {
          msgContaContabil += `${idx + 1} - ${c.nome} (${c.codigo})\n`;
        });
        state.contasContabeis = contasContabeis;
        await this.sendWhatsappMessage(remoteJid, msgContaContabil + '\nResponda com o número da opção.');
        return;

      } else if (state.step === 'awaiting_conta_contabil') {
        const idx = parseInt(messageText.trim());
        if (isNaN(idx) || idx < 1 || idx > state.contasContabeis.length) {
          await this.sendWhatsappMessage(remoteJid, 'Opção inválida. Responda com o número da conta contábil.');
          return;
        }
        state.contaContabil = state.contasContabeis[idx - 1];
        state.step = 'awaiting_valor';
        await this.sendWhatsappMessage(remoteJid, 'Informe o valor do pagamento:');
        return;

      } else if (state.step === 'awaiting_valor') {
        // Validar valor
        let valorStr = messageText.trim();
        let valor;
        if (valorStr.includes(',')) {
          valor = parseFloat(valorStr.replace(/\./g, '').replace(',', '.'));
        } else {
          valor = parseFloat(valorStr);
        }
        if (isNaN(valor) || valor <= 0) {
          await this.sendWhatsappMessage(remoteJid, 'Valor inválido. Informe um valor numérico.');
          return;
        }
        state.valor = valor;
        state.step = 'awaiting_confirmacao';
        const resumo = `Confirma o pagamento de R$ ${valor.toFixed(2)} na conta corrente "${state.contaCorrente.nome}" (${state.contaCorrente.numeroConta}), conta contábil "${state.contaContabil.nome}" (${state.contaContabil.codigo}), na data ${state.date.toLocaleDateString('pt-BR')}? (sim/não)`;
        await this.sendWhatsappMessage(remoteJid, resumo);
        return;
        
      } else if (state.step === 'awaiting_confirmacao') {
        if (messageText.trim().toLowerCase() === 'sim') {
          // Registrar pagamento
          try {
            const org = await this.getOrg(remoteJid);
            if (!org) {
                delete this.conversationState[remoteJid];
                return;
            }

            // 1. Criar Transacao
            const transacao = await this.prisma.transacao.create({
              data: {
                descricao: `Pagamento WhatsApp (${state.contaCorrente.nome})`,
                valor: state.valor,
                moeda: state.contaCorrente.moeda || 'BRL',
                tipo: TipoTransacaoPrisma.DEBITO,
                dataHora: state.date,
                contaCorrenteId: state.contaCorrente.id,
                contaContabilId: state.contaContabil.id,
                organizationId: org.id,
              },
            });
            // 2. Criar AccountPay vinculado à transacao
            await this.prisma.accountPay.create({
              data: {
                description: `Pagamento WhatsApp (${state.contaCorrente.nome})`,
                amount: state.valor,
                dueDate: state.date,
                organizationId: org.id,
                paid: true,
                paidAt: new Date(),
                contaContabilId: state.contaContabil.id,
                transacaoId: transacao.id,
              },
            });
            await this.sendWhatsappMessage(remoteJid, '✅ Pagamento registrado com sucesso!');
          } catch (err) {
            this.logger.error('Erro ao registrar pagamento:', err);
            await this.sendWhatsappMessage(remoteJid, 'Erro ao registrar pagamento.');
          }
          delete this.conversationState[remoteJid];
          return;
        } else {
          await this.sendWhatsappMessage(remoteJid, 'Pagamento cancelado.');
          delete this.conversationState[remoteJid];
          return;
        }
      }
    }

    // Comandos existentes
    if (messageText.toLowerCase().startsWith('despesa ')) {
      await this.handleDespesa(remoteJid, messageText);
      return;
    }
    this.logger.log(`Comando não reconhecido: "${messageText}"`);
  }
  
    private async getOrg(remoteJid: string) {
      const org = await this.prisma.organization.findFirst();
      if (!org) {
        this.logger.error('Nenhuma organização encontrada no banco!');
        await this.sendWhatsappMessage(remoteJid, 'Erro interno: Nenhuma organização configurada.');
        return null;
      }
      return org;
    }
  
    private async handleDespesa(remoteJid: string, messageText: string): Promise<void> {
      const despesaMatch = messageText.match(/(?:despesa|gasto)\s+([\d,.]+)\s+(.+)/i);
  
      if (!despesaMatch) {
        await this.sendWhatsappMessage(remoteJid, 'Formato inválido. Use: despesa [valor] [descrição]');
        return;
      }
  
      const valueStr = despesaMatch[1];
      let value;
      if (valueStr.includes(',')) {
        value = parseFloat(valueStr.replace(/\./g, '').replace(',', '.'));
      } else {
        value = parseFloat(valueStr);
      }
      const description = despesaMatch[2];
  
      if (isNaN(value) || value <= 0) {
        await this.sendWhatsappMessage(remoteJid, 'Valor da despesa é inválido.');
        return;
      }
  
      try {
          const org = await this.getOrg(remoteJid);
          if (!org) return;
  
        const createdDespesa = await this.prisma.accountPay.create({
          data: {
            description: description,
            amount: value,
            dueDate: new Date(),
            organizationId: org.id,
            paid: false,
          },
        });
      const formattedValue = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }).format(value);

      this.logger.log(
        `✅ Despesa "${createdDespesa.description}" de ${formattedValue} registrada com sucesso!`,
      );
      await this.sendWhatsappMessage(
        remoteJid,
        `✅ Despesa "${createdDespesa.description}" de ${formattedValue} registrada com sucesso!`,
      );
    } catch (error) {
      this.logger.error('Ocorreu um erro ao registrar a despesa:', error);
      await this.sendWhatsappMessage(remoteJid, 'Ocorreu um erro ao registrar a despesa.');
    }
  }

  private async handleContasAPagar(remoteJid: string): Promise<void> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const contas = await this.accountsPayService.findMany({
        where: {
          dueDate: { gte: today, lt: tomorrow },
          paid: false,
        },
      });

      if (contas.length === 0) {
        await this.sendWhatsappMessage(remoteJid, 'Nenhuma conta a pagar para hoje. 👍');
        return;
      }

      let message = 'CONTAS A PAGAR DE HOJE:\n\n';
      contas.forEach(conta => {
        const amount = new Decimal(conta.amount);
        message += `- ${conta.description}: R$ ${amount.toFixed(2)}\n`;
      });

      await this.sendWhatsappMessage(remoteJid, message);
    } catch (error) {
      this.logger.error('Erro ao buscar contas a pagar:', error);
      await this.sendWhatsappMessage(remoteJid, 'Ocorreu um erro ao buscar as contas a pagar.');
    }
  }

  private async sendWhatsappMessage(
    remoteJid: string,
    text: string,
  ): Promise<void> {
    const url = `${this.evolutionApiUrl}/message/sendText/${this.evolutionInstanceName}`;
    try {
      await this.httpService.axiosRef.post(
        url,
        {
          number: remoteJid,
          text,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            apikey: this.evolutionApiKey,
          },
        },
      );
    } catch (error) {
      this.logger.error('Erro ao enviar mensagem de WhatsApp:');
      if (error instanceof AxiosError && error.response) {
        this.logger.error(JSON.stringify(error.response.data, null, 2));
      } else {
        this.logger.error(error);
      }
    }
  }

} // Fim da classe WhatsappService

