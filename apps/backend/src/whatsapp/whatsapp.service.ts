import { WhatsappRoutinesService } from '../whatsapp-routines/whatsapp-routines.service';
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, TipoTransacaoPrisma } from '@prisma/client';
import { HttpService } from '@nestjs/axios';
import { AccountsPayService } from '../accounts-pay/accounts-pay.service';
import { Decimal } from 'decimal.js';
import { WhatsAppWebhookPayload } from './types/whatsapp-webhook.types';

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

  async handleIncomingMessage(body: WhatsAppWebhookPayload): Promise<void> {
    // 1. QR Code Update
    if (body.event === 'qrcode.updated') {
      this.latestQrCode = body.data?.qrcode?.base64 || body.data?.qr;
      return;
    }

    // 2. Validação e Deduplicação
    if (body.event !== 'messages.upsert' || !body.data) return;
    const messageData = body.data as any;
    const messageId = messageData.key?.id;

    if (!messageId || this.processedMessageIds.has(messageId)) return;
    this.processedMessageIds.add(messageId);
    setTimeout(() => this.processedMessageIds.delete(messageId), 5 * 60 * 1000);

    // 3. Resolução de Identidade
    let remoteJid = messageData.key.remoteJid;
    if (remoteJid.endsWith('@lid') || messageData.key.fromMe) {
      remoteJid = body.sender || remoteJid;
    }

    const message = messageData.message;
    if (!message) return;

    const messageText = (
      message.conversation ||
      message.extendedTextMessage?.text ||
      message.imageMessage?.caption ||
      ''
    ).trim();

    this.logger.log(`📩 Mensagem de [${remoteJid}]: "${messageText}"`);
    const org = await this.getOrg();

    // --- ROTEAMENTO INTELIGENTE ---

    // A. VIA RÁPIDA: /transferir origem destino cotação valor (4 argumentos)
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

    // B. ROTINAS DINÂMICAS: Tenta o que foi configurado no React (Ex: /ajuda ou /transferir passo-a-passo)
    const wasDynamic = await this.whatsappRoutineService.processIncomingMessage(
      remoteJid,
      messageText,
      org.id,
      async (jid, text) => {
        await this.sendWhatsappMessage(jid, text);
      },
    );
    if (wasDynamic) return;

    // C. FLUXOS INTERATIVOS: Se o usuário já iniciou uma conversa de várias etapas
    const state = this.conversationState[remoteJid];
    if (state) {
      return await this.handleConversationFlow(
        remoteJid,
        messageText,
        state,
        org,
      );
    }

    // D. COMANDOS FIXOS (FALLBACK)
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

  // --- LÓGICA DE TRANSFERÊNCIA ---

  private async executeQuickTransfer(
    jid: string,
    de: string,
    para: string,
    cot: string,
    val: string,
    orgId: string,
  ) {
    const cotacao = parseFloat(cot.replace(',', '.'));
    const valorBrl = parseFloat(val.replace(',', '.'));

    const contaOrigem = await this.getContaCorrenteByAlias(de, orgId, jid);
    const contaDestino = await this.getContaCorrenteByAlias(para, orgId, jid);

    if (!contaOrigem || !contaDestino) return;

    const transferData = {
      contaOrigemId: contaOrigem.id,
      contaDestinoId: contaDestino.id,
      description: 'Transferência Rápida via WhatsApp',
      valor_brl: valorBrl,
      cotacao: cotacao,
      valor_au: valorBrl / cotacao,
      date: new Date(),
    };

    return await this.executeTransferPrisma(jid, transferData, orgId);
  }

  private async executeTransferPrisma(
    remoteJid: string,
    state: any,
    orgId: string,
  ) {
    try {
      await this.prisma.$transaction(async (tx) => {
        const origem = await tx.contaCorrente.findUnique({
          where: { id: state.contaOrigemId },
        });
        if (!origem) {
          await this.sendWhatsappMessage(remoteJid, '❌ Conta de origem não encontrada.');
          return;
        }

        const destino = await tx.contaCorrente.findUnique({
          where: { id: state.contaDestinoId },
        });
        if (!destino) {
          await this.sendWhatsappMessage(remoteJid, '❌ Conta de destino não encontrada.');
          return;
        }

        // 1. Débito (Origem)
        if (!origem.contaContabilId) {
          await this.sendWhatsappMessage(remoteJid, `❌ Conta corrente de origem "${origem.nome}" não possui uma conta contábil vinculada.`);
          return;
        }
        const debito = await tx.transacao.create({
          data: {
            descricao: `Saída: ${state.description}`,
            valor: new Prisma.Decimal(state.valor_brl),
            tipo: TipoTransacaoPrisma.DEBITO,
            moeda: "BRL", // Adicionado para resolver o erro de compilação
            dataHora: state.date,
            contaCorrenteId: state.contaOrigemId,
            contaContabilId: origem.contaContabilId,
            organizationId: orgId,
            goldAmount: new Prisma.Decimal(state.valor_au),
            goldPrice: new Prisma.Decimal(state.cotacao),
          },
        });

        // 2. Crédito (Destino)
        if (!destino.contaContabilId) {
          await this.sendWhatsappMessage(remoteJid, `❌ Conta corrente de destino "${destino.nome}" não possui uma conta contábil vinculada.`);
          return;
        }
        const credito = await tx.transacao.create({
          data: {
            descricao: `Entrada: ${state.description}`,
            valor: new Prisma.Decimal(state.valor_brl),
            tipo: TipoTransacaoPrisma.CREDITO,
            moeda: "BRL", // Adicionado para resolver o erro de compilação
            dataHora: state.date,
            contaCorrenteId: state.contaDestinoId,
            contaContabilId: destino.contaContabilId,
            organizationId: orgId,
            goldAmount: new Prisma.Decimal(state.valor_au),
            goldPrice: new Prisma.Decimal(state.cotacao),
            linkedTransactionId: debito.id,
          },
        });

        // 3. Vincula o débito ao crédito
        await tx.transacao.update({
          where: { id: debito.id },
          data: { linkedTransactionId: credito.id },
        });
      });

      await this.sendWhatsappMessage(
        remoteJid,
        `✅ Transferência de R$ ${state.valor_brl.toFixed(2)} realizada com sucesso!`,
      );
    } catch (e) {
      this.logger.error(e);
      await this.sendWhatsappMessage(
        remoteJid,
        '❌ Erro ao processar transação no banco.',
      );
    }
  }

  // --- FLUXOS DE CONVERSA ---

  private async handleConversationFlow(
    remoteJid: string,
    text: string,
    state: any,
    org: any,
  ): Promise<void> {
    // Aqui você pode adicionar o switch case para /pagar ou o passo-a-passo do /transferir
    this.logger.log(`Usuário ${remoteJid} no passo: ${state.step}`);

    if (state.step === 'awaiting_date') {
      // Lógica de data para o /pagar...
    }
  }

  // --- AUXILIARES ---

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
      return await this.sendWhatsappMessage(
        remoteJid,
        'Tudo em dia! Nenhuma conta para hoje.',
      );

    let msg = '*CONTAS DE HOJE:*\n';
    contas.forEach(
      (c) =>
        (msg += `• ${c.description}: R$ ${new Decimal(c.amount).toFixed(2)}\n`),
    );
    await this.sendWhatsappMessage(remoteJid, msg);
  }

  private async handleDespesa(remoteJid: string, text: string): Promise<void> {
    const match = text.match(/(?:despesa|gasto)\s+([\d,.]+)\s+(.+)/i);
    if (!match)
      return await this.sendWhatsappMessage(
        remoteJid,
        'Use: despesa [valor] [descrição]',
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
    await this.sendWhatsappMessage(remoteJid, `✅ Gasto registrado!`);
  }

  private async getContaCorrenteByAlias(
    alias: string,
    organizationId: string,
    remoteJid: string,
  ) {
    const conta = await this.prisma.contaCorrente.findFirst({
      where: {
        organizationId,
        isActive: true,
        OR: [
          { nick: { equals: alias, mode: 'insensitive' } },
          { nome: { equals: alias, mode: 'insensitive' } },
          { numeroConta: alias },
        ],
      },
    });
    if (!conta)
      await this.sendWhatsappMessage(
        remoteJid,
        `⚠️ Conta "${alias}" não encontrada.`,
      );
    return conta;
  }

  private async getOrg(): Promise<{ id: string }> {
    const org = await this.prisma.organization.findFirst();
    if (org) return { id: org.id };
    return { id: process.env.DEFAULT_ORGANIZATION_ID || '' };
  }

  private async sendWhatsappMessage(
    remoteJid: string,
    text: string,
  ): Promise<void> {
    try {
      await this.httpService.axiosRef.post(
        `${this.evolutionApiUrl}/message/sendText/${this.evolutionInstanceName}`,
        { number: remoteJid, text, delay: 1200 },
        { headers: { apikey: this.evolutionApiKey } },
      );
    } catch (e) {
      this.logger.error(`Erro envio: ${e.message}`);
    }
  }
}
