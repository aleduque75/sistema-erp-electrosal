import { Injectable } from '@nestjs/common';
import { CreateTransacaoDto } from './dtos/create-transacao.dto';
import { CreateTransferDto } from './dtos/create-transfer.dto';
import { UpdateTransacaoDto } from './dtos/update-transacao.dto';
import { GenericBulkUpdateTransacaoDto } from './dtos/generic-bulk-update-transacao.dto';
import { BulkCreateTransacaoDto } from './dtos/bulk-create-transacao.dto';
import { CreateTransacaoUseCase } from './use-cases/create-transacao.use-case';
import { CreateTransferUseCase } from './use-cases/create-transfer.use-case';
import { UpdateTransacaoUseCase } from './use-cases/update-transacao.use-case';
import { DeleteTransacaoUseCase } from './use-cases/delete-transacao.use-case';
import { ListTransacoesUseCase } from './use-cases/list-transacoes.use-case';
import { GetTransacaoUseCase } from './use-cases/get-transacao.use-case';
import { FindUnlinkedTransacoesUseCase } from './use-cases/find-unlinked-transacoes.use-case';
import { LinkAccountUseCase } from './use-cases/link-account.use-case';
import { BulkCreateTransacoesUseCase } from './use-cases/bulk-create-transacoes.use-case';
import { BulkUpdateTransacoesUseCase } from './use-cases/bulk-update-transacoes.use-case';
import { TransacaoMapper } from './mappers/transacao.mapper';

/**
 * @deprecated TransacoesService é mantido como fachada retrocompatível para outros módulos.
 * Prefira injetar diretamente os Casos de Uso especializados.
 */
@Injectable()
export class TransacoesService {
  constructor(
    private readonly createTransacaoUseCase: CreateTransacaoUseCase,
    private readonly createTransferUseCase: CreateTransferUseCase,
    private readonly updateTransacaoUseCase: UpdateTransacaoUseCase,
    private readonly deleteTransacaoUseCase: DeleteTransacaoUseCase,
    private readonly listTransacoesUseCase: ListTransacoesUseCase,
    private readonly getTransacaoUseCase: GetTransacaoUseCase,
    private readonly findUnlinkedTransacoesUseCase: FindUnlinkedTransacoesUseCase,
    private readonly linkAccountUseCase: LinkAccountUseCase,
    private readonly bulkCreateTransacoesUseCase: BulkCreateTransacoesUseCase,
    private readonly bulkUpdateTransacoesUseCase: BulkUpdateTransacoesUseCase,
  ) {}

  async create(data: CreateTransacaoDto, organizationId: string, tx?: any): Promise<any> {
    const entity = await this.createTransacaoUseCase.execute(data, organizationId, tx);
    return TransacaoMapper.toResponseDto(entity);
  }

  async createTransfer(organizationId: string, dto: CreateTransferDto): Promise<any> {
    const result = await this.createTransferUseCase.execute(organizationId, dto);
    return {
      debitTransaction: TransacaoMapper.toResponseDto(result.debitTransaction),
      creditTransaction: TransacaoMapper.toResponseDto(result.creditTransaction),
    };
  }

  async findOne(id: string, organizationId: string): Promise<any> {
    const entity = await this.getTransacaoUseCase.execute(id, organizationId);
    return TransacaoMapper.toResponseDto(entity);
  }

  async update(id: string, data: UpdateTransacaoDto, organizationId: string): Promise<any> {
    const entity = await this.updateTransacaoUseCase.execute(id, data, organizationId);
    return TransacaoMapper.toResponseDto(entity);
  }

  async remove(id: string, organizationId: string): Promise<void> {
    return this.deleteTransacaoUseCase.execute(id, organizationId);
  }

  async findAll(organizationId: string, startDate?: string, endDate?: string): Promise<any[]> {
    const list = await this.listTransacoesUseCase.execute(organizationId, startDate, endDate);
    return list.map(TransacaoMapper.toResponseDto);
  }

  async findUnlinked(organizationId: string): Promise<any[]> {
    const list = await this.findUnlinkedTransacoesUseCase.execute(organizationId);
    return list.map(TransacaoMapper.toResponseDto);
  }

  async linkAccount(organizationId: string, transacaoId: string, contaCorrenteId: string): Promise<any> {
    const entity = await this.linkAccountUseCase.execute(organizationId, transacaoId, contaCorrenteId);
    return TransacaoMapper.toResponseDto(entity);
  }

  async createMany(data: BulkCreateTransacaoDto, organizationId: string): Promise<{ count: number }> {
    return this.bulkCreateTransacoesUseCase.execute(data, organizationId);
  }

  async bulkUpdate(dto: GenericBulkUpdateTransacaoDto, organizationId: string): Promise<{ count: number }> {
    return this.bulkUpdateTransacoesUseCase.execute(dto, organizationId);
  }

  async bulkUpdateContaContabil(
    transactionIds: string[],
    contaContabilId: string,
    organizationId: string,
  ): Promise<{ count: number }> {
    return this.bulkUpdateTransacoesUseCase.executeContaContabil(
      transactionIds,
      contaContabilId,
      organizationId,
    );
  }
}
