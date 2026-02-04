import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface RoutineStep {
  type: 'message' | 'input' | 'action';
  content?: string;
  variable?: string;
  key?: string;
  name?: string;
  target?: string;
  validation?: {
    type: 'number' | 'text' | 'date';
    required?: boolean;
  };
  action?: string;
  nextStep?: number;
}

interface ActiveState {
  routineId: string;
  stepIndex: number;
  data: Record<string, any>;
}

@Injectable()
export class WhatsappRoutinesService {
  private readonly logger = new Logger(WhatsappRoutinesService.name);
  private activeStates = new Map<string, ActiveState>();

  constructor(private prisma: PrismaService) {}

  private getCleanId(jid: string): string {
    return jid.split('@')[0].split(':')[0];
  }

  async processIncomingMessage(
    remoteJid: string,
    messageText: string,
    organizationId: string,
    sendMessage: (jid: string, text: string) => Promise<void>,
  ): Promise<boolean> {
    const cleanId = this.getCleanId(remoteJid);
    const lowerText = messageText.toLowerCase().trim();

    // Se a mensagem começa com '/', reseta qualquer estado ativo
    if (messageText.trim().startsWith('/')) {
      this.logger.log(`🔄 Comando detectado, resetando estado para ${cleanId}`);
      this.activeStates.delete(cleanId);
    }

    // Verifica se há estado ativo para este usuário
    const activeState = this.activeStates.get(cleanId);

    if (activeState) {
      // Usuário está em uma rotina ativa
      return await this.continueRoutine(
        cleanId,
        remoteJid,
        messageText,
        activeState,
        organizationId,
        sendMessage,
      );
    }

    // Verifica se é um trigger de nova rotina
    const routine = await this.prisma.whatsAppRoutine.findFirst({
      where: {
        organizationId,
        trigger: lowerText,
        isActive: true,
      },
    });

    if (routine) {
      await this.startRoutine(cleanId, remoteJid, routine, sendMessage);
      return true;
    }

    return false;
  }

  private async startRoutine(
    cleanId: string,
    remoteJid: string,
    routine: any,
    sendMessage: (jid: string, text: string) => Promise<void>,
  ): Promise<void> {
    this.logger.log(`🚀 Iniciando rotina "${routine.name}" para ${cleanId}`);

    const steps = (routine.steps as unknown) as RoutineStep[];
    if (!steps || steps.length === 0) {
      await sendMessage(remoteJid, '❌ Rotina sem passos configurados.');
      return;
    }

    // Cria estado inicial
    this.activeStates.set(cleanId, {
      routineId: routine.id,
      stepIndex: 0,
      data: {},
    });

    // Executa primeiro passo
    await this.executeStep(cleanId, remoteJid, steps[0], sendMessage);
  }

  private async continueRoutine(
    cleanId: string,
    remoteJid: string,
    messageText: string,
    activeState: ActiveState,
    organizationId: string,
    sendMessage: (jid: string, text: string) => Promise<void>,
  ): Promise<boolean> {
    const routine = await this.prisma.whatsAppRoutine.findUnique({
      where: { id: activeState.routineId },
    });

    if (!routine) {
      this.activeStates.delete(cleanId);
      await sendMessage(remoteJid, '❌ Rotina não encontrada.');
      return true;
    }

    const steps = (routine.steps as unknown) as RoutineStep[];
    const currentStep = steps[activeState.stepIndex];

    // Log de debug para ver o conteúdo do step
    this.logger.log('CONTEUDO DO STEP:', JSON.stringify(currentStep, null, 2));

    if (!currentStep) {
      this.activeStates.delete(cleanId);
      await sendMessage(remoteJid, '✅ Rotina finalizada.');
      return true;
    }

    // Se o passo atual espera input
    if (currentStep.type === 'input') {
      // Valida input
      const isValid = this.validateInput(messageText, currentStep.validation);
      if (!isValid) {
        await sendMessage(
          remoteJid,
          '❌ Entrada inválida. Por favor, tente novamente.',
        );
        return true;
      }

      // Tenta buscar o nome da variável em múltiplos campos possíveis
      const varName = currentStep.variable || currentStep.key || currentStep.name || currentStep.target;
      
      this.logger.log(`📝 Salvando resposta: varName="${varName}", valor="${messageText}"`);

      // Armazena o valor
      if (varName) {
        activeState.data[varName] = messageText;
        this.logger.log(`✅ Dados atualizados:`, activeState.data);
      } else {
        this.logger.warn('⚠️ Nenhum campo de variável encontrado no step!');
      }

      // Avança para próximo passo
      activeState.stepIndex++;
      this.activeStates.set(cleanId, activeState);

      // Executa próximo passo
      const nextStep = steps[activeState.stepIndex];
      if (nextStep) {
        await this.executeStep(cleanId, remoteJid, nextStep, sendMessage);
      } else {
        // Rotina finalizada
        await this.finalizeRoutine(
          cleanId,
          remoteJid,
          routine,
          activeState.data,
          organizationId,
          sendMessage,
        );
      }
    }

    return true;
  }

  private async executeStep(
    cleanId: string,
    remoteJid: string,
    step: RoutineStep,
    sendMessage: (jid: string, text: string) => Promise<void>,
  ): Promise<void> {
    if (step.type === 'message' && step.content) {
      await sendMessage(remoteJid, step.content);

      // Se há próximo passo automático
      const state = this.activeStates.get(cleanId);
      if (state && step.nextStep !== undefined) {
        state.stepIndex = step.nextStep;
        this.activeStates.set(cleanId, state);
      }
    } else if (step.type === 'input' && step.content) {
      await sendMessage(remoteJid, step.content);
    }
  }

  private validateInput(
    input: string,
    validation?: RoutineStep['validation'],
  ): boolean {
    if (!validation) return true;

    if (validation.required && !input.trim()) {
      return false;
    }

    if (validation.type === 'number') {
      return !isNaN(parseFloat(input));
    }

    if (validation.type === 'date') {
      const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/;
      return dateRegex.test(input);
    }

    return true;
  }

  private async finalizeRoutine(
    cleanId: string,
    remoteJid: string,
    routine: any,
    data: Record<string, any>,
    organizationId: string,
    sendMessage: (jid: string, text: string) => Promise<void>,
  ): Promise<void> {
    this.logger.log(
      `✅ Finalizando rotina "${routine.name}" para ${cleanId}`,
      data,
    );

    // Executa ação final baseada no nome da rotina
    if (routine.name === 'transferir' || routine.trigger === '/transferir') {
      await this.handleTransferAction(
        remoteJid,
        data,
        organizationId,
        sendMessage,
      );
    }

    // Remove estado
    this.activeStates.delete(cleanId);
  }

  private async handleTransferAction(
    remoteJid: string,
    data: Record<string, any>,
    organizationId: string,
    sendMessage: (jid: string, text: string) => Promise<void>,
  ): Promise<void> {
    try {
      const { origem, destino, valor } = data;

      if (!origem || !destino || !valor) {
        await sendMessage(
          remoteJid,
          '❌ Dados incompletos para realizar a transferência.',
        );
        return;
      }

      // Busca contas correntes pelo nick ou número
      const contaOrigem = await this.prisma.contaCorrente.findFirst({
        where: {
          organizationId,
          OR: [{ nick: origem }, { numeroConta: origem }],
          isActive: true,
        },
      });

      const contaDestino = await this.prisma.contaCorrente.findFirst({
        where: {
          organizationId,
          OR: [{ nick: destino }, { numeroConta: destino }],
          isActive: true,
        },
      });

      if (!contaOrigem) {
        await sendMessage(
          remoteJid,
          `❌ Conta de origem "${origem}" não encontrada.`,
        );
        return;
      }

      if (!contaDestino) {
        await sendMessage(
          remoteJid,
          `❌ Conta de destino "${destino}" não encontrada.`,
        );
        return;
      }

      const valorNumerico = parseFloat(valor);
      if (isNaN(valorNumerico) || valorNumerico <= 0) {
        await sendMessage(remoteJid, '❌ Valor inválido.');
        return;
      }

      // Busca conta contábil padrão para transferências
      const contaTransferencia = await this.prisma.contaContabil.findFirst({
        where: {
          organizationId,
          tipo: 'ATIVO',
          aceitaLancamento: true,
        },
      });

      if (!contaTransferencia) {
        await sendMessage(
          remoteJid,
          '❌ Conta contábil para transferências não configurada.',
        );
        return;
      }

      // Cria transações de débito e crédito
      const dataHora = new Date();

      const transacaoDebito = await this.prisma.transacao.create({
        data: {
          tipo: 'DEBITO',
          valor: valorNumerico,
          moeda: 'BRL',
          descricao: `Transferência para ${contaDestino.nome}`,
          dataHora,
          contaContabilId: contaTransferencia.id,
          contaCorrenteId: contaOrigem.id,
          organizationId,
          status: 'ATIVA',
        },
      });

      const transacaoCredito = await this.prisma.transacao.create({
        data: {
          tipo: 'CREDITO',
          valor: valorNumerico,
          moeda: 'BRL',
          descricao: `Transferência de ${contaOrigem.nome}`,
          dataHora,
          contaContabilId: contaTransferencia.id,
          contaCorrenteId: contaDestino.id,
          organizationId,
          status: 'ATIVA',
          linkedTransactionId: transacaoDebito.id,
        },
      });

      // Atualiza a transação de débito com o link
      await this.prisma.transacao.update({
        where: { id: transacaoDebito.id },
        data: { linkedTransactionId: transacaoCredito.id },
      });

      await sendMessage(
        remoteJid,
        `✅ Transferência realizada com sucesso!\n\n` +
          `💰 Valor: R$ ${valorNumerico.toFixed(2)}\n` +
          `📤 De: ${contaOrigem.nome}\n` +
          `📥 Para: ${contaDestino.nome}`,
      );
    } catch (error) {
      this.logger.error('Erro ao processar transferência:', error);
      await sendMessage(
        remoteJid,
        '❌ Erro ao processar transferência. Tente novamente.',
      );
    }
  }

  // Método para cancelar rotina ativa
  async cancelRoutine(remoteJid: string): Promise<void> {
    const cleanId = this.getCleanId(remoteJid);
    this.activeStates.delete(cleanId);
  }

  // Método para limpar estados antigos (executar periodicamente)
  clearOldStates(): void {
    // Estados são mantidos apenas em memória, então limpam ao reiniciar
    // Pode implementar TTL se necessário
  }
}
