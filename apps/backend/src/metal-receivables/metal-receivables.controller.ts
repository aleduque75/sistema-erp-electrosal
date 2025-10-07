import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { MetalReceivablesService } from './metal-receivables.service';

@UseGuards(AuthGuard('jwt'))
@Controller('metal-receivables')
export class MetalReceivablesController {
  constructor(private readonly receivablesService: MetalReceivablesService) {}

  @Get()
  findAll(
    @CurrentUser('organizationId') organizationId: string,
    @Query('pessoaId') pessoaId?: string,
    @Query('status') status?: string,
  ) {
    return this.receivablesService.findAll(organizationId, pessoaId, status);
  }
}