import { AnaliseQuimica } from '@sistema-erp-electrosal/core';

export interface AnaliseQuimicaWithClientNameDto extends AnaliseQuimica {
  clientName?: string;
}
