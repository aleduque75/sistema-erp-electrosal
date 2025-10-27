import { UniqueEntityID } from '../../../_shared/domain/unique-entity-id';
import { AggregateRoot } from "../../../_shared/domain/aggregate-root";
import { RecoveryOrderStatus } from "../../enums/recovery-order-status.enum";
import { TipoMetal } from '../../enums/tipo-metal.enum';

// Define a interface para os dados resumidos da análise química
export interface AnaliseQuimicaResumida {
  id: string;
  numeroAnalise: string;
  clienteName: string;
  volumeOuPesoEntrada: number;
  auLiquidoParaClienteGramas: number | null;
  metalCreditGrams?: number | null;
}

export interface RawMaterialUsedResumida {
  id: string;
  rawMaterialId: string;
  rawMaterialName: string;
  quantity: number;
  cost: number;
  unit: string;
  goldEquivalentCost?: number | null;
}

export interface RecoveryOrderProps {
  organizationId: string;
  metalType: TipoMetal;
  chemicalAnalysisIds: string[];
  status: RecoveryOrderStatus;
  dataInicio: Date;
  dataFim?: Date;
  descricao?: string;
  observacoes?: string;
  dataCriacao: Date;
  dataAtualizacao: Date;

  // --- INPUT ---
  totalBrutoEstimadoGramas: number;

  // --- PROCESSAMENTO ---
  resultadoProcessamentoGramas?: number;
  teorFinal?: number;

  // --- OUTPUT (Calculado) --
  auPuroRecuperadoGramas?: number;
  residuoGramas?: number;

  // --- VÍNCULO COM RESÍDUO ---
  residueAnalysisId?: string;

  // --- DADOS ENVOLVIDOS (POPULADOS PELO REPOSITÓRIO) ---
  analisesEnvolvidas?: AnaliseQuimicaResumida[];
  rawMaterialsUsed?: RawMaterialUsedResumida[];
}

export class RecoveryOrder extends AggregateRoot<RecoveryOrderProps> {
  private _analisesEnvolvidas?: AnaliseQuimicaResumida[]; // Propriedade privada para as análises envolvidas
  private _rawMaterialsUsed?: RawMaterialUsedResumida[];

  private constructor(props: RecoveryOrderProps, id?: UniqueEntityID) {
    super(props, id);
    this._analisesEnvolvidas = props.analisesEnvolvidas; // Inicializa a propriedade privada
    this._rawMaterialsUsed = props.rawMaterialsUsed;
  }

  public static create(
    props: Omit<RecoveryOrderProps, 'dataCriacao' | 'dataAtualizacao' | 'status' | 'resultadoProcessamentoGramas' | 'teorFinal' | 'auPuroRecuperadoGramas' | 'residuoGramas' | 'residueAnalysisId' | 'analisesEnvolvidas' | 'rawMaterialsUsed'>,
    id?: UniqueEntityID
  ): RecoveryOrder {
    const now = new Date();
    const recoveryOrder = new RecoveryOrder(
      {
        ...props,
        status: RecoveryOrderStatus.PENDENTE,
        dataCriacao: now,
        dataAtualizacao: now,
      },
      id,
    );
    return recoveryOrder;
  }

  public static reconstitute(props: RecoveryOrderProps, id: UniqueEntityID): RecoveryOrder {
    return new RecoveryOrder(props, id);
  }

  get organizationId(): string { return this.props.organizationId; }
  get metalType(): TipoMetal { return this.props.metalType; }
  get chemicalAnalysisIds(): string[] { return this.props.chemicalAnalysisIds; }
  get status(): RecoveryOrderStatus { return this.props.status; }
  get dataInicio(): Date { return this.props.dataInicio; }
  get dataFim(): Date | undefined { return this.props.dataFim; }
  get descricao(): string | undefined { return this.props.descricao; }
  get observacoes(): string | undefined { return this.props.observacoes; }
  get dataCriacao(): Date { return this.props.dataCriacao; }
  get dataAtualizacao(): Date { return this.props.dataAtualizacao; }

  // --- New getters ---
  get totalBrutoEstimadoGramas(): number { return this.props.totalBrutoEstimadoGramas; }
  get resultadoProcessamentoGramas(): number | undefined { return this.props.resultadoProcessamentoGramas; }
  get teorFinal(): number | undefined { return this.props.teorFinal; }
  get auPuroRecuperadoGramas(): number | undefined { return this.props.auPuroRecuperadoGramas; }
  get residuoGramas(): number | undefined { return this.props.residuoGramas; }
  get residueAnalysisId(): string | undefined { return this.props.residueAnalysisId; }

  // Getter para as análises envolvidas
  get analisesEnvolvidas(): AnaliseQuimicaResumida[] | undefined { return this._analisesEnvolvidas; }

  get rawMaterialsUsed(): RawMaterialUsedResumida[] | undefined { return this._rawMaterialsUsed; }

  // Método para definir as análises envolvidas (usado pelo repositório)
  public setAnalisesEnvolvidas(analises: AnaliseQuimicaResumida[]) {
    this._analisesEnvolvidas = analises;
  }

  public setRawMaterialsUsed(rawMaterialsUsed: RawMaterialUsedResumida[]) {
    this._rawMaterialsUsed = rawMaterialsUsed;
  }

  public update(dto: Partial<Omit<RecoveryOrderProps, 'totalBrutoEstimadoGramas' | 'organizationId' | 'chemicalAnalysisIds' | 'analisesEnvolvidas' | 'rawMaterialsUsed'>>) {
    // Prevent updating immutable fields
    const { totalBrutoEstimadoGramas, organizationId, chemicalAnalysisIds, analisesEnvolvidas, rawMaterialsUsed, ...updateDto } = dto as any;
    Object.assign(this.props, updateDto);
    this.props.dataAtualizacao = new Date();
  }
}
