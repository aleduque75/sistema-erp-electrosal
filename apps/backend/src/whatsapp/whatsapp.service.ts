import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { HttpService } from '@nestjs/axios'; // Import HttpService

@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);
  private readonly evolutionApiUrl = 'http://localhost:8080'; // Base URL da Evolution API
  private readonly evolutionApiKey = process.env.EVOLUTION_API_KEY; // Chave da Evolution API
  private readonly evolutionInstanceName = 'electrosal-bot'; // Nome da instância

  constructor(
    private prisma: PrismaService,
    private readonly httpService: HttpService, // Inject HttpService
  ) {}

  async processIncomingMessage(messageBody: any): Promise<void> {
    this.logger.log('Processando mensagem recebida:', messageBody);

    const messageText = messageBody.data?.message?.conversation || messageBody.data?.message?.extendedTextMessage?.text;
    const senderFullJid = messageBody.sender; // Pega o JID completo do remetente (ex: '5511941779393@s.whatsapp.net')
    const remoteJid = senderFullJid ? senderFullJid.split('@')[0] : null; // Extrai apenas o número '5511941779393'

    if (!messageText || !remoteJid) {
      this.logger.warn('Mensagem ou remetente não encontrados no payload do webhook.');
      return;
    }

    this.logger.log(`Mensagem de ${remoteJid}: ${messageText}`);

    // --- Lógica para analisar o comando "despesa" ---
    const match = messageText.match(/(?:despesa|gasto)\s+([\d.]+)\s+(.+)/i);

    if (match) {
      const value = parseFloat(match[1].replace(',', '.')); // "100.00"
      const description = match[2];

      if (isNaN(value) || value <= 0) {
        await this.sendWhatsappMessage(remoteJid, 'Formato inválido para despesa. Use: despesa [valor] [descrição]');
        return;
      }

      try {
        // Buscamos a primeira organização do banco para não dar erro de FK
        const org = await this.prisma.organization.findFirst();

        if (!org) {
          this.logger.error('❌ Nenhuma organização encontrada no banco!');
          await this.sendWhatsappMessage(remoteJid, 'Erro interno: Nenhuma organização configurada.');
          return;
        }

        // Criação do registro no AccountPay
        const novoGasto = await this.prisma.accountPay.create({
          data: {
            description: description,
            amount: new Prisma.Decimal(value), // Usa Decimal do Prisma para precisão
            dueDate: new Date(), // Vencimento para hoje
            organizationId: org.id,
            paid: false,
          },
        });

        this.logger.log(`✅ Sucesso! AccountPay gerado com ID: ${novoGasto.id}`);
        await this.sendWhatsappMessage(remoteJid, `✅ Despesa "${description}" de R$ ${value.toFixed(2)} registrada com sucesso!`);
      } catch (error) {
        this.logger.error('❌ Erro ao registrar despesa:', error);
        await this.sendWhatsappMessage(remoteJid, 'Ocorreu um erro ao registrar a despesa. Verifique os logs do servidor.');
      }
    } else if (messageText.toLowerCase() === 'saldo') {
      try {
        const pessoa = await this.prisma.pessoa.findFirst({
          where: { phone: remoteJid }, // Assumindo que Pessoa.phone armazena o número WhatsApp
        });

        if (!pessoa) {
          await this.sendWhatsappMessage(remoteJid, 'Não encontramos seu cadastro. Por favor, certifique-se de que seu número WhatsApp está registrado em nosso sistema.');
          return;
        }

        // --- EXERCÍCIO: Calcule o saldo real aqui ---
        // Por enquanto, vamos simular um saldo ou buscar de uma ContaCorrente
        const contaCorrente = await this.prisma.contaCorrente.findFirst({
          where: { organizationId: pessoa.organizationId }, // Assumindo default org para simplicidade
          orderBy: { createdAt: 'asc' }, // Pega a conta mais antiga
        });

        let saldo = new Prisma.Decimal(0);
        if (contaCorrente) {
            saldo = contaCorrente.initialBalanceBRL; // Usando o saldo inicial como exemplo
        }

        await this.sendWhatsappMessage(remoteJid, `Olá ${pessoa.name || 'cliente'}! Seu saldo atual é de R$ ${saldo.toFixed(2)}.`);

      } catch (error) {
        this.logger.error('Erro ao buscar saldo:', error);
        await this.sendWhatsappMessage(remoteJid, 'Ocorreu um erro ao consultar seu saldo. Tente novamente mais tarde.');
      }
    } else {
      await this.sendWhatsappMessage(remoteJid, 'Comando não reconhecido. Tente "despesa [valor] [descrição]" ou "saldo".');
    }
  }

  // Método auxiliar para enviar mensagens de volta ao WhatsApp
  private async sendWhatsappMessage(to: string, message: string): Promise<void> {
    try {
      const instanceName = this.evolutionInstanceName; // Ou obtenha dinamicamente se tiver várias instâncias
      const response = await this.httpService.axiosRef.post(
        `${this.evolutionApiUrl}/message/sendText/${instanceName}`,
        {
          number: to,
          text: message,
        },
        {
          headers: {
            'apikey': this.evolutionApiKey,
            'Content-Type': 'application/json',
          },
        },
      );
      this.logger.log('Mensagem de WhatsApp enviada:', response.data);
    } catch (error) {
      this.logger.error('Erro ao enviar mensagem de WhatsApp:', error.response?.data || error.message);
    }
  }
}

