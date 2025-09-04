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
import { SalesService } from './sales.service';
import { CreateSaleDto, UpdateSaleDto } from './dtos/sales.dto';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@UseGuards(AuthGuard('jwt'))
@Controller('sales')
export class SalesController {
  constructor(
    private readonly salesService: SalesService,
  ) {}

  @Post()
  create(
    @CurrentUser('orgId') organizationId: string,
    @CurrentUser('sub') userId: string, // Added userId
    @Body() createSaleDto: CreateSaleDto,
  ) {
    return this.salesService.create(organizationId, userId, createSaleDto); // Pass userId
  }

  @Get()
  findAll(
    @CurrentUser('orgId') organizationId: string,
    @Query('limit') limit?: string,
  ) {
    return this.salesService.findAll(organizationId, limit ? +limit : undefined);
  }

  @Get(':id')
  findOne(
    @CurrentUser('orgId') organizationId: string,
    @Param('id') id: string,
  ) {
    return this.salesService.findOne(organizationId, id);
  }

  @Patch(':id')
  update(
    @CurrentUser('orgId') organizationId: string,
    @Param('id') id: string,
    @Body() updateSaleDto: UpdateSaleDto,
  ) {
    return this.salesService.update(organizationId, id, updateSaleDto);
  }

  @Delete(':id')
  remove(
    @CurrentUser('orgId') organizationId: string,
    @Param('id') id: string,
  ) {
    return this.salesService.remove(organizationId, id);
  }
}
