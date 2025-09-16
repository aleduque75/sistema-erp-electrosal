import { Controller, Post, Body, UseGuards, Req, Get, Param, ParseUUIDPipe, Patch } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateContaMetalUseCase } from './use-cases/create-conta-metal.use-case';
import { CreateContaMetalDto } from './dtos/create-conta-metal.dto';
import { ContaMetalResponseDto } from './dtos/conta-metal.response.dto';
import { FindContaMetalByIdUseCase } from './use-cases/find-conta-metal-by-id.use-case';
import { UpdateContaMetalBalanceUseCase } from './use-cases/update-conta-metal-balance.use-case';

@UseGuards(JwtAuthGuard)
@Controller('contas-metais')
export class ContasMetaisController {
  constructor(
    private readonly createContaMetalUseCase: CreateContaMetalUseCase,
    private readonly findContaMetalByIdUseCase: FindContaMetalByIdUseCase,
    private readonly updateContaMetalBalanceUseCase: UpdateContaMetalBalanceUseCase,
  ) {}

  @Post()
  async createContaMetal(@Body() dto: CreateContaMetalDto, @Req() req): Promise<ContaMetalResponseDto> {
    const organizationId = req.user?.orgId;
    const command = { organizationId, dto };
    const contaMetal = await this.createContaMetalUseCase.execute(command);
    return ContaMetalResponseDto.fromDomain(contaMetal);
  }

  @Get(':id')
  async getContaMetalById(@Param('id', new ParseUUIDPipe()) id: string, @Req() req): Promise<ContaMetalResponseDto> {
    const organizationId = req.user?.orgId;
    const command = { id, organizationId };
    const contaMetal = await this.findContaMetalByIdUseCase.execute(command);
    return ContaMetalResponseDto.fromDomain(contaMetal);
  }

  @Patch(':id/credit')
  async creditContaMetal(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body('amount') amount: number,
    @Req() req,
  ): Promise<void> {
    const organizationId = req.user?.orgId;
    const command = { id, organizationId, amount, type: 'credit' as const };
    await this.updateContaMetalBalanceUseCase.execute(command);
  }

  @Patch(':id/debit')
  async debitContaMetal(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body('amount') amount: number,
    @Req() req,
  ): Promise<void> {
    const organizationId = req.user?.orgId;
    const command = { id, organizationId, amount, type: 'debit' as const };
    await this.updateContaMetalBalanceUseCase.execute(command);
  }
}
