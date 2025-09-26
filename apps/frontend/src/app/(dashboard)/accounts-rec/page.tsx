"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { toast } from "sonner";
import { MoreHorizontal } from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";

import { AccountsReceivableTable } from "./components/AccountsReceivableTable";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ReceivePaymentForm } from "./components/receive-payment-form";
import { SaleDetailsView } from "../sales/components/SaleDetailsView";
import { formatInTimeZone } from 'date-fns-tz';

// Interfaces
interface AccountRec {
  id: string;
  description: string;
  amount: number;
  dueDate: string;
  received: boolean;
  receivedAt?: string | null;
  sale?: { id: string };
}
// Interface para os detalhes completos da venda
interface SaleDetails {
  id: string;
  orderNumber: string;
  // Adicione todos os outros campos que a SaleDetailsView espera
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    value || 0
  );
const formatDate = (dateString?: string | null) => {
  if (!dateString) return "N/A";
  const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return formatInTimeZone(new Date(dateString), userTimeZone, "dd/MM/yyyy HH:mm");
};

export default function AccountsRecPage() {
  const [accounts, setAccounts] = useState<AccountRec[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [accountsRec, setAccountsRec] = useState<AccountRec[]>([]);
  const [accountToReceive, setAccountToReceive] = useState<AccountRec | null>(
    null
  );

  // Estados para o novo modal de visualização
  const [isViewSaleModalOpen, setIsViewSaleModalOpen] = useState(false);
  const [saleToView, setSaleToView] = useState<SaleDetails | null>(null);

  const fetchAccounts = async () => {
    setIsLoading(true);
    try {
      const response = await api.get("/accounts-rec");
      setAccounts(response.data);
    } catch (err) {
      toast.error("Falha ao buscar contas a receber.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleSavePayment = () => {
    setAccountToReceive(null);
    fetchAccounts();
  };

  // Função para buscar e exibir os detalhes da venda
  const handleViewSale = async (saleId: string) => {
    if (!saleId) return;

    // Mostra um toast de carregamento
    const promise = api.get(`/sales/${saleId}`);
    toast.promise(promise, {
      loading: "Buscando detalhes da venda...",
      success: (response) => {
        setSaleToView(response.data);
        setIsViewSaleModalOpen(true);
        return "Detalhes da venda carregados.";
      },
      error: "Falha ao carregar detalhes da venda.",
    });
  };

  const columns: ColumnDef<AccountRec>[] = [
    {
      accessorKey: "description",
      header: "Descrição",
    },
    {
      accessorKey: "dueDate",
      header: "Vencimento",
      cell: ({ row }) => formatDate(row.original.dueDate),
    },
    {
      accessorKey: "amount",
      header: "Valor",
      cell: ({ row }) => formatCurrency(row.original.amount),
    },
    {
      accessorKey: "received",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant={row.original.received ? "default" : "secondary"}>
          {row.original.received
            ? `Recebido em ${formatDate(row.original.receivedAt!)}`
            : "Pendente"}
        </Badge>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const account = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Abrir menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Ações</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => handleViewSale(account.sale?.id!)}
                disabled={!account.sale}
              >
                Visualizar Venda Original
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {!account.received && (
                <DropdownMenuItem onClick={() => setAccountToReceive(account)}>
                  Registrar Recebimento
                </DropdownMenuItem>
              )}
              <DropdownMenuItem>Editar</DropdownMenuItem>
              <DropdownMenuItem className="text-red-600">
                Deletar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Lista de Contas a Receber</CardTitle>
          <CardDescription>
            Gerencie todas as contas a receber da sua empresa.
          </CardDescription>
        </CardHeader>
        <CardContent>

          <AccountsReceivableTable accountsRec={accounts} />
        </CardContent>
      </Card>

      {/* Modal para Registrar Recebimento */}
      <Dialog
        open={!!accountToReceive}
        onOpenChange={(isOpen) => !isOpen && setAccountToReceive(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Recebimento</DialogTitle>
          </DialogHeader>
          {accountToReceive && (
            <ReceivePaymentForm
              accountRec={accountToReceive}
              onSave={handleSavePayment}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Modal para Visualizar a Venda */}
      <Dialog open={isViewSaleModalOpen} onOpenChange={setIsViewSaleModalOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              Detalhes da Venda - Pedido #{saleToView?.orderNumber}
            </DialogTitle>
          </DialogHeader>
          {saleToView ? (
            <SaleDetailsView sale={saleToView} />
          ) : (
            <p>Carregando...</p>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
