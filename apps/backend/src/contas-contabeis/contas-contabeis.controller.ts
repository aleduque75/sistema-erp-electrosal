import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { ContasContabeisService } from './contas-contabeis.service';
import {
  CreateContaContabilDto,
  UpdateContaContabilDto,
} from './dtos/contas-contabeis.dto';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@UseGuards(AuthGuard('jwt'))
@Controller('contas-contabeis')
export class ContasContabeisController {
  constructor(
    private readonly contasContabeisService: ContasContabeisService,
  ) {}

  @Post()
  create(
    @CurrentUser('orgId') organizationId: string,
    @Body() createDto: CreateContaContabilDto,
  ) {
    return this.contasContabeisService.create(organizationId, createDto);
  }

  @Get()
  findAll(
    @CurrentUser('orgId') organizationId: string,
    @Query('tipo') tipo?: 'RECEITA' | 'DESPESA',
  ) {
    return this.contasContabeisService.findAll(organizationId, tipo);
  }

  @Get('proximo-codigo')
  getNextCodigo(
    @CurrentUser('orgId') organizationId: string,
    @Query('contaPaiId') contaPaiId?: string,
  ) {
    return this.contasContabeisService.getNextCodigo(
      organizationId,
      contaPaiId,
    );
  }

  @Get(':id')
  findOne(
    @CurrentUser('orgId') organizationId: string,
    @Param('id') id: string,
  ) {
    return this.contasContabeisService.findOne(organizationId, id);
  }

  @Patch(':id')
  update(
    @CurrentUser('orgId') organizationId: string,
    @Param('id') id: string,
    @Body() updateDto: UpdateContaContabilDto,
  ) {
    return this.contasContabeisService.update(organizationId, id, updateDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @CurrentUser('orgId') organizationId: string,
    @Param('id') id: string,
  ) {
    return this.contasContabeisService.remove(organizationId, id);
  }
}
