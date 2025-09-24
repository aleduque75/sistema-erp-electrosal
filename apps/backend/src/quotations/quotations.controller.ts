import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { QuotationsService } from './quotations.service';
import { CreateQuotationDto } from './dto/create-quotation.dto';
import { UpdateQuotationDto } from './dto/update-quotation.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

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
  findAll(@CurrentUser('orgId') organizationId: string) {
    return this.quotationsService.findAll(organizationId);
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