export enum ContaCorrenteType {
  BANCO = 'BANCO',
  FORNECEDOR_METAL = 'FORNECEDOR_METAL',
  EMPRESTIMO = 'EMPRESTIMO',
}

export type ContaCorrenteTypeValue = `${ContaCorrenteType}`;