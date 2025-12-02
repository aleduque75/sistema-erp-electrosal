import { TipoMetal } from '../../enums/tipo-metal.enum';

export interface FiltrosRecoveryOrder {
  metalType?: TipoMetal;
  startDate?: string;
  endDate?: string;
  orderNumber?: string;
}
