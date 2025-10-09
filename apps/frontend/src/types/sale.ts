import { Transacao } from './transacao';

export interface Sale {
  id: string;
  orderNumber: number;
  goldPrice?: number;
  accountsRec?: {
    id: string;
    transacao?: Transacao;
  }[];
}
