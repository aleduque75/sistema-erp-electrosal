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
