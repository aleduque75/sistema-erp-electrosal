export enum TipoContaContabilPrisma {
  ATIVO = "ATIVO",
  PASSIVO = "PASSIVO",
  PATRIMONIO_LIQUIDO = "PATRIMONIO_LIQUIDO",
  RECEITA = "RECEITA",
  DESPESA = "DESPESA",
}

export interface ContaContabil {
  id: string;
  nome: string;
  codigo: string;
}

export interface ContaCorrente {
  id: string;
  nome: string;
}

export interface Transacao {
  id: string;
  descricao: string | null;
  valor: number;
  tipo: 'CREDITO' | 'DEBITO';
  dataHora: string;
  contaContabil: ContaContabil | null;
  contaCorrente: ContaCorrente | null;
}
