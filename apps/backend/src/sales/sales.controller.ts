// Em: apps/backend/src/sales/sales.controller.ts

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
import { SalesService } from './sales.service';
import { CreateSaleDto, UpdateSaleDto } from './dtos/sales.dto';
import { CreateSaleUseCase } from './use-cases/create-sale.use-case';
import { AuthGuard } from '@nestjs/passport';
import { ClientsService } from '../clients/clients.service';
import { ProductsService } from '../products/products.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@UseGuards(AuthGuard('jwt'))
@Controller('sales')
export class SalesController {
  constructor(
    private readonly salesService: SalesService,
    private readonly createSaleUseCase: CreateSaleUseCase,
    private readonly clientsService: ClientsService,
    private readonly productsService: ProductsService,
  ) {}

  @Post()
  create(
    @CurrentUser('id') userId: string,
    @Body() createSaleDto: CreateSaleDto,
  ) {
    return this.createSaleUseCase.execute(userId, createSaleDto);
  }

  @Get()
  findAll(@CurrentUser('id') userId: string) {
    // <-- CORRIGIDO
    return this.salesService.findAll(userId);
  }

  @Get('new')
  async getNewSaleData(@CurrentUser('id') userId: string) {
    // <-- CORRIGIDO
    const [clients, products] = await Promise.all([
      this.clientsService.findAll(userId),
      this.productsService.findAll(userId),
    ]);
    return { clients, products };
  }

  @Get(':id')
  findOne(@CurrentUser('id') userId: string, @Param('id') id: string) {
    // <-- CORRIGIDO
    return this.salesService.findOne(userId, id);
  }

  @Patch(':id')
  update(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() updateSaleDto: UpdateSaleDto,
  ) {
    return this.salesService.update(userId, id, updateSaleDto);
  }

  @Delete(':id')
  remove(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.salesService.remove(userId, id);
  }
}
