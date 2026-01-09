import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  Patch,
  Param,
  ParseUUIDPipe,
  Get,
  Inject,
  Query,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateRecoveryOrderUseCase } from './use-cases/create-recovery-order.use-case';
import { CreateRecoveryOrderDto } from './dtos/create-recovery-order.dto';
import { RecoveryOrderResponseDto } from './dtos/recovery-order.response.dto';
import { ListRecoveryOrdersDto } from './dtos/list-recovery-orders.dto';
import { StartRecoveryOrderUseCase } from './use-cases/start-recovery-order.use-case';
import { UpdateRecoveryOrderPurityUseCase } from './use-cases/update-recovery-order-purity.use-case';
import { ProcessRecoveryFinalizationUseCase } from './use-cases/process-recovery-finalization.use-case';
import { UpdateRecoveryOrderPurityDto } from './dtos/update-recovery-order-purity.dto';
import { FinalizeRecoveryOrderDto } from './dtos/finalize-recovery-order.dto';
import { AddRawMaterialToRecoveryOrderUseCase } from './use-cases/add-raw-material.use-case';
import { AddRawMaterialDto } from './dtos/add-raw-material.dto';
import { IRecoveryOrderRepository } from '@sistema-erp-electrosal/core';
import { AssociateImageToRecoveryOrderUseCase } from './use-cases/associate-image-to-recovery-order.use-case';
import { CancelRecoveryOrderUseCase } from './use-cases/cancel-recovery-order.use-case';
import { GerarPdfRecoveryOrderUseCase } from './use-cases/gerar-pdf-recovery-order.use-case';
import { ApplyRecoveryOrderCommissionUseCase, ApplyRecoveryOrderCommissionDto } from './use-cases/apply-recovery-order-commission.use-case';
import { UpdateRecoveryOrderUseCase } from './use-cases/update-recovery-order.use-case';

@UseGuards(JwtAuthGuard)
@Controller('recovery-orders')
export class RecoveryOrdersController {
  constructor(
    private readonly createRecoveryOrderUseCase: CreateRecoveryOrderUseCase,
    private readonly startRecoveryOrderUseCase: StartRecoveryOrderUseCase,
    private readonly updateRecoveryOrderPurityUseCase: UpdateRecoveryOrderPurityUseCase,
    private readonly processRecoveryFinalizationUseCase: ProcessRecoveryFinalizationUseCase,
    private readonly addRawMaterialToRecoveryOrderUseCase: AddRawMaterialToRecoveryOrderUseCase,
    private readonly cancelRecoveryOrderUseCase: CancelRecoveryOrderUseCase,
    private readonly associateImageToRecoveryOrderUseCase: AssociateImageToRecoveryOrderUseCase,
    private readonly gerarPdfRecoveryOrderUseCase: GerarPdfRecoveryOrderUseCase,
    private readonly applyRecoveryOrderCommissionUseCase: ApplyRecoveryOrderCommissionUseCase,
    private readonly updateRecoveryOrderUseCase: UpdateRecoveryOrderUseCase,
    @Inject('IRecoveryOrderRepository')
    private readonly recoveryOrderRepository: IRecoveryOrderRepository,
  ) {}

  @Patch(':id')
  async update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() body: { descricao?: string; observacoes?: string },
    @Req() req,
  ) {
    const organizationId = req.user?.orgId;
    await this.updateRecoveryOrderUseCase.execute({
      organizationId,
      recoveryOrderId: id,
      ...body,
    });
  }

  @Post(':id/apply-commission')
  async applyCommission(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: ApplyRecoveryOrderCommissionDto,
    @Req() req,
  ) {
    const organizationId = req.user?.orgId;
    await this.applyRecoveryOrderCommissionUseCase.execute(organizationId, id, dto);
  }

  @Post()
  async createRecoveryOrder(@Body() dto: CreateRecoveryOrderDto, @Req() req) {
    const organizationId = req.user?.orgId;
    const command = { ...dto, organizationId };
    const recoveryOrder = await this.createRecoveryOrderUseCase.execute(command);
    return RecoveryOrderResponseDto.fromDomain(recoveryOrder);
  }

  @Get()
  async getAllRecoveryOrders(@Req() req, @Query() filters: ListRecoveryOrdersDto): Promise<RecoveryOrderResponseDto[]> {
    const organizationId = req.user?.orgId;
    const recoveryOrders = await this.recoveryOrderRepository.findAll(organizationId, filters);
    return recoveryOrders.map(RecoveryOrderResponseDto.fromDomain);
  }

  @Get(':id')
  async getRecoveryOrderById(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Req() req
  ): Promise<RecoveryOrderResponseDto> {
    const organizationId = req.user?.orgId;
    const recoveryOrder = await this.recoveryOrderRepository.findById(id, organizationId);
    return RecoveryOrderResponseDto.fromDomain(recoveryOrder);
  }

  @Get(':id/pdf')
  async gerarPdf(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Res() res: Response,
    @Req() req,
  ) {
    const organizationId = req.user?.orgId;
    const pdfBuffer = await this.gerarPdfRecoveryOrderUseCase.execute({
      recoveryOrderId: id,
      organizationId,
    });
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Length': pdfBuffer.length,
      'Content-Disposition': `attachment; filename=recovery_order_${id}.pdf`,
    });
    res.send(pdfBuffer);
  }

  @Post(':id/raw-materials')
  async addRawMaterial(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: AddRawMaterialDto,
    @Req() req,
  ) {
    const organizationId = req.user?.orgId;
    await this.addRawMaterialToRecoveryOrderUseCase.execute(organizationId, id, dto);
  }

  @Patch(':id/start')
  async startRecoveryOrder(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Req() req,
  ) {
    const organizationId = req.user?.orgId;
    const command = { recoveryOrderId: id, organizationId };
    await this.startRecoveryOrderUseCase.execute(command);
  }

  @Patch(':id/update-purity')
  async updateRecoveryOrderPurity(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateRecoveryOrderPurityDto,
    @Req() req,
  ) {
    const organizationId = req.user?.orgId;
    const command = { recoveryOrderId: id, organizationId, ...dto };
    await this.updateRecoveryOrderPurityUseCase.execute(command);
  }

  @Patch(':id/finalize')
  async processRecoveryFinalization(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: FinalizeRecoveryOrderDto,
    @Req() req,
  ) {
    const organizationId = req.user?.orgId;
    const command = { recoveryOrderId: id, organizationId, ...dto };
    await this.processRecoveryFinalizationUseCase.execute(command);
  }

  @Patch(':id/cancel')
  async cancelRecoveryOrder(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Req() req,
  ) {
    const organizationId = req.user?.orgId;
    const command = { recoveryOrderId: id, organizationId };
    await this.cancelRecoveryOrderUseCase.execute(command);
  }

  @Patch(':id/image')
  async associateImage(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() body: { mediaId: string },
    @Req() req,
  ) {
    const organizationId = req.user?.orgId;
    const command = { recoveryOrderId: id, mediaId: body.mediaId, organizationId };
    await this.associateImageToRecoveryOrderUseCase.execute(command);
  }
}