import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWhatsappRoutineDto } from './dto/create-whatsapp-routine.dto';
import { UpdateWhatsappRoutineDto } from './dto/update-whatsapp-routine.dto';
import { WhatsAppRoutine } from '@prisma/client';

@Injectable()
export class WhatsappRoutinesService {
  private readonly logger = new Logger(WhatsappRoutinesService.name);

  // Usamos o número limpo (ex: 55119...) como chave para não perder o estado se o ID mudar
  private activeStates = new Map<
    string,
    { routineId: string; stepIndex: number; data: any }
  >();

  constructor(private prisma: PrismaService) {}

  // Extrai apenas os números do JID (remove @lid, @s.whatsapp, etc)
  private getCleanId(jid: string): string {
    return jid.split('@')[0].split(':')[0].replace(/\D/g, '');
  }

  async processIncomingMessage(
    remoteJid: string,
    messageText: string,
    organizationId: string,
    sendWhatsappMessage: (remoteJid: string, text: string) => Promise<void>,
  ): Promise<boolean> {
    const userId = this.getCleanId(remoteJid); // ID Limpo para o Mapa de estados
    const trigger = messageText.trim().toLowerCase();

    const pendingState = this.activeStates.get(userId);
    let routine: WhatsAppRoutine | null = null;
    let storedData = pendingState?.data || {};

    // 1. Recupera rotina se houver estado pendente
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

        if (lastStep?.type === 'set_state') {
          const key = lastStep.key || 'input';
          storedData[key] = messageText;
          this.logger.log(
            `💾 [${userId}] Resposta capturada: ${key} = ${messageText}`,
          );
        }
      }
    }

    // 2. Busca novo gatilho se não houver rotina ativa
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
      const startIndex = pendingState ? pendingState.stepIndex + 1 : 0;

      for (let i = startIndex; i < steps.length; i++) {
        const step = steps[i];

        switch (step.type) {
          case 'text':
            let message = step.content || step.message || '';
            // Substitui {{variavel}} pelo valor salvo
            Object.keys(storedData).forEach((k) => {
              message = message.replace(
                new RegExp(`{{${k}}}`, 'g'),
                storedData[k],
              );
            });

            // IMPORTANTE: Enviamos para o remoteJid original,
            // mas o WhatsappService deve garantir que vá para o @s.whatsapp.net
            await sendWhatsappMessage(remoteJid, message);
            break;

          case 'delay':
            await new Promise((resolve) =>
              setTimeout(resolve, step.ms || 1000),
            );
            break;

          case 'set_state':
            this.logger.log(
              `📍 [${userId}] Aguardando: ${step.key || 'valor'}`,
            );
            this.activeStates.set(userId, {
              routineId: routine.id,
              stepIndex: i,
              data: storedData,
            });
            return true;

          case 'finish':
            this.activeStates.delete(userId);
            if (step.content)
              await sendWhatsappMessage(remoteJid, step.content);
            return true;
        }
      }

      this.activeStates.delete(userId);
      return true;
    } catch (err) {
      this.logger.error(`❌ Erro na rotina "${routine.name}":`, err);
      return false;
    }
  }

  // --- MÉTODOS CRUD MANTIDOS ---
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
