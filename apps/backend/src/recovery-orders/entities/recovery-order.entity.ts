import { RecoveryOrderStatusVO } from '../value-objects/recovery-order-status.vo';
import { PurityVO } from '../value-objects/purity.vo';
import { OrderNumberVO } from '../value-objects/order-number.vo';
import { RawMaterialItemEntity } from './raw-material-item.entity';
import { TipoMetal, RecoveryOrderStatusPrisma } from '@prisma/client';
import Decimal from 'decimal.js';

export interface RecoveryOrderProps {
  id?: string;
  organizationId: string;
  orderNumber: OrderNumberVO;
  metalType: TipoMetal;
  status: RecoveryOrderStatusVO;
  totalBrutoEstimadoGramas: number;
  resultadoProcessamentoGramas?: number | null;
  teorFinal?: PurityVO | null;
  auPuroRecuperadoGramas?: number | null;
  residuoGramas?: number | null;
  residueAnalysisId?: string | null;
  chemicalAnalysisIds: string[];
  descricao?: string | null;
  descricaoProcesso?: string | null;
  observacoes?: string | null;
  dataInicio: Date;
  dataFim?: Date | null;
  commissionAmount?: Decimal | null;
  commissionPercentage?: Decimal | null;
  salespersonId?: string | null;
  rawMaterialsUsed: RawMaterialItemEntity[];
  images?: any[];
  dataCriacao?: Date;
  dataAtualizacao?: Date;
}

export class RecoveryOrderEntity {
  private props: RecoveryOrderProps;

  private constructor(props: RecoveryOrderProps) {
    this.props = props;
  }

  static create(params: {
    id?: string;
    organizationId: string;
    orderNumber: string | OrderNumberVO;
    metalType?: TipoMetal;
    status?: string | RecoveryOrderStatusPrisma | RecoveryOrderStatusVO;
    totalBrutoEstimadoGramas: number;
    resultadoProcessamentoGramas?: number | null;
    teorFinal?: number | string | Decimal | PurityVO | null;
    auPuroRecuperadoGramas?: number | null;
    residuoGramas?: number | null;
    residueAnalysisId?: string | null;
    chemicalAnalysisIds?: string[];
    descricao?: string | null;
    descricaoProcesso?: string | null;
    observacoes?: string | null;
    dataInicio?: Date | string;
    dataFim?: Date | string | null;
    commissionAmount?: number | string | Decimal | null;
    commissionPercentage?: number | string | Decimal | null;
    salespersonId?: string | null;
    rawMaterialsUsed?: RawMaterialItemEntity[];
    images?: any[];
    dataCriacao?: Date;
    dataAtualizacao?: Date;
  }): RecoveryOrderEntity {
    if (!params.organizationId) {
      throw new Error('ID da organização é obrigatório.');
    }
    if (params.totalBrutoEstimadoGramas <= 0) {
      throw new Error('O total bruto estimado em gramas deve ser estritamente positivo.');
    }

    const orderNumberVO = params.orderNumber instanceof OrderNumberVO
      ? params.orderNumber
      : new OrderNumberVO(params.orderNumber);

    const statusVO = params.status instanceof RecoveryOrderStatusVO
      ? params.status
      : new RecoveryOrderStatusVO(params.status || RecoveryOrderStatusPrisma.PENDENTE);

    const teorFinalVO = params.teorFinal != null
      ? params.teorFinal instanceof PurityVO
        ? params.teorFinal
        : new PurityVO(params.teorFinal)
      : null;

    const dataInicioDate = params.dataInicio ? new Date(params.dataInicio) : new Date();
    const dataFimDate = params.dataFim ? new Date(params.dataFim) : null;

    return new RecoveryOrderEntity({
      id: params.id,
      organizationId: params.organizationId,
      orderNumber: orderNumberVO,
      metalType: params.metalType || TipoMetal.AU,
      status: statusVO,
      totalBrutoEstimadoGramas: params.totalBrutoEstimadoGramas,
      resultadoProcessamentoGramas: params.resultadoProcessamentoGramas,
      teorFinal: teorFinalVO,
      auPuroRecuperadoGramas: params.auPuroRecuperadoGramas,
      residuoGramas: params.residuoGramas,
      residueAnalysisId: params.residueAnalysisId,
      chemicalAnalysisIds: params.chemicalAnalysisIds || [],
      descricao: params.descricao,
      descricaoProcesso: params.descricaoProcesso,
      observacoes: params.observacoes,
      dataInicio: dataInicioDate,
      dataFim: dataFimDate,
      commissionAmount: params.commissionAmount != null ? new Decimal(params.commissionAmount) : null,
      commissionPercentage: params.commissionPercentage != null ? new Decimal(params.commissionPercentage) : null,
      salespersonId: params.salespersonId,
      rawMaterialsUsed: params.rawMaterialsUsed || [],
      images: params.images || [],
      dataCriacao: params.dataCriacao,
      dataAtualizacao: params.dataAtualizacao,
    });
  }

  get id(): string | undefined {
    return this.props.id;
  }

  get organizationId(): string {
    return this.props.organizationId;
  }

  get orderNumber(): OrderNumberVO {
    return this.props.orderNumber;
  }

  get metalType(): TipoMetal {
    return this.props.metalType;
  }

  get status(): RecoveryOrderStatusVO {
    return this.props.status;
  }

  get totalBrutoEstimadoGramas(): number {
    return this.props.totalBrutoEstimadoGramas;
  }

  get resultadoProcessamentoGramas(): number | null | undefined {
    return this.props.resultadoProcessamentoGramas;
  }

  get teorFinal(): PurityVO | null | undefined {
    return this.props.teorFinal;
  }

  get auPuroRecuperadoGramas(): number | null | undefined {
    return this.props.auPuroRecuperadoGramas;
  }

  get residuoGramas(): number | null | undefined {
    return this.props.residuoGramas;
  }

  get residueAnalysisId(): string | null | undefined {
    return this.props.residueAnalysisId;
  }

  get chemicalAnalysisIds(): string[] {
    return this.props.chemicalAnalysisIds;
  }

  get descricao(): string | null | undefined {
    return this.props.descricao;
  }

  get descricaoProcesso(): string | null | undefined {
    return this.props.descricaoProcesso;
  }

  get observacoes(): string | null | undefined {
    return this.props.observacoes;
  }

  get dataInicio(): Date {
    return this.props.dataInicio;
  }

  get dataFim(): Date | null | undefined {
    return this.props.dataFim;
  }

  get commissionAmount(): Decimal | null | undefined {
    return this.props.commissionAmount;
  }

  get commissionPercentage(): Decimal | null | undefined {
    return this.props.commissionPercentage;
  }

  get salespersonId(): string | null | undefined {
    return this.props.salespersonId;
  }

  get rawMaterialsUsed(): RawMaterialItemEntity[] {
    return this.props.rawMaterialsUsed;
  }

  get images(): any[] {
    return this.props.images || [];
  }

  get dataCriacao(): Date | undefined {
    return this.props.dataCriacao;
  }

  get dataAtualizacao(): Date | undefined {
    return this.props.dataAtualizacao;
  }

  start(): void {
    this.props.status.ensureCanStart();
    this.props.status = new RecoveryOrderStatusVO(RecoveryOrderStatusPrisma.EM_ANDAMENTO);
  }

  updateProcessingResult(rawResultGrams: number, purity?: number | PurityVO): void {
    if (this.props.status.isFinalizada() || this.props.status.isCancelada()) {
      throw new Error('Não é possível atualizar resultados em ordens finalizadas ou canceladas.');
    }
    if (rawResultGrams <= 0) {
      throw new Error('O resultado de processamento em gramas deve ser estritamente positivo.');
    }

    this.props.resultadoProcessamentoGramas = rawResultGrams;

    if (purity != null) {
      const purityVO = purity instanceof PurityVO ? purity : new PurityVO(purity);
      this.props.teorFinal = purityVO;
      this.props.auPuroRecuperadoGramas = purityVO.multiply(rawResultGrams).toNumber();
      this.props.residuoGramas = Math.max(0, this.props.totalBrutoEstimadoGramas - this.props.auPuroRecuperadoGramas);
    }

    this.props.status = new RecoveryOrderStatusVO(RecoveryOrderStatusPrisma.AGUARDANDO_TEOR);
  }

  finalize(residueAnalysisId?: string): void {
    this.props.status.ensureCanFinalize();
    if (!this.props.resultadoProcessamentoGramas || !this.props.teorFinal) {
      throw new Error('Não é possível finalizar a ordem sem resultado de processamento e teor final definidos.');
    }

    this.props.residueAnalysisId = residueAnalysisId || this.props.residueAnalysisId;
    this.props.status = new RecoveryOrderStatusVO(RecoveryOrderStatusPrisma.FINALIZADA);
    this.props.dataFim = new Date();
  }

  cancel(): void {
    this.props.status.ensureCanCancel();
    this.props.status = new RecoveryOrderStatusVO(RecoveryOrderStatusPrisma.CANCELADA);
    this.props.dataFim = new Date();
  }

  addRawMaterial(item: RawMaterialItemEntity): void {
    this.props.rawMaterialsUsed.push(item);
  }

  applyCommission(amount?: number | Decimal, percentage?: number | Decimal, salespersonId?: string): void {
    if (amount != null) {
      this.props.commissionAmount = new Decimal(amount);
    }
    if (percentage != null) {
      this.props.commissionPercentage = new Decimal(percentage);
    }
    if (salespersonId) {
      this.props.salespersonId = salespersonId;
    }
  }

  calculateYield(): number {
    if (!this.props.resultadoProcessamentoGramas || this.props.totalBrutoEstimadoGramas === 0) {
      return 0;
    }
    return new Decimal(this.props.resultadoProcessamentoGramas)
      .dividedBy(this.props.totalBrutoEstimadoGramas)
      .times(100)
      .toDecimalPlaces(2)
      .toNumber();
  }
}
