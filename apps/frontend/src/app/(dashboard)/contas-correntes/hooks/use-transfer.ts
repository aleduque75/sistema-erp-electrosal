import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";
import { toast } from "sonner";

interface Account {
  id: string;
  nome: string;
}

export function useTransfer(transferType: "BRL" | "GOLD", currentAccountId: string) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAccounts = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await api.get("/contas-correntes", {
        params: { moeda: transferType === "BRL" ? "BRL" : "XAU" },
      });
      // Filter out the current account from the list
      const filteredAccounts = response.data.filter(
        (acc: Account) => acc.id !== currentAccountId
      );
      setAccounts(filteredAccounts);
    } catch (error) {
      toast.error("Falha ao buscar contas.");
    } finally {
      setIsLoading(false);
    }
  }, [transferType, currentAccountId]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const performTransfer = async (data: {
    sourceAccountId: string; // Renomear
    destinationAccountId: string; // Renomear
    amount?: number;
    goldAmount?: number;
    quotation?: number;
    description?: string;
    mediaIds?: string[];
    dataHora?: string;
  }) => {
    try {
      const endpoint = transferType === "BRL" ? "/transacoes/transfer" : "/metal-accounts/transfer-gold";
      await api.post(endpoint, data);
      toast.success("Transferência realizada com sucesso!");
    } catch (error: any) { // Adicionar any para acessar response
      toast.error("Falha ao realizar transferência.", {
        description: error.response?.data?.message || "Ocorreu um erro desconhecido",
      });
    }
  };

  return { accounts, isLoading, performTransfer };
}