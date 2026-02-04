import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWhatsappRoutineDto } from './dto/create-whatsapp-routine.dto';
import { UpdateWhatsappRoutineDto } from './dto/update-whatsapp-routine.dto';
import { WhatsAppRoutine } from '@prisma/client';

@Injectable()
export class WhatsappRoutinesService {
  private readonly logger = new Logger(WhatsappRoutinesService.name);
  private activeStates = new Map<
    string,
    { routineId: string; stepIndex: number; data: any }
  >();

  constructor(private prisma: PrismaService) {}

  private getCleanId(jid: string): string {
    return jid.split('@')[0].split(':')[0].replace(/\D/g, '');
  }

  async processIncomingMessage(
    remoteJid: string,
    messageText: string,
    organizationId: string,
    sendWhatsappMessage: (remoteJid: string, text: string) => Promise<void>,
  ): Promise<boolean> {
    const userId = this.getCleanId(remoteJid);
    const trigger = messageText.trim().toLowerCase();
    const pendingState = this.activeStates.get(userId);

    let routine: WhatsAppRoutine | null = null;
    let storedData = pendingState?.data || {};

    // 1. Se houver estado, recupera a rotina e salva a resposta anterior
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
          storedData[ (lastStep.key || lastStep.variable || lastStep.varName || 'input') || 'input'] = messageText;
          this.logger.log(
            `💾 [${userId}] Resposta salva: ${ (lastStep.key || lastStep.variable || lastStep.varName || 'input')} = ${messageText}`,
          );
        }
      }
    }

    // 2. Busca novo gatilho se necessário
    if (!routine) {
      routine = await this.prisma.whatsAppRoutine.findFirst({
        where: {
          organizationId,
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
            let msg = step.content || step.message || '';
            Object.keys(storedData).forEach(
              (k) =>
                (msg = msg.replace(new RegExp(`{{${k}}}`, 'g'), storedData[k])),
            );
            await sendWhatsappMessage(remoteJid, msg);
            break;

          case 'delay':
            await new Promise((r) => setTimeout(r, step.ms || 1000));
            break;

          case 'set_state':
            this.logger.log(`📍 [${userId}] Aguardando: ${step.key}`);
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
      this.logger.error(`❌ Erro na rotina:`, err);
      return false;
    }
  }

  // CRUD
  async create(dto: CreateWhatsappRoutineDto, orgId: string) {
    return this.prisma.whatsAppRoutine.create({
      data: {
        ...dto,
        organizationId: orgId,
        trigger: dto.trigger.toLowerCase(),
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
      data: { ...dto, trigger: dto.trigger?.toLowerCase() },
    });
  }
  async remove(id: string, orgId: string) {
    await this.findOne(id, orgId);
    return this.prisma.whatsAppRoutine.delete({ where: { id } });
  }
}
