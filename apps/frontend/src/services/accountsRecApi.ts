import api from "@/lib/api";
import { AccountsReceivable } from "@/types/accounts-rec";

export async function getAccountsReceivable(status?: string): Promise<AccountsReceivable[]> {
  const params = status ? { status } : {};
  const response = await api.get("/accounts-rec", { params });
  return response.data;
}
