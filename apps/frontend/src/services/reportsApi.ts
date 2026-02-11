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
