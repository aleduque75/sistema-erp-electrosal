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
import { ContasCorrentesService } from './contas-correntes.service';
import {
  CreateContaCorrenteDto,
  UpdateContaCorrenteDto,
} from './dtos/contas-correntes.dto';
import { AuthGuard } from '@nestjs/passport';

@UseGuards(AuthGuard('jwt'))
@Controller('contas-correntes')
export class ContasCorrentesController {
  constructor(private readonly service: ContasCorrentesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Request() req, @Body() createDto: CreateContaCorrenteDto) {
    return this.service.create(req.user.id, createDto);
  }

  @Get()
  findAll(@Request() req) {
    return this.service.findAll(req.user.id);
  }

  @Get(':id/extrato')
  getExtrato(
    @Request() req,
    @Param('id') id: string,
    @Query('startDate') startDateString: string,
    @Query('endDate') endDateString: string,
  ) {
    const startDate = startDateString ? new Date(startDateString) : new Date(0);
    const endDate = endDateString ? new Date(endDateString) : new Date();
    return this.service.getExtrato(req.user.id, id, startDate, endDate);
  }

  // ✅ ROTA ADICIONADA PARA BUSCAR UMA ÚNICA CONTA
  @Get(':id')
  findOne(@Request() req, @Param('id') id: string) {
    return this.service.findOne(req.user.id, id);
  }

  @Patch(':id')
  update(
    @Request() req,
    @Param('id') id: string,
    @Body() updateDto: UpdateContaCorrenteDto,
  ) {
    return this.service.update(req.user.id, id, updateDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Request() req, @Param('id') id: string) {
    return this.service.remove(req.user.id, id);
  }
}
