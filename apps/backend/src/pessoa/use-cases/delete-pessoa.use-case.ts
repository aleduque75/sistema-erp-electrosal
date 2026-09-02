import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PessoaRepository } from '../repositories/pessoa.repository';

@Injectable()
export class DeletePessoaUseCase {
  constructor(private readonly pessoaRepository: PessoaRepository) {}

  async execute(organizationId: string, id: string) {
    const pessoa = await this.pessoaRepository.findById(id, organizationId);
    if (!pessoa) {
      throw new NotFoundException(`Pessoa com ID ${id} não encontrada.`);
    }

    const hasSales = await this.pessoaRepository.hasSalesHistory(
      id,
      organizationId,
    );
    if (hasSales) {
      throw new ConflictException(
        'Esta pessoa não pode ser removida pois possui um histórico de vendas.',
      );
    }

    const hasPurchaseOrders =
      await this.pessoaRepository.hasPurchaseOrdersHistory(
        id,
        organizationId,
      );
    if (hasPurchaseOrders) {
      throw new ConflictException(
        'Esta pessoa não pode ser removida pois possui ordens de compra vinculadas.',
      );
    }

    const hasFinancials =
      await this.pessoaRepository.hasFinancialTransactions(
        id,
        organizationId,
      );
    if (hasFinancials) {
      throw new ConflictException(
        'Esta pessoa não pode ser removida pois possui registros financeiros vinculados.',
      );
    }

    await this.pessoaRepository.delete(id, organizationId);
    return { message: 'Pessoa removida com sucesso.' };
  }
}
