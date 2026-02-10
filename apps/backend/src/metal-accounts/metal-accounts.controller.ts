import { Controller, Post, Body, UseGuards, Req, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateMetalAccountUseCase } from './use-cases/create-metal-account.use-case';
import { FindMetalAccountByIdUseCase } from './use-cases/find-metal-account-by-id.use-case';
import { FindAllMetalAccountsUseCase } from './use-cases/find-all-metal-accounts.use-case';
import { CreateMetalAccountDto } from './dtos/create-metal-account.dto';
import { MetalAccountResponseDto } from './dtos/metal-account.response.dto';
import { CreateMetalAccountEntryUseCase } from './use-cases/create-metal-account-entry.use-case';
import { CreateMetalAccountEntryDto } from './dtos/create-metal-account-entry.dto';
import { FindAllMetalAccountEntriesUseCase } from './use-cases/find-all-metal-account-entries.use-case';
import { TransferFromSupplierAccountToPureMetalLotsUseCase } from './use-cases/transfer-from-supplier-account-to-pure-metal-lots.use-case'; // Adicionado
import { TransferFromSupplierAccountDto } from './dtos/transfer-from-supplier-account.dto'; // Adicionado

@UseGuards(JwtAuthGuard)
@Controller('metal-accounts')
export class MetalAccountsController {
  constructor(
    private readonly createMetalAccountUseCase: CreateMetalAccountUseCase,
    private readonly findMetalAccountByIdUseCase: FindMetalAccountByIdUseCase,
    private readonly findAllMetalAccountsUseCase: FindAllMetalAccountsUseCase,
    private readonly createMetalAccountEntryUseCase: CreateMetalAccountEntryUseCase,
    private readonly findAllMetalAccountEntriesUseCase: FindAllMetalAccountEntriesUseCase,
    private readonly transferFromSupplierAccountToPureMetalLotsUseCase: TransferFromSupplierAccountToPureMetalLotsUseCase, // Adicionado
  ) {}

  @Post()
  async createMetalAccount(@Body() dto: CreateMetalAccountDto, @Req() req): Promise<MetalAccountResponseDto> {
    const organizationId = req.user?.orgId;
    const command = { organizationId, dto };
    const metalAccount = await this.createMetalAccountUseCase.execute(command);
    return MetalAccountResponseDto.fromDomain(metalAccount);
  }

  @Get()
  async findAllMetalAccounts(@Req() req): Promise<MetalAccountResponseDto[]> {
    const organizationId = req.user?.orgId;
    const metalAccounts = await this.findAllMetalAccountsUseCase.execute(organizationId);
    return metalAccounts.map(MetalAccountResponseDto.fromDomain);
  }

  @Get(':id')
  async getMetalAccountById(@Param('id', new ParseUUIDPipe()) id: string, @Req() req): Promise<MetalAccountResponseDto> {
    const organizationId = req.user?.orgId;
    const metalAccount = await this.findMetalAccountByIdUseCase.execute(id, organizationId);
    return MetalAccountResponseDto.fromDomain(metalAccount);
  }

  @Post('entries')
  async createEntry(@Body() dto: CreateMetalAccountEntryDto, @Req() req): Promise<void> {
    const organizationId = req.user?.orgId;
    const command = { organizationId, dto };
    await this.createMetalAccountEntryUseCase.execute(command);
  }

  @Get(':id/entries')
  async getEntries(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.findAllMetalAccountEntriesUseCase.execute(id);
  }

  @Post('transfer-from-supplier-account-to-pure-metal-lots') // Adicionado
  async transferFromSupplierAccountToPureMetalLots(
    @Body() dto: TransferFromSupplierAccountDto,
    @Req() req,
  ) {
    const organizationId = req.user?.orgId;
    const command = { organizationId, dto };
    return this.transferFromSupplierAccountToPureMetalLotsUseCase.execute(command);
  }
}
