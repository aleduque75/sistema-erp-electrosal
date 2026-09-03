import { ChemicalAnalysisEntity } from '../entities/chemical-analysis.entity';

export interface ChemicalAnalysesFilters {
  status?: string | string[];
  clienteId?: string;
  metalType?: string;
  dataInicio?: Date;
  dataFim?: Date;
  numeroAnalise?: string;
}

export abstract class ChemicalAnalysesRepository {
  abstract create(entity: ChemicalAnalysisEntity, tx?: any): Promise<ChemicalAnalysisEntity>;

  abstract save(entity: ChemicalAnalysisEntity, tx?: any): Promise<ChemicalAnalysisEntity>;

  abstract findById(id: string, organizationId: string, tx?: any): Promise<ChemicalAnalysisEntity | null>;

  abstract findByIdWithDetails(id: string, organizationId: string, tx?: any): Promise<any | null>;

  abstract findByNumeroAnalise(numeroAnalise: string, organizationId: string, tx?: any): Promise<ChemicalAnalysisEntity | null>;

  abstract findAll(organizationId: string, filters?: ChemicalAnalysesFilters, tx?: any): Promise<any[]>;

  abstract findAnalisesAprovadasSemOrdem(organizationId: string, clienteId?: string, tx?: any): Promise<any[]>;

  abstract delete(id: string, organizationId: string, tx?: any): Promise<void>;

  abstract executeInTransaction<T>(fn: (tx: any) => Promise<T>): Promise<T>;
}
