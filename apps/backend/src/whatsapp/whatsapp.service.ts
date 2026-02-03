import { WhatsappRoutinesService } from '../whatsapp-routines/whatsapp-routines.service';
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
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
    const event = body.event || 'desconhecido';
    if (event === 'qrcode.updated') {
      this.latestQrCode = body.data?.qrcode?.base64 || body.data?.qr;
      return;
    }

    if (event !== 'messages.upsert') return;

    const messageData =
      body.data?.messages?.[0] || body.data?.[0] || body.data || body;
    if (!messageData || !messageData.message) return;

    const messageId = messageData.key?.id;
    if (!messageId || this.processedMessageIds.has(messageId)) return;
    this.processedMessageIds.add(messageId);
    setTimeout(() => this.processedMessageIds.delete(messageId), 5 * 60 * 1000);

    // --- GARANTE O JID REAL ---
    const remoteJid = body.sender || messageData.key?.remoteJid;
    const messageText = (
      messageData.message.conversation ||
      messageData.message.extendedTextMessage?.text ||
      ''
    ).trim();

    this.logger.log(`📩 Processando: [${remoteJid}] | Texto: "${messageText}"`);
    if (!messageText) return;

    const org = await this.getOrg();

    // 1. Prioridade: Rotinas Dinâmicas
    const wasDynamic = await this.whatsappRoutineService.processIncomingMessage(
      remoteJid,
      messageText,
      org.id,
      async (jid, text) => {
        await this.sendWhatsappMessage(jid, text);
      },
    );
    if (wasDynamic) return;

    // 2. Comandos Fixos
    const lowerText = messageText.toLowerCase();
    if (lowerText.includes('contas a pagar') || lowerText === '/contas') {
      return await this.handleContasAPagar(remoteJid);
    }
  }

  async sendWhatsappMessage(remoteJid: string, text: string): Promise<void> {
    try {
      const cleanNumber = remoteJid
        .split('@')[0]
        .split(':')[0]
        .replace(/\D/g, '');
      const target = remoteJid.includes('@g.us')
        ? remoteJid
        : `${cleanNumber}@s.whatsapp.net`;

      await this.httpService.axiosRef.post(
        `${this.evolutionApiUrl}/message/sendText/${this.evolutionInstanceName}`,
        { number: target, text: text, linkPreview: false },
        { headers: { apikey: this.evolutionApiKey } },
      );
      this.logger.log(`✅ Resposta enviada para ${target}`);
    } catch (e) {
      this.logger.error(`❌ Erro no envio: ${e.message}`);
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

    if (contas.length === 0)
      return await this.sendWhatsappMessage(remoteJid, '🏷️ Tudo em dia!');
    let msg = `*📅 CONTAS DE HOJE:*\n\n`;
    contas.forEach(
      (c) =>
        (msg += `• ${c.description}: *R$ ${new Decimal(c.amount).toFixed(2)}*\n`),
    );
    await this.sendWhatsappMessage(remoteJid, msg);
  }

  private async getOrg() {
    const org = await this.prisma.organization.findFirst();
    return { id: org?.id || '' };
  }
}
