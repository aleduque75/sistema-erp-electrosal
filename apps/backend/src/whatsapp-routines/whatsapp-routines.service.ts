import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWhatsappRoutineDto } from './dto/create-whatsapp-routine.dto';
import { UpdateWhatsappRoutineDto } from './dto/update-whatsapp-routine.dto';
import { WhatsAppRoutine } from '@prisma/client';

@Injectable()
export class WhatsappRoutinesService {
  private readonly logger = new Logger(WhatsappRoutinesService.name);

  // Mapa em memória para controlar o estado da conversa (Passo atual e dados coletados)
  private activeStates = new Map<
    string,
    { routineId: string; stepIndex: number; data: any }
  >();

  constructor(private prisma: PrismaService) {}

  async processIncomingMessage(
    remoteJid: string,
    messageText: string,
    organizationId: string,
    sendWhatsappMessage: (remoteJid: string, text: string) => Promise<void>,
  ): Promise<boolean> {
    const trigger = messageText.trim().toLowerCase();

    // 1. Verifica se o usuário já está no meio de uma rotina ativa (Estado pendente)
    const pendingState = this.activeStates.get(remoteJid);
    let routine: WhatsAppRoutine | null = null;

    if (pendingState) {
      routine = await this.prisma.whatsAppRoutine.findUnique({
        where: { id: pendingState.routineId },
      });
    }

    // 2. Se não houver estado pendente, busca por um novo gatilho
    if (!routine) {
      routine = await this.prisma.whatsAppRoutine.findFirst({
        where: {
          organizationId: organizationId,
          trigger: { equals: trigger, mode: 'insensitive' },
          isActive: true,
        },
      });
    }

    if (!routine) {
      this.logger.warn(`⚠️ Nenhuma rotina encontrada para: "${trigger}"`);
      return false;
    }

    try {
      const steps =
        typeof routine.steps === 'string'
          ? JSON.parse(routine.steps)
          : routine.steps;

      // Define por onde começar: do início ou do passo após o último set_state
      const startIndex = pendingState ? pendingState.stepIndex + 1 : 0;

      for (let i = startIndex; i < steps.length; i++) {
        const step = steps[i];

        switch (step.type) {
          case 'text':
            this.logger.debug(
              `Enviando texto: ${step.content || step.message}`,
            );
            await sendWhatsappMessage(remoteJid, step.content || step.message);
            break;

          case 'delay':
            const ms = step.ms || 1000;
            await new Promise((resolve) => setTimeout(resolve, ms));
            break;

          case 'set_state':
            // SALVA O ESTADO E PARA A EXECUÇÃO: O próximo "Oi" continuará daqui
            this.logger.log(`📍 Set State: ${step.value} para ${remoteJid}`);
            this.activeStates.set(remoteJid, {
              routineId: routine.id,
              stepIndex: i,
              data: {
                ...(pendingState?.data || {}),
                [step.key || 'last_input']: messageText,
              },
            });
            return true; // Interrompe para aguardar a resposta do usuário

          case 'finish':
            this.activeStates.delete(remoteJid);
            if (step.content)
              await sendWhatsappMessage(remoteJid, step.content);
            return true;

          default:
            this.logger.warn(`Tipo de passo desconhecido: ${step.type}`);
            break;
        }
      }

      // Se chegar ao fim de todos os passos, limpa o estado
      this.activeStates.delete(remoteJid);
      return true;
    } catch (err) {
      this.logger.error(`❌ Erro na rotina "${routine.name}":`, err);
      return false;
    }
  }

  // --- MÉTODOS CRUD (REVISADOS) ---

  async create(
    dto: CreateWhatsappRoutineDto,
    organizationId: string,
  ): Promise<WhatsAppRoutine> {
    return this.prisma.whatsAppRoutine.create({
      data: {
        ...dto,
        organizationId,
        trigger: dto.trigger.trim().toLowerCase(),
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
      throw new NotFoundException(`Rotina não encontrada.`);
    }
    return routine;
  }

  async update(
    id: string,
    dto: UpdateWhatsappRoutineDto,
    organizationId: string,
  ): Promise<WhatsAppRoutine> {
    await this.findOne(id, organizationId);
    return this.prisma.whatsAppRoutine.update({
      where: { id },
      data: {
        ...dto,
        trigger: dto.trigger?.trim().toLowerCase(),
      },
    });
  }

  async remove(id: string, organizationId: string): Promise<WhatsAppRoutine> {
    await this.findOne(id, organizationId);
    return this.prisma.whatsAppRoutine.delete({ where: { id } });
  }
}
