import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ListMetalReceivablesUseCase } from './use-cases/list-metal-receivables.use-case';

@UseGuards(AuthGuard('jwt'))
@Controller('metal-receivables')
export class MetalReceivablesController {
  constructor(private readonly listMetalReceivablesUseCase: ListMetalReceivablesUseCase) {}

  @Get()
  findAll(
    @CurrentUser('organizationId') organizationId: string,
    @Query('pessoaId') pessoaId?: string,
    @Query('status') status?: string,
  ) {
    return this.listMetalReceivablesUseCase.execute(organizationId, pessoaId, status);
  }
}