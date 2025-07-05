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
import { AuthRequest } from '../auth/types/auth-request.type';
import { ContasContabeisService } from './contas-contabeis.service';
import {
  CreateContaContabilDto,
  UpdateContaContabilDto,
} from './dtos/contas-contabeis.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
@UseGuards(JwtAuthGuard)
@Controller('contas-contabeis')
export class ContasContabeisController {
  constructor(
    private readonly contasContabeisService: ContasContabeisService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Req() req: AuthRequest,
    @Body() createContaContabilDto: CreateContaContabilDto,
  ) {
    return this.contasContabeisService.create(
      req.user.id,
      createContaContabilDto,
    );
  }

  @Get()
  findAll(@Req() req: AuthRequest) {
    return this.contasContabeisService.findAll(req.user.id);
  }

  @Get(':id')
  findOne(@Req() req: AuthRequest, @Param('id') id: string) {
    return this.contasContabeisService.findOne(req.user.id, id);
  }

  @Patch(':id')
  update(
    @Req() req: AuthRequest,
    @Param('id') id: string,
    @Body() updateContaContabilDto: UpdateContaContabilDto,
  ) {
    return this.contasContabeisService.update(
      req.user.id,
      id,
      updateContaContabilDto,
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Req() req: AuthRequest, @Param('id') id: string) {
    return this.contasContabeisService.remove(req.user.id, id);
  }
}
