import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { PessoaService } from './pessoa.service';
import {
  CreatePessoaDto,
  UpdatePessoaDto,
} from '../pessoa/dtos/create-pessoa.dto';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@UseGuards(AuthGuard('jwt')) // Reabilitado
@Controller('pessoas')
export class PessoaController {
  constructor(private readonly pessoaService: PessoaService) {}

  @Post()
  create(
    @CurrentUser('organizationId') organizationId: string,
    @Body() createPessoaDto: CreatePessoaDto,
  ) {
    // ESTE MÉTODO PRECISA DE REATORAÇÃO NO SERVICE
    return this.pessoaService.create(organizationId, createPessoaDto);
  }

  @Get()
  findAll(
    @CurrentUser('organizationId') organizationId: string,
    @Query('role') role?: 'CLIENT' | 'FORNECEDOR' | 'FUNCIONARIO',
  ) {
    return this.pessoaService.findAll(organizationId, role);
  }

  @Get(':id')
  findOne(
    @CurrentUser('organizationId') organizationId: string,
    @Param('id') id: string,
  ) {
    // ESTE MÉTODO PRECISA DE REATORAÇÃO NO SERVICE
    return this.pessoaService.findOne(organizationId, id);
  }

  @Patch(':id')
  update(
    @CurrentUser('organizationId') organizationId: string,
    @Param('id') id: string,
    @Body() updatePessoaDto: UpdatePessoaDto,
  ) {
    // ESTE MÉTODO PRECISA DE REATORAÇÃO NO SERVICE
    return this.pessoaService.update(organizationId, id, updatePessoaDto);
  }

  @Delete(':id')
  remove(
    @CurrentUser('organizationId') organizationId: string,
    @Param('id') id: string,
  ) {
    // ESTE MÉTODO PRECISA DE REATORAÇÃO NO SERVICE
    return this.pessoaService.remove(organizationId, id);
  }
}
