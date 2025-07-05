import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
  Query,
  Delete,
  Patch,
} from '@nestjs/common';
import { SalesService } from './sales.service';
import { CreateSaleDto, UpdateSaleDto } from './dtos/sales.dto'; // <-- Confirme esta importação
import { AuthGuard } from '@nestjs/passport';
import { AuthRequest } from '../auth/types/auth-request.type';

@UseGuards(AuthGuard('jwt'))
@Controller('sales')
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Post()
  create(@Request() req: AuthRequest, @Body() createSaleDto: CreateSaleDto) {
    return this.salesService.create(req.user.id, createSaleDto);
  }

  @Get() // Rota: GET /sales
  findAll(
    @Request() req: AuthRequest,
    @Query('search') search?: string, // Adicionado parâmetro de busca
  ) {
    return this.salesService.findAll(req.user.id, search); // Passa o userId e o search para o serviço
  }

  @Get(':id')
  findOne(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.salesService.findOne(req.user.id, id);
  }
  @Patch(':id')
  update(
    @Request() req: AuthRequest,
    @Param('id') id: string,
    @Body() updateSaleDto: UpdateSaleDto, // Usando o UpdateSaleDto
  ) {
    return this.salesService.update(req.user.id, id, updateSaleDto);
  }

  @Delete(':id')
  remove(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.salesService.remove(req.user.id, id);
  }
}
