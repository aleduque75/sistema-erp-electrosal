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
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { ContasCorrentesService } from './contas-correntes.service';
import { CreateContaCorrenteDto } from './dtos/create-conta-corrente.dto';
import { UpdateContaCorrenteDto } from './dtos/update-conta-corrente.dto';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ContaCorrenteType } from '@prisma/client'; // Adicionado
import { GenerateExtratoPdfUseCase } from './use-cases/generate-extrato-pdf.use-case';

import { GenerateSelectedExtratoPdfUseCase } from './use-cases/generate-selected-extrato-pdf.use-case';

@UseGuards(AuthGuard('jwt'))
@Controller('contas-correntes')
export class ContasCorrentesController {
  constructor(
    private readonly service: ContasCorrentesService,
    private readonly generateExtratoPdfUseCase: GenerateExtratoPdfUseCase,
    private readonly generateSelectedExtratoPdfUseCase: GenerateSelectedExtratoPdfUseCase,
  ) {}

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
    @Query('activeOnly') activeOnly?: string,
  ) {
    return this.service.findAll(organizationId, types, activeOnly === 'true');
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

  @Get(':id/extrato/pdf')
  async getExtratoPdf(
    @CurrentUser('orgId') organizationId: string,
    @Param('id') id: string,
    @Res() res: Response,
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
    
    endDate.setHours(23, 59, 59, 999);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      const now = new Date();
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date();
      endDate.setHours(23, 59, 59, 999);
    }

    const pdfBuffer = await this.generateExtratoPdfUseCase.execute({
        contaCorrenteId: id,
        organizationId,
        startDate,
        endDate
    });

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="extrato-${id}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });

    res.end(pdfBuffer);
  }

  @Post('extrato/pdf/selected')
  async getSelectedExtratoPdf(
    @CurrentUser('orgId') organizationId: string,
    @Res() res: Response,
    @Body('transactionIds') transactionIds: string[],
  ) {
    const pdfBuffer = await this.generateSelectedExtratoPdfUseCase.execute({
      transactionIds,
      organizationId,
    });

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="extrato-selecionado.pdf"`,
      'Content-Length': pdfBuffer.length,
    });

    res.end(pdfBuffer);
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

  @Post(':id/adjust-residue')
  adjustResidue(
    @CurrentUser('orgId') organizationId: string,
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body('transactionIds') transactionIds?: string[],
  ) {
    return this.service.adjustGoldResidue(organizationId, id, userId, transactionIds);
  }
}
