/// <reference types="../types/express" />
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
  Query,
  Res,
} from '@nestjs/common';
import { TipoMetal } from '@prisma/client';
import { CreatePureMetalLotDto } from './dtos/create-pure-metal-lot.dto';
import { UpdatePureMetalLotDto } from './dtos/update-pure-metal-lot.dto';
import { SellPureMetalLotDto } from './dtos/sell-pure-metal-lot.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Request, Response } from 'express';
import { CreatePureMetalLotUseCase } from './use-cases/create-pure-metal-lot.use-case';
import { ListPureMetalLotsUseCase } from './use-cases/list-pure-metal-lots.use-case';
import { GetPureMetalLotByIdUseCase } from './use-cases/get-pure-metal-lot-by-id.use-case';
import { UpdatePureMetalLotUseCase } from './use-cases/update-pure-metal-lot.use-case';
import { DeletePureMetalLotUseCase } from './use-cases/delete-pure-metal-lot.use-case';
import { SellPureMetalLotUseCase } from './use-cases/sell-pure-metal-lot.use-case';
import { GerarPdfPureMetalLotUseCase } from './use-cases/gerar-pdf-pure-metal-lot.use-case';

@UseGuards(JwtAuthGuard)
@Controller('pure-metal-lots')
export class PureMetalLotsController {
  constructor(
    private readonly createPureMetalLotUseCase: CreatePureMetalLotUseCase,
    private readonly listPureMetalLotsUseCase: ListPureMetalLotsUseCase,
    private readonly getPureMetalLotByIdUseCase: GetPureMetalLotByIdUseCase,
    private readonly updatePureMetalLotUseCase: UpdatePureMetalLotUseCase,
    private readonly deletePureMetalLotUseCase: DeletePureMetalLotUseCase,
    private readonly sellPureMetalLotUseCase: SellPureMetalLotUseCase,
    private readonly gerarPdfPureMetalLotUseCase: GerarPdfPureMetalLotUseCase,
  ) {}

  @Post()
  create(@Req() req: Request, @Body() createPureMetalLotDto: CreatePureMetalLotDto) {
    const organizationId = req.user['organizationId'];
    return this.createPureMetalLotUseCase.execute(organizationId, createPureMetalLotDto);
  }

  @Get()
  findAll(
    @Req() req: Request,
    @Query('metalType') metalType?: TipoMetal,
    @Query('remainingGramsGt') remainingGramsGt?: string,
  ) {
    const organizationId = req.user['organizationId'];
    const remainingGramsGtFloat = remainingGramsGt ? parseFloat(remainingGramsGt) : undefined;
    return this.listPureMetalLotsUseCase.execute(organizationId, metalType, remainingGramsGtFloat);
  }

  @Get(':id')
  findOne(@Req() req: Request, @Param('id') id: string) {
    const organizationId = req.user['organizationId'];
    return this.getPureMetalLotByIdUseCase.execute(organizationId, id);
  }

  @Get(':id/pdf')
  async generatePdf(@Req() req: Request, @Param('id') id: string, @Res() res: Response) {
    const organizationId = req.user['organizationId'];
    const pdfBuffer = await this.gerarPdfPureMetalLotUseCase.execute({ lotId: id, organizationId });

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=lote_${id}.pdf`,
      'Content-Length': pdfBuffer.length,
    });

    res.end(pdfBuffer);
  }

  @Patch(':id')
  update(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() updatePureMetalLotDto: UpdatePureMetalLotDto,
  ) {
    const organizationId = req.user['organizationId'];
    return this.updatePureMetalLotUseCase.execute(organizationId, id, updatePureMetalLotDto);
  }

  @Post(':id/sell')
  sell(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() sellDto: SellPureMetalLotDto,
  ) {
    const organizationId = req.user['organizationId'];
    const userId = req.user['id'];
    return this.sellPureMetalLotUseCase.execute(organizationId, userId, id, sellDto);
  }

  @Delete(':id')
  remove(@Req() req: Request, @Param('id') id: string) {
    const organizationId = req.user['organizationId'];
    return this.deletePureMetalLotUseCase.execute(organizationId, id);
  }
}