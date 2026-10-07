import api from "@/lib/api";

// Define the structure of the report data based on the backend response
interface ReportEntry {
  id: string;
  supplierName: string;
  dueDate: string;
  description: string;
  billedAmount: number;
  paidAmount: number;
  balance: number;
}

interface ReportSummary {
  totalBilled: number;
  totalPaid: number;
  finalBalance: number;
}

export interface AccountsPayableReport {
  entries: ReportEntry[];
  summary: ReportSummary;
}

// Define the structure of the query parameters
interface GetAccountsPayableReportParams {
  supplierId?: string;
  startDate?: string;
  endDate?: string;
}

export const getAccountsPayableReport = async (
  params: GetAccountsPayableReportParams
): Promise<AccountsPayableReport> => {
  const { data } = await api.get<AccountsPayableReport>("/reports/accounts-payable", {
    params,
  });
  return data;
};

export const getAccountsPayableReportPdf = async (
  params: GetAccountsPayableReportParams
): Promise<Blob> => {
  const response = await api.get("/reports/accounts-payable/pdf", {
    params,
    responseType: "blob",
  });
  return response.data;
};

export interface SingleMetalReport {
  period: { startDate: string; endDate: string };
  priceUsed: number;
  
  totalRecoveredGrams: number;
  totalRecoveredValue: number;

  totalReactionConsumptionGrams: number;
  totalReactionConsumptionValue: number;
  
  totalClientCreditGrams: number;
  totalClientCreditValue: number;
  
  totalResidueGrams: number;
  totalResidueValue: number;
  
  totalRawMaterialsCost: number;
  totalRawMaterialsGrams: number;
  
  totalCommissions: number;
  totalCommissionsGrams: number;

  totalTaggedExpensesBRL: number;
  totalTaggedExpensesGrams: number;

  totalPendingAnalysisGrams: number;
  totalPendingAnalysisValue: number;
  
  netResultGrams: number;
  netResultValue: number;
}

export type FinancialBalanceReport = Record<string, SingleMetalReport>;

export const getFinancialBalanceReport = async (params: { startDate: string; endDate: string; goldPrice?: number; metalType?: string }): Promise<FinancialBalanceReport> => {
  const { data } = await api.get<FinancialBalanceReport>("/reports/financial-balance", {
    params,
  });
  return data;
};

// ==========================================
// 1. RELATÓRIO ANALÍTICO DE DESPESAS
// ==========================================
export interface ExpenseItem {
  id: string;
  dataHora: string;
  descricao: string;
  valor: number;
  goldPrice?: number | null;
  goldAmount?: number | null;
  fornecedorNome?: string | null;
  contaContabilCodigo?: string | null;
  contaContabilNome?: string | null;
  contaCorrenteNome?: string | null;
  status: 'PAGO' | 'PENDENTE';
}

export interface CategorySummary {
  contaContabilId: string;
  codigo: string;
  nome: string;
  totalAmount: number;
  totalGold: number;
  count: number;
  percentage: number;
}

export interface ExpensesReport {
  period: { startDate: string; endDate: string };
  summary: {
    totalAmount: number;
    totalPaid: number;
    totalPaidGold?: number;
    totalPending: number;
    totalPendingGold?: number;
    totalGold: number;
    count: number;
    byCategory: CategorySummary[];
    bySupplier: { name: string; totalAmount: number; count: number }[];
    byAccount: { name: string; totalAmount: number; count: number }[];
  };
  entries: ExpenseItem[];
}

export interface GetExpensesReportParams {
  startDate: string;
  endDate: string;
  contaContabilId?: string;
  fornecedorId?: string;
  contaCorrenteId?: string;
  status?: 'ALL' | 'PAID' | 'PENDING';
  mode?: 'BRL' | 'GOLD';
}

export const getExpensesReport = async (
  params: GetExpensesReportParams
): Promise<ExpensesReport> => {
  const { data } = await api.get<ExpensesReport>("/reports/expenses", {
    params,
  });
  return data;
};

export const getExpensesReportPdf = async (
  params: GetExpensesReportParams
): Promise<Blob> => {
  const response = await api.get("/reports/expenses/pdf", {
    params,
    responseType: "blob",
  });
  return response.data;
};

// ==========================================
// 2. DRE GERENCIAL (DEMONSTRAÇÃO DE RESULTADO)
// ==========================================
export interface DreSubItem {
  id: string;
  codigo: string;
  nome: string;
  valor: number;
  valorAu?: number;
}

export interface DreSection {
  title: string;
  total: number;
  totalAu?: number;
  items: DreSubItem[];
}

export interface DreReport {
  period: { startDate: string; endDate: string; regime: string };
  quotationAu: number;
  receitaBruta: DreSection;
  custosOperacionais: DreSection;
  lucroBruto: { valor: number; valorAu?: number; margem: number };
  despesasOperacionais: DreSection;
  resultadoFinanceiro: DreSection;
  resultadoLiquido: { valor: number; valorAu?: number; margem: number; status: 'LUCRO' | 'PREJUIZO' };
}

export interface GetDreReportParams {
  startDate: string;
  endDate: string;
  regime?: 'CAIXA' | 'COMPETENCIA';
  mode?: 'BRL' | 'GOLD';
}

export const getDreReport = async (
  params: GetDreReportParams
): Promise<DreReport> => {
  const { data } = await api.get<DreReport>("/reports/dre", {
    params,
  });
  return data;
};

export const getDreReportPdf = async (
  params: GetDreReportParams
): Promise<Blob> => {
  const response = await api.get("/reports/dre/pdf", {
    params,
    responseType: "blob",
  });
  return response.data;
};

// ==========================================
// 3. BALANÇO PATRIMONIAL (ATIVO E PASSIVO)
// ==========================================
export interface BalanceSheetItem {
  descricao: string;
  detalhe?: string;
  valor: number;
  valorAu?: number;
}

export interface BalanceSheetSection {
  title: string;
  total: number;
  totalAu?: number;
  items: BalanceSheetItem[];
}

export interface BalanceSheetReport {
  asOfDate: string;
  quotationAu: number;
  quotationAg: number;
  ativo: {
    circulante: BalanceSheetSection;
    naoCirculante: BalanceSheetSection;
    total: number;
    totalAu?: number;
  };
  passivo: {
    circulante: BalanceSheetSection;
    naoCirculante: BalanceSheetSection;
    total: number;
    totalAu?: number;
  };
  patrimonioLiquido: BalanceSheetSection;
  totalPassivoPatrimonioLiquido: number;
  totalPassivoPatrimonioLiquidoAu?: number;
  indicadores: {
    liquidezCorrente: number;
    capitalDeGiro: number;
    capitalDeGiroAu?: number;
  };
}

export interface GetBalanceSheetReportParams {
  asOfDate?: string;
  mode?: 'BRL' | 'GOLD';
}

export const getBalanceSheetReport = async (
  params?: GetBalanceSheetReportParams
): Promise<BalanceSheetReport> => {
  const { data } = await api.get<BalanceSheetReport>("/reports/balance-sheet", {
    params,
  });
  return data;
};

export const getBalanceSheetReportPdf = async (
  params?: GetBalanceSheetReportParams
): Promise<Blob> => {
  const response = await api.get("/reports/balance-sheet/pdf", {
    params,
    responseType: "blob",
  });
  return response.data;
};

