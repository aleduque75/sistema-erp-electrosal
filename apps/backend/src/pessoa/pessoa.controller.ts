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
import {
  CreatePessoaDto,
  UpdatePessoaDto,
} from './dtos/create-pessoa.dto';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreatePessoaUseCase } from './use-cases/create-pessoa.use-case';
import { UpdatePessoaUseCase } from './use-cases/update-pessoa.use-case';
import { ListPessoasUseCase } from './use-cases/list-pessoas.use-case';
import { GetPessoaUseCase } from './use-cases/get-pessoa.use-case';
import { DeletePessoaUseCase } from './use-cases/delete-pessoa.use-case';

@UseGuards(AuthGuard('jwt'))
@Controller('pessoas')
export class PessoaController {
  constructor(
    private readonly createPessoaUseCase: CreatePessoaUseCase,
    private readonly updatePessoaUseCase: UpdatePessoaUseCase,
    private readonly listPessoasUseCase: ListPessoasUseCase,
    private readonly getPessoaUseCase: GetPessoaUseCase,
    private readonly deletePessoaUseCase: DeletePessoaUseCase,
  ) {}

  @Post()
  create(
    @CurrentUser('organizationId') organizationId: string,
    @Body() createPessoaDto: CreatePessoaDto,
  ) {
    return this.createPessoaUseCase.execute(organizationId, createPessoaDto);
  }

  @Get()
  findAll(
    @CurrentUser('organizationId') organizationId: string,
    @Query('role') role?: 'CLIENT' | 'FORNECEDOR' | 'FUNCIONARIO',
  ) {
    return this.listPessoasUseCase.execute(organizationId, role);
  }

  @Get(':id')
  findOne(
    @CurrentUser('organizationId') organizationId: string,
    @Param('id') id: string,
  ) {
    return this.getPessoaUseCase.execute(organizationId, id);
  }

  @Patch(':id')
  update(
    @CurrentUser('organizationId') organizationId: string,
    @Param('id') id: string,
    @Body() updatePessoaDto: UpdatePessoaDto,
  ) {
    return this.updatePessoaUseCase.execute(organizationId, id, updatePessoaDto);
  }

  @Delete(':id')
  remove(
    @CurrentUser('organizationId') organizationId: string,
    @Param('id') id: string,
  ) {
    return this.deletePessoaUseCase.execute(organizationId, id);
  }
}
