import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { TransacoesService } from './transacoes.service';
import { CreateTransacaoDto, UpdateTransacaoDto } from './dtos/transacoes.dto';
// Update the import path below to the correct one based on your project structure.
// Example using a common alias:
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
// import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { AuthRequest } from '../auth/types/auth-request.type';

@UseGuards(JwtAuthGuard)
@Controller('transacoes')
export class TransacoesController {
  constructor(private readonly transacoesService: TransacoesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Req() req: AuthRequest,
    @Body() createTransacaoDto: CreateTransacaoDto,
  ) {
    return this.transacoesService.create(req.user.id, createTransacaoDto);
  }

  @Get()
  findAll(@Req() req: AuthRequest) {
    return this.transacoesService.findAll(req.user.id);
  }

  @Get(':id')
  findOne(@Req() req: AuthRequest, @Param('id') id: string) {
    return this.transacoesService.findOne(req.user.id, id);
  }

  @Patch(':id')
  update(
    @Req() req: AuthRequest,
    @Param('id') id: string,
    @Body() updateTransacaoDto: UpdateTransacaoDto,
  ) {
    return this.transacoesService.update(req.user.id, id, updateTransacaoDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Req() req: AuthRequest, @Param('id') id: string) {
    return this.transacoesService.remove(req.user.id, id);
  }
}
