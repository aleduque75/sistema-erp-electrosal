import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { QuotationsService } from './quotations.service';
import { CreateQuotationDto } from './dto/create-quotation.dto';
import { UpdateQuotationDto } from './dto/update-quotation.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { TipoMetal } from '@prisma/client';

@UseGuards(AuthGuard('jwt'))
@Controller('quotations')
export class QuotationsController {
  constructor(private readonly quotationsService: QuotationsService) {}

  @Post()
  create(
    @CurrentUser('orgId') organizationId: string,
    @Body() createQuotationDto: CreateQuotationDto,
  ) {
    return this.quotationsService.create(organizationId, createQuotationDto);
  }

  @Get()
  findAll(
    @CurrentUser('orgId') organizationId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('metalType') metalType?: string,
  ) {
    return this.quotationsService.findAll(organizationId, startDate, endDate, metalType);
  }

  @Get('by-date')
  findByDate(
    @CurrentUser('orgId') organizationId: string,
    @Query('date') date: string,
    @Query('metal') metal: TipoMetal,
  ) {
    return this.quotationsService.findByDate(new Date(date), metal, organizationId);
  }

  @Get('latest')
  findLatest(
    @CurrentUser('orgId') organizationId: string,
    @Query('metal') metal: TipoMetal,
    @Query('date') date?: string,
  ) {
    const searchDate = date ? new Date(date) : new Date();
    return this.quotationsService.findLatest(metal, organizationId, searchDate);
  }

  @Get(':id')
  findOne(
    @CurrentUser('orgId') organizationId: string,
    @Param('id') id: string
    ) {
    return this.quotationsService.findOne(id, organizationId);
  }

  @Patch(':id')
  update(
    @CurrentUser('orgId') organizationId: string,
    @Param('id') id: string, 
    @Body() updateQuotationDto: UpdateQuotationDto
    ) {
    return this.quotationsService.update(id, organizationId, updateQuotationDto);
  }

  @Delete(':id')
  remove(
    @CurrentUser('orgId') organizationId: string,
    @Param('id') id: string
    ) {
    return this.quotationsService.remove(id, organizationId);
  }
}