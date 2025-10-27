import { Controller, Post, Body, UseGuards, Req, Get, Patch, Param } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateChemicalReactionUseCase } from './use-cases/create-chemical-reaction.use-case';
import { CompleteProductionStepUseCase } from './use-cases/complete-production-step.use-case';
import { AdjustPurityUseCase } from './use-cases/adjust-purity.use-case';
import { CreateChemicalReactionDto } from './dtos/create-chemical-reaction.dto';
import { PrismaService } from '../prisma/prisma.service';
import { CompleteReactionDto } from './dtos/complete-reaction.dto';
import { AddRawMaterialToChemicalReactionUseCase } from './use-cases/add-raw-material.use-case';
import { AddRawMaterialDto } from './dtos/add-raw-material.dto';

@UseGuards(JwtAuthGuard)
@Controller('chemical-reactions')
export class ChemicalReactionsController {
  constructor(
    private readonly createUseCase: CreateChemicalReactionUseCase,
    private readonly completeProductionStepUseCase: CompleteProductionStepUseCase,
    private readonly adjustPurityUseCase: AdjustPurityUseCase,
    private readonly addRawMaterialToChemicalReactionUseCase: AddRawMaterialToChemicalReactionUseCase,
    private readonly prisma: PrismaService,
  ) {}

  @Post()
  async create(@Body() dto: CreateChemicalReactionDto, @Req() req) {
    const organizationId = req.user?.orgId;
    const command = { organizationId, dto };
    return this.createUseCase.execute(command);
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
    return this.prisma.chemical_reactions.findMany({
      where: { organizationId },
      include: {
        productionBatch: true,
      },
      orderBy: { reactionDate: 'desc' },
    });
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req) {
    const organizationId = req.user?.orgId;
    return this.prisma.chemical_reactions.findUnique({
      where: { id, organizationId },
      include: {
        productionBatch: { include: { product: true } },
        outputProduct: true, // Adicionar esta linha
        lots: true,
        rawMaterialsUsed: { include: { rawMaterial: true } },
      },
    });
  }

  @Get('leftovers/available')
  async findAvailableLeftovers() {
    // TODO: Implementar a lógica real para rastrear e encontrar sobras disponíveis.
    // Por enquanto, retorna um array vazio para evitar erros 404 no frontend.
    return [];
  }
}