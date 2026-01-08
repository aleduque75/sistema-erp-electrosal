import { TipoMetal } from '@sistema-erp-electrosal/core';

export interface MetalCreditWithClientNameDto {
  id: string;
  clientId: string;
  chemicalAnalysisId: string;
  metalType: TipoMetal;
  grams: number;
  date: Date;
  organizationId: string;
  clientName: string;
  status: string;
}
