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
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ContasCorrentesService } from './contas-correntes.service';
import { CreateContaCorrenteDto } from './dtos/create-conta-corrente.dto';
import { UpdateContaCorrenteDto } from './dtos/update-conta-corrente.dto';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ContaCorrenteType } from '@prisma/client'; // Adicionado

@UseGuards(AuthGuard('jwt'))
@Controller('contas-correntes')
export class ContasCorrentesController {
  constructor(private readonly service: ContasCorrentesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @CurrentUser('orgId') organizationId: string,
    @Body() createDto: CreateContaCorrenteDto,
  ) {
    return this.service.create(organizationId, createDto);
  }

  @Get()
  findAll(
    @CurrentUser('orgId') organizationId: string,
    @Query('types') types?: ContaCorrenteType[],
  ) {
    return this.service.findAll(organizationId, types);
  }

  @Get(':id/extrato')
  getExtrato(
    @CurrentUser('orgId') organizationId: string,
    @Param('id') id: string,
    @Query('startDate') startDateString?: string,
    @Query('endDate') endDateString?: string,
  ) {
    let startDate: Date;
    let endDate: Date;

    if (startDateString) {
      startDate = new Date(startDateString);
    } else {
      const now = new Date();
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    if (endDateString) {
      endDate = new Date(endDateString);
    } else {
      endDate = new Date();
    }
    
    endDate.setHours(23, 59, 59, 999); // Ajusta para o final do dia

    // Validação para evitar 'Invalid Date'
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      const now = new Date();
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date();
      endDate.setHours(23, 59, 59, 999);
    }

    return this.service.getExtrato(organizationId, id, startDate, endDate);
  }

  @Get(':id')
  findOne(
    @CurrentUser('orgId') organizationId: string,
    @Param('id') id: string,
  ) {
    return this.service.findOne(organizationId, id);
  }

  @Patch(':id')
  update(
    @CurrentUser('orgId') organizationId: string,
    @Param('id') id: string,
    @Body() updateDto: UpdateContaCorrenteDto,
  ) {
    return this.service.update(organizationId, id, updateDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @CurrentUser('orgId') organizationId: string,
    @Param('id') id: string,
  ) {
    return this.service.remove(organizationId, id);
  }
}
