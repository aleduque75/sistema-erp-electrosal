import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateExpenseAutomationDto } from './dto/create-expense-automation.dto';
import { AccountsPayService } from '../accounts-pay/accounts-pay.service';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AutomationsService {
  constructor(
    private readonly accountsPayService: AccountsPayService,
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async createExpense(createExpenseDto: CreateExpenseAutomationDto) {
    const { description, amount, dueDate, creditorName } = createExpenseDto;

    // TODO: The organizationId should ideally come from the API Key's context, not a default env var.
    const organizationId = this.configService.get<string>('DEFAULT_ORGANIZATION_ID');
    if (!organizationId) {
        throw new Error('DEFAULT_ORGANIZATION_ID is not set in environment variables.');
    }

    // Find or create the creditor (Pessoa) and the corresponding Fornecedor
    let fornecedorPessoa = await this.prisma.pessoa.findFirst({
      where: { name: creditorName, organizationId },
    });

    if (!fornecedorPessoa) {
      fornecedorPessoa = await this.prisma.pessoa.create({
        data: {
          organizationId,
          name: creditorName,
          type: 'JURIDICA', // Corrected: Use a valid PessoaType
        },
      });
    }

    // Ensure a 'Fornecedor' record exists for this 'Pessoa'
    let fornecedor = await this.prisma.fornecedor.findUnique({
        where: { pessoaId: fornecedorPessoa.id }
    });

    if (!fornecedor) {
        fornecedor = await this.prisma.fornecedor.create({
            data: {
                pessoaId: fornecedorPessoa.id,
                organizationId,
            }
        })
    }
    
    // The DTO for creating an account payable
    const createAccountPayDto = {
      dueDate: new Date(dueDate),
      description,
      amount,
      fornecedorId: fornecedor.pessoaId, // Corrected: Use fornecedorId which maps to Pessoa's ID
      // paymentMethod and bankAccountId are not part of CreateAccountPayDto, they are for payment actions
    };

    // Corrected: Call 'create' with both organizationId and the DTO
    return this.accountsPayService.create(organizationId, createAccountPayDto);
  }
}
