import { Prisma } from '@prisma/client';
import { ChemicalAnalysisEntity } from '../entities/chemical-analysis.entity';

export class ChemicalAnalysisMapper {
  static toDomain(raw: any): ChemicalAnalysisEntity {
    return ChemicalAnalysisEntity.create({
      id: raw.id,
      organizationId: raw.organizationId,
      clienteId: raw.clienteId,
      numeroAnalise: raw.numeroAnalise,
      dataEntrada: raw.dataEntrada,
      descricaoMaterial: raw.descricaoMaterial,
      volumeOuPesoEntrada: raw.volumeOuPesoEntrada,
      unidadeEntrada: raw.unidadeEntrada,
      resultadoAnaliseValor: raw.resultadoAnaliseValor,
      unidadeResultado: raw.unidadeResultado,
      percentualQuebra: raw.percentualQuebra,
      taxaServicoPercentual: raw.taxaServicoPercentual,
      teorRecuperavel: raw.teorRecuperavel,
      auEstimadoBrutoGramas: raw.auEstimadoBrutoGramas,
      auEstimadoRecuperavelGramas: raw.auEstimadoRecuperavelGramas,
      taxaServicoEmGramas: raw.taxaServicoEmGramas,
      auLiquidoParaClienteGramas: raw.auLiquidoParaClienteGramas,
      status: raw.status,
      dataAnaliseConcluida: raw.dataAnaliseConcluida,
      dataAprovacaoCliente: raw.dataAprovacaoCliente,
      dataFinalizacaoRecuperacao: raw.dataFinalizacaoRecuperacao,
      observacoes: raw.observacoes,
      ordemDeRecuperacaoId: raw.ordemDeRecuperacaoId,
      metalType: raw.metalType,
      isWriteOff: raw.isWriteOff,
      dataCriacao: raw.dataCriacao,
      dataAtualizacao: raw.dataAtualizacao,
    });
  }

  static toPersistence(
    entity: ChemicalAnalysisEntity | any,
    fallbackOrganizationId?: string,
  ): Prisma.AnaliseQuimicaUncheckedCreateInput {
    const id = entity.id?.toString ? entity.id.toString() : entity.id;
    const status = entity.statusValue || entity.status?.value || entity.status;
    const organizationId =
      entity.organizationId ||
      (entity as any).props?.organizationId ||
      (entity as any).props?.organization?.id ||
      fallbackOrganizationId;
    return {
      id,
      organizationId,
      clienteId: entity.clienteId || (entity as any).props?.clienteId,
      numeroAnalise: entity.numeroAnalise || (entity as any).props?.numeroAnalise,
      dataEntrada: entity.dataEntrada || (entity as any).props?.dataEntrada,
      descricaoMaterial: entity.descricaoMaterial || (entity as any).props?.descricaoMaterial,
      volumeOuPesoEntrada: entity.volumeOuPesoEntrada ?? (entity as any).props?.volumeOuPesoEntrada,
      unidadeEntrada: entity.unidadeEntrada || (entity as any).props?.unidadeEntrada,
      resultadoAnaliseValor: entity.resultadoAnaliseValor ?? (entity as any).props?.resultadoAnaliseValor,
      unidadeResultado: entity.unidadeResultado || (entity as any).props?.unidadeResultado,
      percentualQuebra: entity.percentualQuebra ?? (entity as any).props?.percentualQuebra,
      taxaServicoPercentual: entity.taxaServicoPercentual ?? (entity as any).props?.taxaServicoPercentual,
      teorRecuperavel: entity.teorRecuperavel ?? (entity as any).props?.teorRecuperavel,
      auEstimadoBrutoGramas: entity.auEstimadoBrutoGramas ?? (entity as any).props?.auEstimadoBrutoGramas,
      auEstimadoRecuperavelGramas: entity.auEstimadoRecuperavelGramas ?? (entity as any).props?.auEstimadoRecuperavelGramas,
      taxaServicoEmGramas: entity.taxaServicoEmGramas ?? (entity as any).props?.taxaServicoEmGramas,
      auLiquidoParaClienteGramas: entity.auLiquidoParaClienteGramas ?? (entity as any).props?.auLiquidoParaClienteGramas,
      status: status as any,
      dataAnaliseConcluida: entity.dataAnaliseConcluida || (entity as any).props?.dataAnaliseConcluida,
      dataAprovacaoCliente: entity.dataAprovacaoCliente || (entity as any).props?.dataAprovacaoCliente,
      dataFinalizacaoRecuperacao: entity.dataFinalizacaoRecuperacao || (entity as any).props?.dataFinalizacaoRecuperacao,
      observacoes: entity.observacoes || (entity as any).props?.observacoes,
      ordemDeRecuperacaoId: entity.ordemDeRecuperacaoId || (entity as any).props?.ordemDeRecuperacaoId,
      metalType: entity.metalType || (entity as any).props?.metalType,
      isWriteOff: entity.isWriteOff ?? (entity as any).props?.isWriteOff ?? false,
    };
  }

  static toResponseDto(entity: ChemicalAnalysisEntity, extra?: any): any {
    return {
      id: entity.id,
      organizationId: entity.organizationId,
      clienteId: entity.clienteId,
      clientName: extra?.clientName || extra?.cliente?.name,
      numeroAnalise: entity.numeroAnalise,
      dataEntrada: entity.dataEntrada,
      descricaoMaterial: entity.descricaoMaterial,
      volumeOuPesoEntrada: entity.volumeOuPesoEntrada,
      unidadeEntrada: entity.unidadeEntrada,
      resultadoAnaliseValor: entity.resultadoAnaliseValor,
      unidadeResultado: entity.unidadeResultado,
      percentualQuebra: entity.percentualQuebra,
      taxaServicoPercentual: entity.taxaServicoPercentual,
      teorRecuperavel: entity.teorRecuperavel,
      auEstimadoBrutoGramas: entity.auEstimadoBrutoGramas,
      auEstimadoRecuperavelGramas: entity.auEstimadoRecuperavelGramas,
      taxaServicoEmGramas: entity.taxaServicoEmGramas,
      auLiquidoParaClienteGramas: entity.auLiquidoParaClienteGramas,
      status: entity.statusValue,
      dataAnaliseConcluida: entity.dataAnaliseConcluida,
      dataAprovacaoCliente: entity.dataAprovacaoCliente,
      dataFinalizacaoRecuperacao: entity.dataFinalizacaoRecuperacao,
      observacoes: entity.observacoes,
      ordemDeRecuperacaoId: entity.ordemDeRecuperacaoId,
      metalType: entity.metalType,
      isWriteOff: entity.isWriteOff,
      cliente: extra?.cliente,
      media: extra?.media || [],
      metalCredit: extra?.metalCredit,
      recoveryOrderAsResidue: extra?.recoveryOrderAsResidue ?? null,
      dataCriacao: entity.dataCriacao,
      dataAtualizacao: entity.dataAtualizacao,
    };
  }
}
