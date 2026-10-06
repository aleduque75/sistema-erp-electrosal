import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAccountPayUseCase } from '../../accounts-pay/use-cases/create-account-pay.use-case';
import { TelegramBotService } from '../services/telegram-bot.service';
import { CreateExpenseAutomationDto } from '../dto/create-expense-automation.dto';

@Injectable()
export class CreateExpenseAutomationUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly createAccountPayUseCase: CreateAccountPayUseCase,
    private readonly telegramBotService: TelegramBotService,
  ) {}

  async execute(createExpenseDto: CreateExpenseAutomationDto) {
    const { description, amount, dueDate, creditorName } = createExpenseDto;
    const organizationId = this.telegramBotService.getOrganizationId();

    let fornecedorPessoa = await this.prisma.pessoa.findFirst({
      where: { name: creditorName, organizationId },
    });

    if (!fornecedorPessoa) {
      fornecedorPessoa = await this.prisma.pessoa.create({
        data: {
          organizationId,
          name: creditorName,
          type: 'JURIDICA',
        },
      });
    }

    let fornecedor = await this.prisma.fornecedor.findUnique({
      where: { pessoaId: fornecedorPessoa.id },
    });

    if (!fornecedor) {
      fornecedor = await this.prisma.fornecedor.create({
        data: {
          pessoaId: fornecedorPessoa.id,
          organizationId,
        },
      });
    }

    const createAccountPayDto = {
      dueDate: new Date(dueDate),
      description,
      amount,
      fornecedorId: fornecedor.pessoaId,
    };

    return this.createAccountPayUseCase.execute(organizationId, createAccountPayDto);
  }
}
