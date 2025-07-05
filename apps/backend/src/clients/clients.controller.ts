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
} from '@nestjs/common';
import { ClientsService } from './clients.service';
import { CreateClientDto, UpdateClientDto } from './dtos/client.dto';
import { AuthGuard } from '@nestjs/passport';
import { AuthRequest } from '../auth/types/auth-request.type';

@UseGuards(AuthGuard('jwt'))
@Controller('clients')
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Post()
  create(
    @Request() req: AuthRequest,
    @Body() createClientDto: CreateClientDto,
  ) {
    return this.clientsService.create(req.user.id, createClientDto);
  }

  @Get()
  findAll(@Request() req: AuthRequest) {
    return this.clientsService.findAll(req.user.id);
  }

  @Get(':id')
  findOne(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.clientsService.findOne(req.user.id, id);
  }

  @Patch(':id')
  update(
    @Request() req: AuthRequest,
    @Param('id') id: string,
    @Body() updateClientDto: UpdateClientDto,
  ) {
    return this.clientsService.update(req.user.id, id, updateClientDto);
  }

  @Delete(':id')
  remove(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.clientsService.remove(req.user.id, id);
  }
}
