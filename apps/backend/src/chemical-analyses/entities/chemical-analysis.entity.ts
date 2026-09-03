import { ChemicalAnalysisStatusVO, ChemicalAnalysisStatus } from '../value-objects/chemical-analysis-status.vo';
import { TipoMetal } from '@prisma/client';

export interface ChemicalAnalysisProps {
  id?: string;
  organizationId: string;
  clienteId?: string | null;
  numeroAnalise: string;
  dataEntrada: Date;
  descricaoMaterial: string;
  volumeOuPesoEntrada: number;
  unidadeEntrada: string;
  resultadoAnaliseValor?: number | null;
  unidadeResultado?: string | null;
  percentualQuebra?: number | null;
  taxaServicoPercentual?: number | null;
  teorRecuperavel?: number | null;
  auEstimadoBrutoGramas?: number | null;
  auEstimadoRecuperavelGramas?: number | null;
  taxaServicoEmGramas?: number | null;
  auLiquidoParaClienteGramas?: number | null;
  status: ChemicalAnalysisStatusVO;
  dataAnaliseConcluida?: Date | null;
  dataAprovacaoCliente?: Date | null;
  dataFinalizacaoRecuperacao?: Date | null;
  observacoes?: string | null;
  ordemDeRecuperacaoId?: string | null;
  metalType: TipoMetal;
  isWriteOff: boolean;
  dataCriacao?: Date;
  dataAtualizacao?: Date;
}

export class ChemicalAnalysisEntity {
  private props: ChemicalAnalysisProps;

  private constructor(props: ChemicalAnalysisProps) {
    this.props = props;
  }

  static create(params: {
    id?: string;
    organizationId: string;
    clienteId?: string | null;
    numeroAnalise: string;
    dataEntrada?: Date | string;
    descricaoMaterial: string;
    volumeOuPesoEntrada: number;
    unidadeEntrada: string;
    resultadoAnaliseValor?: number | null;
    unidadeResultado?: string | null;
    percentualQuebra?: number | null;
    taxaServicoPercentual?: number | null;
    teorRecuperavel?: number | null;
    auEstimadoBrutoGramas?: number | null;
    auEstimadoRecuperavelGramas?: number | null;
    taxaServicoEmGramas?: number | null;
    auLiquidoParaClienteGramas?: number | null;
    status?: string | ChemicalAnalysisStatusVO;
    dataAnaliseConcluida?: Date | string | null;
    dataAprovacaoCliente?: Date | string | null;
    dataFinalizacaoRecuperacao?: Date | string | null;
    observacoes?: string | null;
    ordemDeRecuperacaoId?: string | null;
    metalType?: TipoMetal;
    isWriteOff?: boolean;
    dataCriacao?: Date;
    dataAtualizacao?: Date;
  }): ChemicalAnalysisEntity {
    if (!params.organizationId) {
      throw new Error('ID da organização é obrigatório.');
    }
    if (!params.numeroAnalise || params.numeroAnalise.trim() === '') {
      throw new Error('Número da análise é obrigatório.');
    }
    if (!params.descricaoMaterial || params.descricaoMaterial.trim() === '') {
      throw new Error('Descrição do material é obrigatória.');
    }
    if (params.volumeOuPesoEntrada !== undefined && params.volumeOuPesoEntrada < 0) {
      throw new Error('Volume ou peso de entrada não pode ser negativo.');
    }

    const dataEntrada = params.dataEntrada
      ? (typeof params.dataEntrada === 'string' ? new Date(params.dataEntrada) : params.dataEntrada)
      : new Date();

    const statusVO = params.status
      ? (params.status instanceof ChemicalAnalysisStatusVO ? params.status : new ChemicalAnalysisStatusVO(params.status))
      : new ChemicalAnalysisStatusVO('EM_ANALISE');

    const dataAnaliseConcluida = params.dataAnaliseConcluida
      ? (typeof params.dataAnaliseConcluida === 'string' ? new Date(params.dataAnaliseConcluida) : params.dataAnaliseConcluida)
      : null;

    const dataAprovacaoCliente = params.dataAprovacaoCliente
      ? (typeof params.dataAprovacaoCliente === 'string' ? new Date(params.dataAprovacaoCliente) : params.dataAprovacaoCliente)
      : null;

    const dataFinalizacaoRecuperacao = params.dataFinalizacaoRecuperacao
      ? (typeof params.dataFinalizacaoRecuperacao === 'string' ? new Date(params.dataFinalizacaoRecuperacao) : params.dataFinalizacaoRecuperacao)
      : null;

    return new ChemicalAnalysisEntity({
      id: params.id,
      organizationId: params.organizationId,
      clienteId: params.clienteId,
      numeroAnalise: params.numeroAnalise.trim(),
      dataEntrada,
      descricaoMaterial: params.descricaoMaterial.trim(),
      volumeOuPesoEntrada: params.volumeOuPesoEntrada,
      unidadeEntrada: params.unidadeEntrada,
      resultadoAnaliseValor: params.resultadoAnaliseValor,
      unidadeResultado: params.unidadeResultado,
      percentualQuebra: params.percentualQuebra,
      taxaServicoPercentual: params.taxaServicoPercentual,
      teorRecuperavel: params.teorRecuperavel,
      auEstimadoBrutoGramas: params.auEstimadoBrutoGramas,
      auEstimadoRecuperavelGramas: params.auEstimadoRecuperavelGramas,
      taxaServicoEmGramas: params.taxaServicoEmGramas,
      auLiquidoParaClienteGramas: params.auLiquidoParaClienteGramas,
      status: statusVO,
      dataAnaliseConcluida,
      dataAprovacaoCliente,
      dataFinalizacaoRecuperacao,
      observacoes: params.observacoes,
      ordemDeRecuperacaoId: params.ordemDeRecuperacaoId,
      metalType: params.metalType ?? TipoMetal.AU,
      isWriteOff: params.isWriteOff ?? false,
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

  get clienteId(): string | null | undefined {
    return this.props.clienteId;
  }

  get numeroAnalise(): string {
    return this.props.numeroAnalise;
  }

  get dataEntrada(): Date {
    return this.props.dataEntrada;
  }

  get descricaoMaterial(): string {
    return this.props.descricaoMaterial;
  }

  get volumeOuPesoEntrada(): number {
    return this.props.volumeOuPesoEntrada;
  }

  get unidadeEntrada(): string {
    return this.props.unidadeEntrada;
  }

  get resultadoAnaliseValor(): number | null | undefined {
    return this.props.resultadoAnaliseValor;
  }

  get unidadeResultado(): string | null | undefined {
    return this.props.unidadeResultado;
  }

  get percentualQuebra(): number | null | undefined {
    return this.props.percentualQuebra;
  }

  get taxaServicoPercentual(): number | null | undefined {
    return this.props.taxaServicoPercentual;
  }

  get teorRecuperavel(): number | null | undefined {
    return this.props.teorRecuperavel;
  }

  get auEstimadoBrutoGramas(): number | null | undefined {
    return this.props.auEstimadoBrutoGramas;
  }

  get auEstimadoRecuperavelGramas(): number | null | undefined {
    return this.props.auEstimadoRecuperavelGramas;
  }

  get taxaServicoEmGramas(): number | null | undefined {
    return this.props.taxaServicoEmGramas;
  }

  get auLiquidoParaClienteGramas(): number | null | undefined {
    return this.props.auLiquidoParaClienteGramas;
  }

  get status(): ChemicalAnalysisStatusVO {
    return this.props.status;
  }

  get statusValue(): ChemicalAnalysisStatus {
    return this.props.status.value;
  }

  get dataAnaliseConcluida(): Date | null | undefined {
    return this.props.dataAnaliseConcluida;
  }

  get dataAprovacaoCliente(): Date | null | undefined {
    return this.props.dataAprovacaoCliente;
  }

  get dataFinalizacaoRecuperacao(): Date | null | undefined {
    return this.props.dataFinalizacaoRecuperacao;
  }

  get observacoes(): string | null | undefined {
    return this.props.observacoes;
  }

  get ordemDeRecuperacaoId(): string | null | undefined {
    return this.props.ordemDeRecuperacaoId;
  }

  get metalType(): TipoMetal {
    return this.props.metalType;
  }

  get isWriteOff(): boolean {
    return this.props.isWriteOff;
  }

  get dataCriacao(): Date | undefined {
    return this.props.dataCriacao;
  }

  get dataAtualizacao(): Date | undefined {
    return this.props.dataAtualizacao;
  }

  postResult(data: {
    resultadoAnaliseValor: number;
    unidadeResultado?: string;
    percentualQuebra?: number;
    taxaServicoPercentual?: number;
    observacoes?: string;
  }): void {
    this.props.resultadoAnaliseValor = data.resultadoAnaliseValor;
    if (data.unidadeResultado) this.props.unidadeResultado = data.unidadeResultado;
    if (data.percentualQuebra !== undefined) this.props.percentualQuebra = data.percentualQuebra;
    if (data.taxaServicoPercentual !== undefined) this.props.taxaServicoPercentual = data.taxaServicoPercentual;
    if (data.observacoes) this.props.observacoes = data.observacoes;

    this.calculateYield();
    this.props.status = new ChemicalAnalysisStatusVO('ANALISADO_AGUARDANDO_APROVACAO');
    this.props.dataAnaliseConcluida = new Date();
  }

  calculateYield(): void {
    if (this.props.resultadoAnaliseValor == null || this.props.volumeOuPesoEntrada <= 0) {
      return;
    }

    const valor = this.props.resultadoAnaliseValor;
    const peso = this.props.volumeOuPesoEntrada;
    const quebra = this.props.percentualQuebra ?? 0;
    const taxa = this.props.taxaServicoPercentual ?? 0;

    const quebraDecimal = quebra > 1 ? quebra / 100 : quebra;
    const taxaDecimal = taxa > 1 ? taxa / 100 : taxa;

    let auBruto = peso * valor;
    if (this.props.unidadeResultado === '%') {
      auBruto = (peso * valor) / 100;
    } else if (this.props.unidadeResultado === 'ppm') {
      auBruto = (peso * valor) / 1000;
    }

    const teorRecuperavel = valor * (1 - quebraDecimal);
    const auRecuperavel = auBruto * (1 - quebraDecimal);
    const taxaGramas = auRecuperavel * taxaDecimal;
    const auLiquido = auRecuperavel - taxaGramas;

    this.props.teorRecuperavel = parseFloat(teorRecuperavel.toFixed(4));
    this.props.auEstimadoBrutoGramas = parseFloat(auBruto.toFixed(4));
    this.props.auEstimadoRecuperavelGramas = parseFloat(auRecuperavel.toFixed(4));
    this.props.taxaServicoEmGramas = parseFloat(taxaGramas.toFixed(4));
    this.props.auLiquidoParaClienteGramas = parseFloat(auLiquido.toFixed(4));
  }

  approve(dataAprovacao: Date = new Date()): void {
    this.props.status = new ChemicalAnalysisStatusVO('APROVADO_PARA_RECUPERACAO');
    this.props.dataAprovacaoCliente = dataAprovacao;
  }

  reject(): void {
    this.props.status = new ChemicalAnalysisStatusVO('RECUSADO_PELO_CLIENTE');
  }

  redo(): void {
    this.props.status = new ChemicalAnalysisStatusVO('EM_ANALISE');
    this.props.resultadoAnaliseValor = null;
    this.props.auEstimadoBrutoGramas = null;
    this.props.auEstimadoRecuperavelGramas = null;
    this.props.taxaServicoEmGramas = null;
    this.props.auLiquidoParaClienteGramas = null;
  }

  revertToPendingApproval(): void {
    this.props.status = new ChemicalAnalysisStatusVO('ANALISADO_AGUARDANDO_APROVACAO');
  }

  writeOffResidue(): void {
    this.props.isWriteOff = true;
    this.props.status = new ChemicalAnalysisStatusVO('RESIDUO');
  }

  reverterStatusParaAprovadoParaRecuperacao(): void {
    this.props.status = new ChemicalAnalysisStatusVO('APROVADO_PARA_RECUPERACAO');
    this.props.dataAtualizacao = new Date();
  }

  clearOrdemDeRecuperacaoId(): void {
    this.props.ordemDeRecuperacaoId = null;
    this.props.dataAtualizacao = new Date();
  }

  update(params: {
    status?: any;
    ordemDeRecuperacaoId?: string | null;
    [key: string]: any;
  }): void {
    if (params.status) {
      this.props.status =
        params.status instanceof ChemicalAnalysisStatusVO
          ? params.status
          : new ChemicalAnalysisStatusVO(params.status);
    }
    if (params.ordemDeRecuperacaoId !== undefined) {
      this.props.ordemDeRecuperacaoId = params.ordemDeRecuperacaoId;
    }
    this.updateDetails(params);
  }

  updateDetails(params: Partial<ChemicalAnalysisProps>): void {
    Object.assign(this.props, params);
  }
}
