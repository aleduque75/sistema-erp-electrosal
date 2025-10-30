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
} from '@nestjs/common';
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
import { CancelRecoveryOrderUseCase } from './use-cases/cancel-recovery-order.use-case'; // Import the new use case

@UseGuards(JwtAuthGuard)
@Controller('recovery-orders')
export class RecoveryOrdersController {
  constructor(
    private readonly createRecoveryOrderUseCase: CreateRecoveryOrderUseCase,
    private readonly startRecoveryOrderUseCase: StartRecoveryOrderUseCase,
    private readonly updateRecoveryOrderPurityUseCase: UpdateRecoveryOrderPurityUseCase,
    private readonly processRecoveryFinalizationUseCase: ProcessRecoveryFinalizationUseCase,
    private readonly addRawMaterialToRecoveryOrderUseCase: AddRawMaterialToRecoveryOrderUseCase,
    private readonly cancelRecoveryOrderUseCase: CancelRecoveryOrderUseCase, // Inject the new use case
    private readonly associateImageToRecoveryOrderUseCase: AssociateImageToRecoveryOrderUseCase, // Inject the new use case
    @Inject('IRecoveryOrderRepository')
    private readonly recoveryOrderRepository: IRecoveryOrderRepository,
  ) {}

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