import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ClientsService } from './clients.service';
import {
  CreatePessoaDto as CreateClientDto,
  UpdatePessoaDto as UpdateClientDto,
  CreateBulkPessoasDto as CreateBulkClientsDto,
} from '../pessoa/dtos/create-pessoa.dto';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@UseGuards(AuthGuard('jwt'))
@Controller('clients')
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Post()
  create(
    @CurrentUser('organizationId') organizationId: string, // <-- Pega 'orgId' do token
    @Body() createClientDto: CreateClientDto,
  ) {
    return this.clientsService.create(organizationId, createClientDto);
  }

  @Get()
  findAll(@CurrentUser('organizationId') organizationId: string) {
    // <-- Pega 'orgId' do token
    return this.clientsService.findAll(organizationId);
  }

  @Get(':id')
  findOne(
    @CurrentUser('organizationId') organizationId: string,
    @Param('id') id: string,
  ) {
    // <-- Pega 'orgId' do token
    return this.clientsService.findOne(organizationId, id);
  }

  @Patch(':id')
  update(
    @CurrentUser('organizationId') organizationId: string, // <-- Pega 'orgId' do token
    @Param('id') id: string,
    @Body() updateClientDto: UpdateClientDto,
  ) {
    return this.clientsService.update(organizationId, id, updateClientDto);
  }

  @Delete(':id')
  remove(
    @CurrentUser('organizationId') organizationId: string,
    @Param('id') id: string,
  ) {
    // <-- Pega 'orgId' do token
    return this.clientsService.remove(organizationId, id);
  }

  @Post('bulk-create')
  createMany(
    @CurrentUser('organizationId') organizationId: string, // Pega o orgId do token
    @Body() createBulkDto: CreateBulkClientsDto,
  ) {
    // Passa o organizationId para o service
    return this.clientsService.createMany(
      organizationId,
      createBulkDto.pessoas,
    );
  }
}
