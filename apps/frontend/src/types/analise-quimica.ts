import { StatusAnaliseQuimica } from '@sistema-erp-electrosal/core';

export interface AnaliseQuimica {
  id: string;
  numeroAnalise: string;
  dataEntrada: string;
  descricaoMaterial: string;
  status: StatusAnaliseQuimica;
  cliente?: {
    name: string;
  };
  // Adicione outros campos que possam ser úteis
  resultado?: any; // Pode ser um objeto mais complexo
  pdfUrl?: string;
}
