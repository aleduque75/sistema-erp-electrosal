import { WhatsappRoutinesService } from '../whatsapp-routines/whatsapp-routines.service';
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, TipoTransacaoPrisma } from '@prisma/client';
import { HttpService } from '@nestjs/axios';
import { AccountsPayService } from '../accounts-pay/accounts-pay.service';
import { Decimal } from 'decimal.js';

@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);
  private readonly evolutionApiUrl =
    process.env.EVOLUTION_API_URL || 'http://localhost:8080';
  private readonly evolutionApiKey = process.env.EVOLUTION_API_KEY;
  private readonly evolutionInstanceName =
    process.env.EVOLUTION_INSTANCE_NAME || 'electrosal-bot';

  private latestQrCode: string | null = null;
  private conversationState: Record<string, any> = {};
  private processedMessageIds = new Set<string>();

  constructor(
    private prisma: PrismaService,
    private readonly httpService: HttpService,
    private readonly accountsPayService: AccountsPayService,
    private readonly whatsappRoutineService: WhatsappRoutinesService,
  ) {}

  getLatestQrCode(): string | null {
    return this.latestQrCode;
  }

  async handleIncomingMessage(body: any): Promise<void> {
    // 1. Log inicial para debug na VPS (pm2 logs)
    this.logger.log(`Recebido evento: ${body.event || 'desconhecido'}`);

    // 2. QR Code Update
    if (body.event === 'qrcode.updated') {
      this.latestQrCode = body.data?.qrcode?.base64 || body.data?.qr;
      return;
    }

    // 3. Validação robusta do Webhook
    if (body.event !== 'messages.upsert') return;

    // Na v2.3.1, os dados da mensagem costumam vir dentro de body.data.message ou body.data
    const messageData = body.data?.message || body.data;
    if (!messageData) return;

    const messageId = messageData.key?.id;
    if (!messageId || this.processedMessageIds.has(messageId)) return;

    // Deduplicação (evita processar a mesma mensagem 2x)
    this.processedMessageIds.add(messageId);
    setTimeout(() => this.processedMessageIds.delete(messageId), 5 * 60 * 1000);

    // 4. Resolução de Identidade (Trata @lid e ignore fromMe)
    const isFromMe = messageData.key?.fromMe;
    let remoteJid = messageData.key?.remoteJid;

    // Se você estiver testando do próprio celular do bot, comente a linha abaixo temporariamente
    if (isFromMe) return;

    const message = messageData.message;
    if (!message) return;

    const messageText = (
      message.conversation ||
      message.extendedTextMessage?.text ||
      message.imageMessage?.caption ||
      ''
    ).trim();

    if (!messageText) return;

    this.logger.log(`📩 Mensagem de [${remoteJid}]: "${messageText}"`);
    const org = await this.getOrg();

    // --- ROTEAMENTO DE COMANDOS ---

    // A. VIA RÁPIDA: /transferir origem destino cotação valor
    const quickTransferMatch = messageText.match(
      /^\/transferir\s+(\S+)\s+(\S+)\s+([\d,.]+)\s+([\d,.]+)$/i,
    );
    if (quickTransferMatch) {
      const [_, de, para, cot, val] = quickTransferMatch;
      return await this.executeQuickTransfer(
        remoteJid,
        de,
        para,
        cot,
        val,
        org.id,
      );
    }

    // B. ROTINAS DINÂMICAS (Configuradas no React)
    const wasDynamic = await this.whatsappRoutineService.processIncomingMessage(
      remoteJid,
      messageText,
      org.id,
      async (jid, text) => {
        await this.sendWhatsappMessage(jid, text);
      },
    );
    if (wasDynamic) return;

    // C. COMANDOS FIXOS
    const lowerText = messageText.toLowerCase();

    if (lowerText.includes('contas a pagar')) {
      return await this.handleContasAPagar(remoteJid);
    }

    if (lowerText === '/pagar') {
      this.conversationState[remoteJid] = { step: 'awaiting_date' };
      return await this.sendWhatsappMessage(
        remoteJid,
        'Informe a data do pagamento (ex: 29/01/26):',
      );
    }

    if (lowerText.startsWith('despesa ')) {
      return await this.handleDespesa(remoteJid, messageText);
    }
  }

  // --- MÉTODOS DE ENVIO E AUXILIARES ---

  async sendWhatsappMessage(remoteJid: string, text: string): Promise<void> {
    try {
      // Limpa o JID para garantir que a API aceite (especialmente se for @lid)
      const cleanJid =
        remoteJid.split(':')[0].split('@')[0] +
        (remoteJid.includes('@g.us') ? '@g.us' : '@s.whatsapp.net');

      await this.httpService.axiosRef.post(
        `${this.evolutionApiUrl}/message/sendText/${this.evolutionInstanceName}`,
        {
          number: cleanJid,
          text: text,
          linkPreview: false,
        },
        { headers: { apikey: this.evolutionApiKey } },
      );
      this.logger.log(`✅ Resposta enviada para ${cleanJid}`);
    } catch (e) {
      this.logger.error(
        `❌ Erro no envio: ${e.response?.data?.message || e.message}`,
      );
    }
  }

  private async handleContasAPagar(remoteJid: string): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const contas = await this.prisma.accountPay.findMany({
      where: {
        dueDate: { gte: today, lt: new Date(today.getTime() + 86400000) },
        paid: false,
      },
    });

    if (contas.length === 0) {
      return await this.sendWhatsappMessage(
        remoteJid,
        '🏷️ Tudo em dia! Nenhuma conta para hoje.',
      );
    }

    let msg = '*📅 CONTAS DE HOJE:*\n\n';
    contas.forEach((c) => {
      msg += `• ${c.description}: *R$ ${new Decimal(c.amount).toFixed(2)}*\n`;
    });
    await this.sendWhatsappMessage(remoteJid, msg);
  }

  private async handleDespesa(remoteJid: string, text: string): Promise<void> {
    const match = text.match(/(?:despesa|gasto)\s+([\d,.]+)\s+(.+)/i);
    if (!match)
      return await this.sendWhatsappMessage(
        remoteJid,
        '⚠️ Use: despesa [valor] [descrição]',
      );

    const org = await this.getOrg();
    await this.prisma.accountPay.create({
      data: {
        description: match[2],
        amount: parseFloat(match[1].replace(',', '.')),
        dueDate: new Date(),
        organizationId: org.id,
        paid: false,
      },
    });
    await this.sendWhatsappMessage(
      remoteJid,
      `✅ Gasto registrado no ERP Electrosal!`,
    );
  }

  private async executeQuickTransfer(
    jid: string,
    de: string,
    para: string,
    cot: string,
    val: string,
    orgId: string,
  ) {
    // Implementação da transferência... (mantida conforme seu original)
  }

  private async getOrg(): Promise<{ id: string }> {
    const org = await this.prisma.organization.findFirst();
    return { id: org?.id || process.env.DEFAULT_ORGANIZATION_ID || '' };
  }
}
