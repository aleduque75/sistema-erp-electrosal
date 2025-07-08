import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
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

@UseGuards(AuthGuard('jwt'))
@Controller('contas-contabeis')
export class ContasContabeisController {
  // ✅ CORREÇÃO: Altere 'service' para 'contasContabeisService' ou o nome que você usou no construtor
  constructor(
    private readonly contasContabeisService: ContasContabeisService,
  ) {}

  @Post()
  create(@Request() req, @Body() createDto: CreateContaContabilDto) {
    return this.contasContabeisService.create(req.user.id, createDto);
  }

  @Get()
  findAll(@Request() req, @Query('tipo') tipo?: 'RECEITA' | 'DESPESA') {
    return this.contasContabeisService.findAll(req.user.id, tipo);
  }

  @Get(':id')
  findOne(@Request() req, @Param('id') id: string) {
    return this.contasContabeisService.findOne(req.user.id, id);
  }

  @Get('proximo-codigo')
  getNextCodigo(@Request() req, @Query('contaPaiId') contaPaiId?: string) {
    // ✅ CORREÇÃO: Use this.contasContabeisService
    return this.contasContabeisService.getNextCodigo(req.user.id, contaPaiId);
  }

  @Patch(':id')
  update(
    @Request() req,
    @Param('id') id: string,
    @Body() updateDto: UpdateContaContabilDto,
  ) {
    return this.contasContabeisService.update(req.user.id, id, updateDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Request() req, @Param('id') id: string) {
    return this.contasContabeisService.remove(req.user.id, id);
  }
}
