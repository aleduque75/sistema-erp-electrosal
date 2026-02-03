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

    // Normalização para v2 (array ou objeto único)
    const messageData =
      body.data?.messages?.[0] || body.data?.[0] || body.data || body;
    if (!messageData || !messageData.message) return;

    const messageId = messageData.key?.id;
    if (!messageId || this.processedMessageIds.has(messageId)) return;

    // Evita processamento duplo (cache de 5 min)
    this.processedMessageIds.add(messageId);
    setTimeout(() => this.processedMessageIds.delete(messageId), 5 * 60 * 1000);

    const remoteJid = messageData.key?.remoteJid;
    const isFromMe = messageData.key?.fromMe;
    const message = messageData.message;

    const messageText = (
      message.conversation ||
      message.extendedTextMessage?.text ||
      message.imageMessage?.caption ||
      ''
    ).trim();

    this.logger.log(
      `📩 Processando: [${remoteJid}] | FMe: ${isFromMe} | Texto: "${messageText}"`,
    );

    if (!messageText) return;

    const org = await this.getOrg();

    // 1. Prioridade: Rotas Dinâmicas do ERP (WhatsappRoutinesService)
    const wasDynamic = await this.whatsappRoutineService.processIncomingMessage(
      remoteJid,
      messageText,
      org.id,
      async (jid, text) => {
        await this.sendWhatsappMessage(jid, text);
      },
    );
    if (wasDynamic) return;

    // 2. Comandos Fixos e Regex
    const lowerText = messageText.toLowerCase();

    // Comando: /transferir rápido via Regex
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

    // Comando: Contas a pagar (ajustado para ser mais flexível)
    if (lowerText.includes('contas a pagar') || lowerText === '/contas') {
      return await this.handleContasAPagar(remoteJid);
    }

    // Comando: Iniciar fluxo de pagamento
    if (lowerText === '/pagar') {
      return await this.sendWhatsappMessage(
        remoteJid,
        '📅 Informe a data do pagamento (ex: 29/01/26):',
      );
    }

    // Comando: Registro de despesa rápida
    if (lowerText.startsWith('despesa ') || lowerText.startsWith('gasto ')) {
      return await this.handleDespesa(remoteJid, messageText);
    }
  }

  async sendWhatsappMessage(remoteJid: string, text: string): Promise<void> {
    try {
      // Tratamento de JIDs: Mantém @lid e @g.us intactos. Formata números puros.
      const target = remoteJid.includes('@')
        ? remoteJid
        : `${remoteJid.replace(/\D/g, '')}@s.whatsapp.net`;

      await this.httpService.axiosRef.post(
        `${this.evolutionApiUrl}/message/sendText/${this.evolutionInstanceName}`,
        {
          number: target,
          text: text,
          linkPreview: false,
        },
        { headers: { apikey: this.evolutionApiKey } },
      );
      this.logger.log(`✅ Resposta enviada com sucesso para ${target}`);
    } catch (e) {
      this.logger.error(
        `❌ Erro no envio para ${remoteJid}: ${e.response?.data?.message || e.message}`,
      );
    }
  }

  private async handleContasAPagar(remoteJid: string): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const contas = await this.prisma.accountPay.findMany({
      where: {
        dueDate: { gte: today, lt: tomorrow },
        paid: false,
      },
    });

    if (contas.length === 0) {
      this.logger.log(`ℹ️ Nenhuma conta encontrada para hoje.`);
      return await this.sendWhatsappMessage(
        remoteJid,
        '🏷️ Tudo em dia! Nenhuma conta para hoje.',
      );
    }

    let msg = `*📅 CONTAS DE HOJE (${contas.length}):*\n\n`;
    contas.forEach((c) => {
      msg += `• ${c.description}: *R$ ${new Decimal(c.amount.toString()).toFixed(2)}*\n`;
    });
    await this.sendWhatsappMessage(remoteJid, msg);
  }

  private async handleDespesa(remoteJid: string, text: string): Promise<void> {
    const match = text.match(/(?:despesa|gasto)\s+([\d,.]+)\s+(.+)/i);
    if (!match) {
      return await this.sendWhatsappMessage(
        remoteJid,
        '⚠️ Use: despesa [valor] [descrição]',
      );
    }

    const org = await this.getOrg();
    const valor = parseFloat(match[1].replace(',', '.'));

    await this.prisma.accountPay.create({
      data: {
        description: match[2],
        amount: valor,
        dueDate: new Date(),
        organizationId: org.id,
        paid: false,
      },
    });
    await this.sendWhatsappMessage(
      remoteJid,
      `✅ Gasto de R$ ${valor.toFixed(2)} registrado no ERP Electrosal!`,
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
    this.logger.log(
      `Iniciando transferência rápida: ${de} -> ${para} | Valor: ${val}`,
    );
    // Adicionar lógica de transferência aqui
  }

  private async getOrg(): Promise<{ id: string }> {
    const org = await this.prisma.organization.findFirst();
    return { id: org?.id || process.env.DEFAULT_ORGANIZATION_ID || '' };
  }
}
