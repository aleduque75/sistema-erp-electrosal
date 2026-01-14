import { Controller, Post, Body, UseGuards, Req, Get, Patch, Param, Delete, Put, Res } from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateChemicalReactionUseCase } from './use-cases/create-chemical-reaction.use-case';
import { CompleteProductionStepUseCase } from './use-cases/complete-production-step.use-case';
import { AdjustPurityUseCase } from './use-cases/adjust-purity.use-case';
import { CreateChemicalReactionDto } from './dtos/create-chemical-reaction.dto';
import { PrismaService } from '../prisma/prisma.service';
import { CompleteReactionDto } from './dtos/complete-reaction.dto';
import { AddRawMaterialToChemicalReactionUseCase } from './use-cases/add-raw-material.use-case';
import { AddRawMaterialDto } from './dtos/add-raw-material.dto';
import { AssociateImageToChemicalReactionUseCase } from './use-cases/associate-image-to-chemical-reaction.use-case';
import { AddPureMetalLotToChemicalReactionUseCase } from './use-cases/add-pure-metal-lot-to-chemical-reaction.use-case';
import { RemovePureMetalLotFromChemicalReactionUseCase } from './use-cases/remove-pure-metal-lot-from-chemical-reaction.use-case';
import { UpdateChemicalReactionUseCase } from './use-cases/update-chemical-reaction.use-case';
import { UpdateChemicalReactionLotsUseCase } from './use-cases/update-chemical-reaction-lots.use-case';
import { GenerateChemicalReactionPdfUseCase } from './use-cases/generate-chemical-reaction-pdf.use-case';
import { UpdateChemicalReactionDto } from './dtos/update-chemical-reaction.dto';
import { UpdateChemicalReactionLotsDto } from './dtos/update-chemical-reaction-lots.dto';

@UseGuards(JwtAuthGuard)
@Controller('chemical-reactions')
export class ChemicalReactionsController {
  constructor(
    private readonly createUseCase: CreateChemicalReactionUseCase,
    private readonly completeProductionStepUseCase: CompleteProductionStepUseCase,
    private readonly adjustPurityUseCase: AdjustPurityUseCase,
    private readonly addRawMaterialToChemicalReactionUseCase: AddRawMaterialToChemicalReactionUseCase,
    private readonly associateImageToChemicalReactionUseCase: AssociateImageToChemicalReactionUseCase,
    private readonly addPureMetalLotToChemicalReactionUseCase: AddPureMetalLotToChemicalReactionUseCase,
    private readonly removePureMetalLotFromChemicalReactionUseCase: RemovePureMetalLotFromChemicalReactionUseCase,
    private readonly updateChemicalReactionUseCase: UpdateChemicalReactionUseCase,
    private readonly updateChemicalReactionLotsUseCase: UpdateChemicalReactionLotsUseCase,
    private readonly generateChemicalReactionPdfUseCase: GenerateChemicalReactionPdfUseCase,
    private readonly prisma: PrismaService,
  ) {}

  @Post()
  async create(@Body() dto: CreateChemicalReactionDto, @Req() req) {
    const organizationId = req.user?.orgId;
    const command = { organizationId, dto };
    return this.createUseCase.execute(command);
  }

  @Get(':id/pdf')
  async generatePdf(
    @Param('id') id: string,
    @Req() req,
    @Res() res: Response,
  ) {
    const organizationId = req.user?.orgId;
    const command = { reactionId: id, organizationId };
    
    const pdfBuffer = await this.generateChemicalReactionPdfUseCase.execute(command);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="reacao-quimica-${id}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });

    res.end(pdfBuffer);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateChemicalReactionDto,
    @Req() req,
  ) {
    const organizationId = req.user?.orgId;
    const command = { chemicalReactionId: id, organizationId, dto };
    return this.updateChemicalReactionUseCase.execute(command);
  }

  @Put(':id/lots')
  async updateLots(
    @Param('id') id: string,
    @Body() dto: UpdateChemicalReactionLotsDto,
    @Req() req,
  ) {
    const organizationId = req.user?.orgId;
    const command = { chemicalReactionId: id, organizationId, dto };
    return this.updateChemicalReactionLotsUseCase.execute(command);
  }

  @Post(':id/associate-image')
  async associateImage(
    @Param('id') id: string,
    @Body() body: { mediaId: string },
    @Req() req,
  ) {
    const organizationId = req.user?.orgId;
    const command = { chemicalReactionId: id, mediaId: body.mediaId, organizationId };
    return this.associateImageToChemicalReactionUseCase.execute(command);
  }

  @Post(':id/raw-materials')
  async addRawMaterial(
    @Param('id') id: string,
    @Body() dto: AddRawMaterialDto,
    @Req() req,
  ) {
    const organizationId = req.user?.orgId;
    await this.addRawMaterialToChemicalReactionUseCase.execute(organizationId, id, dto);
  }

  @Post(':id/pure-metal-lots')
  async addPureMetalLot(
    @Param('id') id: string,
    @Body() body: { pureMetalLotId: string },
    @Req() req,
  ) {
    const organizationId = req.user?.orgId;
    const command = { chemicalReactionId: id, pureMetalLotId: body.pureMetalLotId, organizationId };
    return this.addPureMetalLotToChemicalReactionUseCase.execute(command);
  }

  @Delete(':id/pure-metal-lots/:pureMetalLotId')
  async removePureMetalLot(
    @Param('id') id: string,
    @Param('pureMetalLotId') pureMetalLotId: string,
    @Req() req,
  ) {
    const organizationId = req.user?.orgId;
    const command = { chemicalReactionId: id, pureMetalLotId, organizationId };
    return this.removePureMetalLotFromChemicalReactionUseCase.execute(command);
  }

  @Patch(':id/complete-production')
  async completeProductionStep(@Param('id') id: string, @Req() req, @Body() dto: CompleteReactionDto) {
    const organizationId = req.user?.orgId;
    const command = { organizationId, reactionId: id, dto };
    return this.completeProductionStepUseCase.execute(command);
  }

  @Patch(':id/adjust-purity')
  async adjustPurity(@Param('id') id: string, @Req() req, @Body() dto: any) {
    const organizationId = req.user?.orgId;
    const command = { organizationId, reactionId: id, ...dto };
    return this.adjustPurityUseCase.execute(command);
  }

  @Get()
  async findAll(@Req() req) {
    const organizationId = req.user?.orgId;
    const reactions = await this.prisma.chemical_reactions.findMany({
      where: { organizationId },
      include: {
        productionBatch: true,
        lots: true,
      },
      orderBy: { reactionDate: 'desc' },
    });

    return reactions.map(reaction => ({
      ...reaction,
      auUsedGrams: reaction.inputGoldGrams,
    }));
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req) {
    const organizationId = req.user?.orgId;
    const reaction = await this.prisma.chemical_reactions.findUnique({
      where: { id, organizationId },
      include: {
        productionBatch: { include: { product: true } },
        outputProduct: true,
        medias: true, // Incluir mídias
        lots: {
          include: {
            pureMetalLot: true,
          },
        },
        rawMaterialsUsed: { include: { rawMaterial: true } },
      },
    });

    if (!reaction) {
      return null;
    }

    return {
      ...reaction,
      lots: reaction.lots.map(lot => ({
        ...lot.pureMetalLot,
        gramsToUse: lot.gramsToUse,
      })),
    };
  }

  @Get('leftovers/available')
  async findAvailableLeftovers() {
    // TODO: Implementar a lógica real para rastrear e encontrar sobras disponíveis.
    // Por enquanto, retorna um array vazio para evitar erros 404 no frontend.
    return [];
  }
}