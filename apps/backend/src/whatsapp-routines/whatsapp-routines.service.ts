import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWhatsappRoutineDto } from './dto/create-whatsapp-routine.dto';
import { UpdateWhatsappRoutineDto } from './dto/update-whatsapp-routine.dto';
import { WhatsAppRoutine } from '@prisma/client';

@Injectable()
export class WhatsappRoutinesService {
  private readonly logger = new Logger(WhatsappRoutinesService.name);

  // Mapa em memória para controlar o estado da conversa
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
    const pendingState = this.activeStates.get(remoteJid);
    let routine: WhatsAppRoutine | null = null;
    let storedData = pendingState?.data || {};

    // 1. Se estivermos numa rotina ativa, a mensagem atual é uma RESPOSTA ao passo anterior
    if (pendingState) {
      routine = await this.prisma.whatsAppRoutine.findUnique({
        where: { id: pendingState.routineId },
      });

      if (routine) {
        const steps =
          typeof routine.steps === 'string'
            ? JSON.parse(routine.steps)
            : routine.steps;
        const lastStep = steps[pendingState.stepIndex];

        // Captura a resposta do usuário para a chave definida no set_state
        if (lastStep?.type === 'set_state') {
          const key = lastStep.key || 'input';
          storedData[key] = messageText;
          this.logger.log(`💾 Resposta capturada: ${key} = ${messageText}`);
        }
      }
    }

    // 2. Se não houver rotina ativa ou se ela foi concluída, busca novo gatilho
    if (!routine) {
      routine = await this.prisma.whatsAppRoutine.findFirst({
        where: {
          organizationId: organizationId,
          trigger: { equals: trigger, mode: 'insensitive' },
          isActive: true,
        },
      });
    }

    if (!routine) return false;

    try {
      const steps =
        typeof routine.steps === 'string'
          ? JSON.parse(routine.steps)
          : routine.steps;

      // Começa do início ou do próximo passo após a resposta capturada
      const startIndex = pendingState ? pendingState.stepIndex + 1 : 0;

      for (let i = startIndex; i < steps.length; i++) {
        const step = steps[i];

        switch (step.type) {
          case 'text':
            // Substitui variáveis no texto (ex: {{origem}}) se existirem nos dados salvos
            let message = step.content || step.message || '';
            Object.keys(storedData).forEach((k) => {
              message = message.replace(
                new RegExp(`{{${k}}}`, 'g'),
                storedData[k],
              );
            });
            await sendWhatsappMessage(remoteJid, message);
            break;

          case 'delay':
            await new Promise((resolve) =>
              setTimeout(resolve, step.ms || 1000),
            );
            break;

          case 'set_state':
            // Aqui paramos e aguardamos a resposta do usuário
            this.logger.log(
              `📍 Aguardando: ${step.key || 'valor'} para ${remoteJid}`,
            );
            this.activeStates.set(remoteJid, {
              routineId: routine.id,
              stepIndex: i,
              data: storedData,
            });
            return true;

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

      this.activeStates.delete(remoteJid);
      return true;
    } catch (err) {
      this.logger.error(`❌ Erro na rotina "${routine.name}":`, err);
      return false;
    }
  }

  // --- MÉTODOS CRUD (MANTIDOS) ---
  async create(dto: CreateWhatsappRoutineDto, orgId: string) {
    return this.prisma.whatsAppRoutine.create({
      data: {
        ...dto,
        organizationId: orgId,
        trigger: dto.trigger.trim().toLowerCase(),
      },
    });
  }
  async findAll(orgId: string) {
    return this.prisma.whatsAppRoutine.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: 'desc' },
    });
  }
  async findOne(id: string, orgId: string) {
    const r = await this.prisma.whatsAppRoutine.findUnique({ where: { id } });
    if (!r || r.organizationId !== orgId) throw new NotFoundException();
    return r;
  }
  async update(id: string, dto: UpdateWhatsappRoutineDto, orgId: string) {
    await this.findOne(id, orgId);
    return this.prisma.whatsAppRoutine.update({
      where: { id },
      data: { ...dto, trigger: dto.trigger?.trim().toLowerCase() },
    });
  }
  async remove(id: string, orgId: string) {
    await this.findOne(id, orgId);
    return this.prisma.whatsAppRoutine.delete({ where: { id } });
  }
}
