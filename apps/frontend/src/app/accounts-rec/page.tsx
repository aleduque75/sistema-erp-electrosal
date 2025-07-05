// apps/frontend/src/app/accounts-rec/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import Link from "next/link"; // Mantido caso queira linkar para detalhes no futuro
import api from "../../lib/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"; // Para o filtro de pesquisa
import {
  Search,
  CheckCircle2,
  XCircle,
  DollarSign,
  Edit,
  Trash2,
} from "lucide-react"; // Ícones
import { toast } from "sonner"; // Para notificações

// Importe o FormCombobox (componente customizado para selects com pesquisa)
import { FormCombobox } from "@/components/FormCombobox";

// Importar componentes do Dialog para o modal de recebimento
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface AccountRec {
  id: string;
  description: string;
  amount: number;
  dueDate: string; // Virá como string, formataremos
  receiveDate?: string; // Opcional
  received: boolean;
  receivedAt?: string; // Opcional
}

interface AccountRec {
  id: string;
  description: string;
  amount: number;
  dueDate: string;
  receiveDate?: string;
  received: boolean;
  receivedAt?: string;
}

interface ContaCorrente {
  id: string;
  numeroConta: string;
  moeda: string;
  saldo: number;
  deletedAt?: string | null; // <--- ADICIONE ESTA PROPRIEDADE
}

export default function AccountsRecPage() {
  const { user, loading } = useAuth();
  const [accountsRec, setAccountsRec] = useState<AccountRec[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isFetchingAccountsRec, setIsFetchingAccountsRec] = useState(true);
  const [searchTerm, setSearchTerm] = useState(""); // Para o filtro de pesquisa
  const [inputValue, setInputValue] = useState(""); // Para debounce do input de pesquisa

  // Estados para o modal de recebimento
  const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false);
  const [selectedAccountRecToReceive, setSelectedAccountRecToReceive] =
    useState<AccountRec | null>(null);
  const [contaCorrenteToReceiveId, setContaCorrenteToReceiveId] = useState<
    string | null
  >(null);
  const [receivedAtDate, setReceivedAtDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [isReceivingPayment, setIsReceivingPayment] = useState(false);
  const [contasCorrentesAtivas, setContasCorrentesAtivas] = useState<
    ContaCorrente[]
  >([]);

  // Debounce para o termo de pesquisa (roda a busca após o usuário parar de digitar)
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      setSearchTerm(inputValue);
    }, 500); // 500ms de atraso
    return () => clearTimeout(delayDebounceFn);
  }, [inputValue]);

  // Carrega a lista de Contas a Receber e as Contas Correntes ativas quando o usuário ou termo de pesquisa mudam
  useEffect(() => {
    if (!loading) {
      // Garante que o useAuth terminou de carregar
      if (!user) {
        // Se não tem usuário, exibe erro e impede carregamento
        setError("Por favor, faça login para visualizar as contas a receber.");
        setIsFetchingAccountsRec(false); // Para de mostrar "Carregando..."
      } else {
        // Se autenticado, busca os dados
        fetchAccountsRec(searchTerm);
        fetchContasCorrentesAtivas(); // Busca contas correntes para o modal
      }
    }
  }, [user, loading, searchTerm]);

  const fetchAccountsRec = async (term: string = "") => {
    setIsFetchingAccountsRec(true);
    const accessToken = localStorage.getItem("accessToken");
    if (!accessToken) {
      setError(
        "Token de acesso não encontrado. Por favor, faça login novamente."
      );
      setIsFetchingAccountsRec(false);
      return;
    }

    try {
      const response = await api.get("/accounts-rec", {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: { search: term }, // Passa o termo de pesquisa para o backend
      });
      setAccountsRec(
        response.data.map((rec: any) => ({
          ...rec,
          amount: parseFloat(rec.amount), // Garante que o valor é float
        }))
      );
      setError(null);
    } catch (err: any) {
      console.error("Erro ao carregar contas a receber:", err);
      const errorMessage =
        err.response?.data?.message ||
        "Não foi possível carregar as contas a receber.";
      setError(errorMessage); // Exibe erro na página
      toast.error(errorMessage); // Exibe erro no toast
    } finally {
      setIsFetchingAccountsRec(false);
    }
  };

  const fetchContasCorrentesAtivas = async () => {
    const accessToken = localStorage.getItem("accessToken");
    if (!accessToken) return;
    try {
      const response = await api.get("/contas-correntes", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setContasCorrentesAtivas(
        response.data
          .filter((conta: ContaCorrente) => !conta.deletedAt)
          .map((conta: any) => ({
            ...conta,
            saldo: parseFloat(conta.saldo),
          }))
      );
    } catch (err: any) {
      console.error("Erro ao carregar contas correntes:", err);
      toast.error("Erro ao carregar contas correntes para o recebimento.");
    }
  };

  // Funções de formatação
  const formatCurrency = (value: number) => {
    return value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };
  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString("pt-BR");
    } catch (e) {
      return dateString;
    }
  };

  // Função para abrir o modal de recebimento
  const openReceiveModal = (accountRec: AccountRec) => {
    setSelectedAccountRecToReceive(accountRec);
    setContaCorrenteToReceiveId(null); // Reseta a seleção da CC
    setReceivedAtDate(new Date().toISOString().split("T")[0]); // Data atual no formato YYYY-MM-DD
    setIsReceiveModalOpen(true);
  };

  // Função para lidar com o recebimento do pagamento
  const handleReceivePayment = async () => {
    if (!selectedAccountRecToReceive || !contaCorrenteToReceiveId) {
      toast.error("Selecione uma conta a receber e uma conta corrente.");
      return;
    }
    setIsReceivingPayment(true);
    const accessToken = localStorage.getItem("accessToken");
    if (!accessToken) {
      toast.error("Token de acesso não encontrado. Faça login novamente.");
      setIsReceivingPayment(false);
      return;
    }

    try {
      const dateToSend = new Date(receivedAtDate);
      if (isNaN(dateToSend.getTime())) {
        // Garante que a data é válida
        toast.error("Data de recebimento inválida.");
        setIsReceivingPayment(false);
        return;
      }

      await api.patch(
        `/accounts-rec/${selectedAccountRecToReceive.id}/receive`,
        {
          receivedAt: dateToSend.getTime(), // <--- MUDANÇA CRÍTICA: ENVIA O TIMESTAMP (número)
          contaCorrenteId: contaCorrenteToReceiveId,
        },
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      toast.success("Pagamento recebido com sucesso!");
      setIsReceiveModalOpen(false);
      fetchAccountsRec(searchTerm);
    } catch (err: any) {
      console.error("Erro ao receber pagamento:", err);
      const errorMessage =
        err.response?.data?.message ||
        "Não foi possível registrar o recebimento.";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsReceivingPayment(false);
    }
  };

  // Função de exclusão
  const handleDeleteAccountRec = async (id: string) => {
    const confirmDelete = window.confirm(
      "Tem certeza que deseja excluir esta conta a receber? Esta ação é irreversível."
    );
    if (!confirmDelete) return;

    const accessToken = localStorage.getItem("accessToken");
    if (!accessToken) {
      toast.error("Token de acesso não encontrado. Faça login novamente.");
      return;
    }

    try {
      await api.delete(`/accounts-rec/${id}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      toast.success("Conta a receber excluída com sucesso!");
      fetchAccountsRec(searchTerm); // Recarrega a lista
    } catch (err: any) {
      console.error("Erro ao excluir conta a receber:", err);
      const errorMessage =
        err.response?.data?.message ||
        "Não foi possível excluir a conta a receber.";
      toast.error(errorMessage);
    }
  };

  // Renderização condicional para carregamento ou autenticação
  if (loading || isFetchingAccountsRec) {
    return (
      <p className="text-center text-lg mt-10">
        Carregando contas a receber...
      </p>
    );
  }

  // Se o carregamento terminou e não há usuário, mostra mensagem de login
  if (!user) {
    return (
      <p className="text-center text-lg mt-10 text-red-500">
        Por favor, faça login para visualizar as contas a receber.
      </p>
    );
  }

  return (
    // Card principal que ocupa a largura total em telas pequenas e limita em telas grandes
    <Card className="mx-auto my-8 p-4 sm:p-6 shadow-lg rounded-lg bg-fuchsia-200/60 dark:bg-gray-900 text-gray-900 dark:text-gray-50 max-w-screen-xl w-full">
      <CardHeader className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
        <CardTitle className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100">
          Contas a Receber
        </CardTitle>
        {/* Container para o campo de pesquisa e o botão (se houver) */}
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          {/* Campo de Pesquisa */}
          <div className="relative flex-grow">
            {" "}
            {/* flex-grow para o input preencher espaço */}
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
            <Input
              type="text"
              placeholder="Pesquisar por descrição..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="pl-10 pr-4 py-2 w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          {/* Botão para Criar Nova Conta a Receber - Opcional, se houver criação manual */}
          {/* <Link href="/accounts-rec/create">
            <Button className="flex items-center gap-2 px-4 py-2 text-base md:text-lg bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 w-full sm:w-auto">
              <PlusCircle className="w-5 h-5" /> Nova Conta a Receber
            </Button>
          </Link> */}
        </div>
      </CardHeader>
      <CardContent>
        {error && <p className="text-red-500 mb-4 text-center">{error}</p>}

        {accountsRec.length === 0 && !error ? (
          <p className="text-center text-gray-600 text-lg mt-8 dark:text-gray-400">
            Nenhuma conta a receber encontrada.
          </p>
        ) : (
          // Div para a tabela ser rolavel horizontalmente em telas pequenas
          <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
            <Table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <TableHeader className="bg-fuchsia-200/50 dark:bg-gray-800">
                <TableRow>
                  <TableHead className="px-4 py-2 text-left text-xs sm:text-sm font-medium text-gray-700 uppercase tracking-wider dark:text-gray-300">
                    Descrição
                  </TableHead>
                  <TableHead className="px-4 py-2 text-left text-xs sm:text-sm font-medium text-gray-700 uppercase tracking-wider dark:text-gray-300">
                    Valor
                  </TableHead>
                  <TableHead className="px-4 py-2 text-left text-xs sm:text-sm font-medium text-gray-700 uppercase tracking-wider dark:text-gray-300">
                    Vencimento
                  </TableHead>
                  <TableHead className="px-4 py-2 text-left text-xs sm:text-sm font-medium text-gray-700 uppercase tracking-wider dark:text-gray-300">
                    Recebido Em
                  </TableHead>
                  <TableHead className="px-4 py-2 text-center text-xs sm:text-sm font-medium text-gray-700 uppercase tracking-wider dark:text-gray-300">
                    Status
                  </TableHead>
                  <TableHead className="px-4 py-2 text-center text-xs sm:text-sm font-medium text-gray-700 uppercase tracking-wider">
                    Ações
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="bg-transparent dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {accountsRec.map((rec) => (
                  <TableRow
                    key={rec.id}
                    className="hover:bg-gray-50/50 transition-colors duration-150 dark:hover:bg-gray-800"
                  >
                    <TableCell className="px-4 py-2 whitespace-normal text-sm font-medium text-gray-900 dark:text-gray-100 max-w-[150px] sm:max-w-none">
                      {rec.description}
                    </TableCell>
                    <TableCell className="px-4 py-2 whitespace-nowrap text-sm text-gray-800 font-semibold dark:text-gray-200">
                      {formatCurrency(rec.amount)}
                    </TableCell>
                    <TableCell className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(rec.dueDate)}
                    </TableCell>
                    <TableCell className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {rec.receivedAt ? formatDate(rec.receivedAt) : "-"}
                    </TableCell>
                    <TableCell className="px-4 py-2 whitespace-nowrap text-center">
                      {rec.received ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-700 dark:text-green-100">
                          <CheckCircle2 className="w-4 h-4 mr-1" /> Recebido
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-700 dark:text-red-100">
                          <XCircle className="w-4 h-4 mr-1" /> Pendente
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="px-4 py-2 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-center items-center space-x-1 sm:space-x-2">
                        {!rec.received && (
                          <Button
                            variant="ghost"
                            size="icon" // Botões menores em mobile
                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
                            onClick={() => openReceiveModal(rec)}
                            aria-label={`Receber pagamento de ${rec.description}`}
                          >
                            <DollarSign className="w-4 h-4 sm:w-5 sm:h-5" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-yellow-600 hover:text-yellow-800 dark:text-yellow-400 dark:hover:text-yellow-200"
                          onClick={() =>
                            toast.info("Funcionalidade de Edição em construção")
                          }
                          aria-label={`Editar ${rec.description}`}
                        >
                          <Edit className="w-4 h-4 sm:w-5 sm:h-5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200"
                          onClick={() => handleDeleteAccountRec(rec.id)}
                          aria-label={`Excluir ${rec.description}`}
                        >
                          <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      {/* Modal de Recebimento de Pagamento */}
      <Dialog open={isReceiveModalOpen} onOpenChange={setIsReceiveModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-xl sm:text-2xl">
              Registrar Recebimento
            </DialogTitle>
            <DialogDescription className="text-sm sm:text-base">
              Confirme o recebimento da parcela:
              <br />
              <strong>{selectedAccountRecToReceive?.description}</strong>
              <br />
              Valor:{" "}
              <strong>
                {formatCurrency(selectedAccountRecToReceive?.amount || 0)}
              </strong>
              <br />
              Vencimento:{" "}
              <strong>
                {formatDate(selectedAccountRecToReceive?.dueDate || "")}
              </strong>
            </DialogDescription>
          </DialogHeader>
          {/* Formulário do Modal com Grid Responsivo */}
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
              <Label htmlFor="contaCorrente" className="sm:text-right">
                Recebido em:
              </Label>
              <div className="col-span-1 sm:col-span-3">
                {" "}
                {/* col-span-3 para o combobox */}
                <FormCombobox
                  label="" // Label fornecida pelo Label acima
                  options={contasCorrentesAtivas.map((conta) => ({
                    value: conta.id,
                    label: `${conta.numeroConta} (${conta.moeda} ${conta.saldo.toFixed(2)})`,
                  }))}
                  value={contaCorrenteToReceiveId}
                  onValueChange={setContaCorrenteToReceiveId}
                  placeholder="Selecione a Conta Corrente"
                  emptyMessage="Nenhuma conta corrente encontrada."
                  searchPlaceholder="Pesquisar conta..."
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
              <Label htmlFor="receivedAtDate" className="sm:text-right">
                Data do Recebimento:
              </Label>
              <Input
                id="receivedAtDate"
                type="date"
                value={receivedAtDate}
                onChange={(e) => setReceivedAtDate(e.target.value)}
                className="col-span-1 sm:col-span-3"
              />
            </div>
          </div>
          <DialogFooter className="flex flex-col sm:flex-row sm:justify-end gap-2">
            {" "}
            {/* Botões responsivos */}
            <Button
              variant="outline"
              onClick={() => setIsReceiveModalOpen(false)}
              disabled={isReceivingPayment}
              className="w-full sm:w-auto"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleReceivePayment}
              disabled={isReceivingPayment || !contaCorrenteToReceiveId}
              className="w-full sm:w-auto"
            >
              {isReceivingPayment ? "Registrando..." : "Confirmar Recebimento"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
