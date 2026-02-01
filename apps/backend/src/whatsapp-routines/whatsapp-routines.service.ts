import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWhatsappRoutineDto } from './dto/create-whatsapp-routine.dto';
import { UpdateWhatsappRoutineDto } from './dto/update-whatsapp-routine.dto';
import { WhatsAppRoutine } from '@prisma/client';

@Injectable()
export class WhatsappRoutinesService {
  private readonly logger = new Logger(WhatsappRoutinesService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Processa mensagens recebidas verificando se existe uma rotina dinâmica no banco.
   * Retorna true se uma rotina foi encontrada e processada.
   */
  async processIncomingMessage(
    remoteJid: string,
    messageText: string,
    organizationId: string,
    sendWhatsappMessage: (remoteJid: string, text: string) => Promise<void>,
  ): Promise<boolean> {
    const trigger = messageText.trim().toLowerCase();

    this.logger.log(
      `🔍 [DEBUG] Buscando rotina: Org=${organizationId} | Trigger=${trigger}`,
    );

    // 1. Busca a rotina no banco de dados
    const routine = await this.prisma.whatsAppRoutine.findFirst({
      where: {
        organizationId: organizationId,
        trigger: { equals: trigger, mode: 'insensitive' },
        isActive: true,
      },
    });

    // 2. Se não encontrar, avisa no log e retorna false para o bot tentar comandos fixos
    if (!routine) {
      this.logger.warn(
        `⚠️ [DEBUG] Nenhuma rotina ativa encontrada para o gatilho: "${trigger}"`,
      );
      return false;
    }

    this.logger.log(
      `🚀 Executando rotina dinâmica: ${routine.name} (${routine.id})`,
    );

    try {
      // 3. Converte a string JSON do banco em objeto
      // Nota: No Prisma, se o campo for String, usamos JSON.parse. Se for Json, usamos direto.
      const steps =
        typeof routine.steps === 'string'
          ? JSON.parse(routine.steps)
          : routine.steps;

      // 4. Loop de execução dos passos
      for (const step of steps) {
        switch (step.type) {
          case 'text':
            this.logger.debug(
              `Enviando texto: ${step.content || step.message}`,
            );
            await sendWhatsappMessage(remoteJid, step.content || step.message);
            break;

          case 'delay':
            const ms = step.ms || 1000;
            this.logger.debug(`Aguardando delay de ${ms}ms...`);
            await new Promise((resolve) => setTimeout(resolve, ms));
            break;

          default:
            this.logger.warn(`Tipo de passo desconhecido: ${step.type}`);
            break;
        }
      }

      return true; // Rotina processada com sucesso
    } catch (err) {
      this.logger.error(
        `❌ Erro ao processar passos da rotina "${routine.name}":`,
        err,
      );
      await sendWhatsappMessage(
        remoteJid,
        'Ocorreu um erro interno ao processar este comando.',
      );
      return true; // Retornamos true para não cair em comandos fixos após um erro real
    }
  }

  // --- MÉTODOS CRUD (MANTIDOS E CORRIGIDOS) ---

  async create(
    createWhatsappRoutineDto: CreateWhatsappRoutineDto,
    organizationId: string,
  ): Promise<WhatsAppRoutine> {
    return this.prisma.whatsAppRoutine.create({
      data: {
        ...createWhatsappRoutineDto,
        organizationId,
        // Garante que o gatilho seja salvo sempre em minúsculo para facilitar a busca
        trigger: createWhatsappRoutineDto.trigger.trim().toLowerCase(),
      },
    });
  }

  async findAll(organizationId: string): Promise<WhatsAppRoutine[]> {
    return this.prisma.whatsAppRoutine.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, organizationId: string): Promise<WhatsAppRoutine> {
    const routine = await this.prisma.whatsAppRoutine.findUnique({
      where: { id },
    });

    if (!routine || routine.organizationId !== organizationId) {
      throw new NotFoundException(`Rotina com ID ${id} não encontrada.`);
    }
    return routine;
  }

  async update(
    id: string,
    updateWhatsappRoutineDto: UpdateWhatsappRoutineDto,
    organizationId: string,
  ): Promise<WhatsAppRoutine> {
    await this.findOne(id, organizationId); // Verifica se pertence à organização
    return this.prisma.whatsAppRoutine.update({
      where: { id },
      data: {
        ...updateWhatsappRoutineDto,
        // Atualiza trigger em lowercase se ele for enviado
        trigger: updateWhatsappRoutineDto.trigger?.trim().toLowerCase(),
      },
    });
  }

  async remove(id: string, organizationId: string): Promise<WhatsAppRoutine> {
    await this.findOne(id, organizationId);
    return this.prisma.whatsAppRoutine.delete({
      where: { id },
    });
  }
}
