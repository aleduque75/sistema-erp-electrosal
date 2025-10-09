export interface Transacao {
  id: string;
  descricao: string;
  dataHora: string;
  valor: number;
  goldAmount?: number;
  contaCorrenteId?: string;
  contaCorrente?: {
    nome: string;
  };
  AccountRec?: {
    sale?: {
      goldPrice?: number;
    };
  };
  status?: 'ATIVA' | 'AJUSTADA' | 'CANCELADA';
}
