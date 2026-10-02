import api from "@/lib/api";
import { AccountsReceivable } from "@/types/accounts-rec";

export async function getAccountsReceivable(status?: string): Promise<AccountsReceivable[]> {
  const params = status ? { status } : {};
  const response = await api.get("/accounts-rec", { params });
  return response.data;
}

export interface SplitInstallmentItem {
  amount: number;
  dueDate: string;
  description?: string;
}

export async function splitAccountRec(
  id: string,
  installments: SplitInstallmentItem[],
): Promise<{ message: string; accounts: any[] }> {
  const response = await api.post(`/accounts-rec/${id}/split`, { installments });
  return response.data;
}
