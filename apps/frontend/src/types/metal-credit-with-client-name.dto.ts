import { MetalCredit } from '@sistema-erp-electrosal/core';

export interface MetalCreditWithClientNameDto extends MetalCredit {
  clientName: string;
}
