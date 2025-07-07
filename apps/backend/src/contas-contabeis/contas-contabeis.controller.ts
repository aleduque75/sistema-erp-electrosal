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
} from '@nestjs/common';
import { ContasContabeisService } from './contas-contabeis.service';
import {
  CreateContaContabilDto,
  UpdateContaContabilDto,
} from './dtos/contas-contabeis.dto';
import { AuthGuard } from '@nestjs/passport';

@UseGuards(AuthGuard('jwt'))
@Controller('contas-contabeis')
export class ContasContabeisController {
  constructor(
    private readonly contasContabeisService: ContasContabeisService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Request() req, @Body() createDto: CreateContaContabilDto) {
    return this.contasContabeisService.create(req.user.id, createDto);
  }

  @Get()
  findAll(@Request() req) {
    return this.contasContabeisService.findAll(req.user.id);
  }

  @Get(':id')
  findOne(@Request() req, @Param('id') id: string) {
    return this.contasContabeisService.findOne(req.user.id, id);
  }

  @Patch(':id')
  update(
    @Request() req,
    @Param('id') id: string,
    @Body() updateDto: UpdateContaContabilDto,
  ) {
    return this.contasContabeisService.update(req.user.id, id, updateDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Request() req, @Param('id') id: string) {
    return this.contasContabeisService.remove(req.user.id, id);
  }
}
