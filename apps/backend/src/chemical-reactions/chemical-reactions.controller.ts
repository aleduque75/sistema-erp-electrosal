import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateChemicalReactionUseCase } from './use-cases/create-chemical-reaction.use-case';
import { CreateChemicalReactionDto } from './dtos/create-chemical-reaction.dto';

@UseGuards(JwtAuthGuard)
@Controller('chemical-reactions')
export class ChemicalReactionsController {
  constructor(private readonly createUseCase: CreateChemicalReactionUseCase) {}

  @Post()
  async create(@Body() dto: CreateChemicalReactionDto, @Req() req) {
    const organizationId = req.user?.orgId;
    const command = { organizationId, dto };
    // O retorno será simplificado por enquanto, pois o mapToDomain do repositório está incompleto
    return this.createUseCase.execute(command);
  }
}
