export interface AccountsReceivable {
  id: string;
  saleId?: string;
  description: string;
  amount: number; // Decimal no backend, number no frontend
  dueDate: string; // DateTime no backend, string no frontend
  received: boolean;
  receivedAt?: string; // DateTime no backend, string no frontend
  createdAt: string; // DateTime no backend, string no frontend
  updatedAt: string; // DateTime no backend, string no frontend
  contaCorrenteId?: string;
  organizationId: string;
  transacaoId?: string;
  externalId?: string;
  // Relacionamentos (contaCorrente, organization, sale, transacao, saleInstallments)
  // Podem ser adicionados conforme a necessidade de serem usados no frontend
}