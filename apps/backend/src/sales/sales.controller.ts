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
  Query,
} from '@nestjs/common';
import { SalesService } from './sales.service';
import { CreateSaleDto, UpdateSaleDto } from './dtos/sales.dto';
import { AuthGuard } from '@nestjs/passport';

@UseGuards(AuthGuard('jwt'))
@Controller('sales')
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Post()
  create(@Request() req, @Body() createSaleDto: CreateSaleDto) {
    return this.salesService.create(req.user.id, createSaleDto);
  }

  @Get()
  findAll(@Request() req, @Query('search') search?: string) {
    return this.salesService.findAll(req.user.id, search);
  }

  @Get(':id')
  findOne(@Request() req, @Param('id') id: string) {
    return this.salesService.findOne(req.user.id, id);
  }

  @Patch(':id')
  update(
    @Request() req,
    @Param('id') id: string,
    @Body() updateSaleDto: UpdateSaleDto,
  ) {
    return this.salesService.update(req.user.id, id, updateSaleDto);
  }

  @Delete(':id')
  remove(@Request() req, @Param('id') id: string) {
    return this.salesService.remove(req.user.id, id);
  }
}
