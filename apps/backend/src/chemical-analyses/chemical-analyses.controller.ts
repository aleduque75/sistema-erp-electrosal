import {
  Controller,
  Post,
  Body,
  Get,
  Query,
  Param,
  UseGuards,
  ParseUUIDPipe,
  Patch,
  Res,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import {
  CreateChemicalAnalysisDto,
  UpdateChemicalAnalysisDto,
  PostChemicalAnalysisResultDto,
  ListChemicalAnalysesQueryDto,
} from './dtos/chemical-analysis.dto';

// Use Cases
import { CreateChemicalAnalysisUseCase } from './use-cases/create-chemical-analysis.use-case';
import { ListChemicalAnalysesUseCase } from './use-cases/list-chemical-analyses.use-case';
import { GetChemicalAnalysisByIdUseCase } from './use-cases/get-chemical-analysis-by-id.use-case';
import { PostChemicalAnalysisResultUseCase } from './use-cases/post-chemical-analysis-result.use-case';
import { ApproveChemicalAnalysisUseCase } from './use-cases/approve-chemical-analysis.use-case';
import { RejectChemicalAnalysisUseCase } from './use-cases/reject-chemical-analysis.use-case';
import { RedoChemicalAnalysisUseCase } from './use-cases/redo-chemical-analysis.use-case';
import { RevertChemicalAnalysisToPendingApprovalUseCase } from './use-cases/revert-chemical-analysis-to-pending-approval.use-case';
import { WriteOffResidueUseCase } from './use-cases/write-off-residue.use-case';
import { UpdateChemicalAnalysisUseCase } from './use-cases/update-chemical-analysis.use-case';
import { GenerateChemicalAnalysisPdfUseCase } from './use-cases/generate-chemical-analysis-pdf.use-case';

@UseGuards(JwtAuthGuard)
@Controller('analises-quimicas')
export class ChemicalAnalysesController {
  constructor(
    private readonly createChemicalAnalysisUseCase: CreateChemicalAnalysisUseCase,
    private readonly listChemicalAnalysesUseCase: ListChemicalAnalysesUseCase,
    private readonly getChemicalAnalysisByIdUseCase: GetChemicalAnalysisByIdUseCase,
    private readonly postChemicalAnalysisResultUseCase: PostChemicalAnalysisResultUseCase,
    private readonly approveChemicalAnalysisUseCase: ApproveChemicalAnalysisUseCase,
    private readonly rejectChemicalAnalysisUseCase: RejectChemicalAnalysisUseCase,
    private readonly redoChemicalAnalysisUseCase: RedoChemicalAnalysisUseCase,
    private readonly revertChemicalAnalysisToPendingApprovalUseCase: RevertChemicalAnalysisToPendingApprovalUseCase,
    private readonly writeOffResidueUseCase: WriteOffResidueUseCase,
    private readonly updateChemicalAnalysisUseCase: UpdateChemicalAnalysisUseCase,
    private readonly generateChemicalAnalysisPdfUseCase: GenerateChemicalAnalysisPdfUseCase,
  ) {}

  @Post()
  create(
    @Body() dto: CreateChemicalAnalysisDto,
    @CurrentUser('orgId') organizationId: string,
  ) {
    return this.createChemicalAnalysisUseCase.execute(organizationId, dto);
  }

  @Get()
  findAll(
    @Query() filters: ListChemicalAnalysesQueryDto,
    @CurrentUser('orgId') organizationId: string,
  ) {
    return this.listChemicalAnalysesUseCase.execute(organizationId, filters);
  }

  @Get(':id')
  findOne(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser('orgId') organizationId: string,
  ) {
    return this.getChemicalAnalysisByIdUseCase.execute(organizationId, id);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateChemicalAnalysisDto,
    @CurrentUser('orgId') organizationId: string,
  ) {
    return this.updateChemicalAnalysisUseCase.execute(organizationId, id, dto);
  }

  @Get(':id/pdf')
  async generatePdf(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser('orgId') organizationId: string,
    @Res() res: Response,
  ) {
    const pdfBuffer = await this.generateChemicalAnalysisPdfUseCase.execute({
      analiseId: id,
      organizationId,
    });

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=analise-quimica-${id}.pdf`,
      'Content-Length': pdfBuffer.length,
    });
    res.end(pdfBuffer);
  }

  @Patch(':id/resultado')
  postResult(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: PostChemicalAnalysisResultDto,
    @CurrentUser('orgId') organizationId: string,
  ) {
    return this.postChemicalAnalysisResultUseCase.execute(organizationId, id, dto);
  }

  @Patch(':id/aprovar')
  @HttpCode(HttpStatus.NO_CONTENT)
  approve(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser('orgId') organizationId: string,
  ) {
    return this.approveChemicalAnalysisUseCase.execute(organizationId, id);
  }

  @Patch(':id/reprovar')
  @HttpCode(HttpStatus.NO_CONTENT)
  reject(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser('orgId') organizationId: string,
  ) {
    return this.rejectChemicalAnalysisUseCase.execute(organizationId, id);
  }

  @Patch(':id/refazer')
  @HttpCode(HttpStatus.NO_CONTENT)
  redo(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser('orgId') organizationId: string,
  ) {
    return this.redoChemicalAnalysisUseCase.execute(organizationId, id);
  }

  @Patch(':id/revert-to-pending-approval')
  @HttpCode(HttpStatus.NO_CONTENT)
  revertToPendingApproval(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser('orgId') organizationId: string,
  ) {
    return this.revertChemicalAnalysisToPendingApprovalUseCase.execute(organizationId, id);
  }

  @Patch(':id/baixar-residuo')
  @HttpCode(HttpStatus.NO_CONTENT)
  writeOffResiduePatch(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser('orgId') organizationId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.writeOffResidueUseCase.execute(id, organizationId, userId);
  }

  @Post(':id/write-off')
  @HttpCode(HttpStatus.NO_CONTENT)
  writeOffResiduePost(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser('orgId') organizationId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.writeOffResidueUseCase.execute(id, organizationId, userId);
  }
}
