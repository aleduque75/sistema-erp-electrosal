import { Controller, Post, Body, UseGuards, Req, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateContaMetalUseCase } from './use-cases/create-conta-metal.use-case';
import { CreateContaMetalDto } from './dtos/create-conta-metal.dto';
import { ContaMetalResponseDto } from './dtos/conta-metal.response.dto';
import { FindContaMetalByIdUseCase } from './use-cases/find-conta-metal-by-id.use-case';
import { FindAllContasMetaisUseCase } from './use-cases/find-all-contas-metais.use-case';
import { CreateMetalAccountEntryUseCase } from './use-cases/create-metal-account-entry.use-case';
import { CreateMetalAccountEntryDto } from './dtos/create-metal-account-entry.dto';

@UseGuards(JwtAuthGuard)
@Controller('contas-metais')
export class ContasMetaisController {
  constructor(
    private readonly createContaMetalUseCase: CreateContaMetalUseCase,
    private readonly findContaMetalByIdUseCase: FindContaMetalByIdUseCase,
    private readonly findAllContasMetaisUseCase: FindAllContasMetaisUseCase,
    private readonly createMetalAccountEntryUseCase: CreateMetalAccountEntryUseCase,
  ) {}

  @Post()
  async createContaMetal(@Body() dto: CreateContaMetalDto, @Req() req): Promise<ContaMetalResponseDto> {
    const organizationId = req.user?.orgId;
    const command = { organizationId, dto };
    const contaMetal = await this.createContaMetalUseCase.execute(command);
    return ContaMetalResponseDto.fromDomain(contaMetal);
  }

  @Get()
  async findAllContasMetais(@Req() req): Promise<ContaMetalResponseDto[]> {
    const organizationId = req.user?.orgId;
    const command = { organizationId };
    const contasMetais = await this.findAllContasMetaisUseCase.execute(command);
    return contasMetais.map(ContaMetalResponseDto.fromDomain);
  }

  @Get(':id')
  async getContaMetalById(@Param('id', new ParseUUIDPipe()) id: string, @Req() req): Promise<ContaMetalResponseDto> {
    const organizationId = req.user?.orgId;
    const command = { id, organizationId };
    const contaMetal = await this.findContaMetalByIdUseCase.execute(command);
    return ContaMetalResponseDto.fromDomain(contaMetal);
  }

  @Post('entries')
  async createEntry(@Body() dto: CreateMetalAccountEntryDto, @Req() req): Promise<void> {
    const organizationId = req.user?.orgId;
    // O DTO já contém o contaMetalId, então não precisamos pegar o :id da URL
    const command = { organizationId, dto };
    await this.createMetalAccountEntryUseCase.execute(command);
  }
}