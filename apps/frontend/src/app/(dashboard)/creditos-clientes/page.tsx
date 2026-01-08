"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";
import { toast } from "sonner";
import { ColumnDef } from "@tanstack/react-table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, X } from "lucide-react";
import Link from "next/link";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { MetalCredit } from "@sistema-erp-electrosal/core";
import { MetalCreditWithUsageDto } from "@/types/metal-credit-with-usage.dto";
import { Button } from "@/components/ui/button";
import { MetalCreditDetailsModal } from "@/components/metal-credits/MetalCreditDetailsModal";
import { PayWithCashModal } from "@/components/metal-credits/PayWithCashModal";
import { EditMetalCreditModal } from "@/components/metal-credits/EditMetalCreditModal";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { DateRange } from "react-day-picker";
import { isWithinInterval, startOfDay, endOfDay } from "date-fns";

const formatGrams = (value?: number) => {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  }).format(value || 0) + " g";
};

const formatDate = (dateString?: string) => {
  if (!dateString) return "";
  return new Date(dateString).toLocaleDateString("pt-BR");
};

export default function CreditosClientesPage() {
  const { user, loading } = useAuth();
  const [credits, setCredits] = useState<MetalCreditWithUsageDto[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [isDetailsModalOpen, setDetailsModalOpen] = useState(false);
  const [isPayWithCashModalOpen, setPayWithCashModalOpen] = useState(false);
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [selectedCredit, setSelectedCredit] = useState<MetalCreditWithUsageDto | null>(null);

  // Filtros
  const [metalTypeFilter, setMetalTypeFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

  const fetchData = async () => {
    setIsFetching(true);
    try {
      const creditsResponse = await api.get<MetalCreditWithUsageDto[]>("/metal-credits");
      setCredits(creditsResponse.data);
    } catch (err) {
      toast.error("Falha ao carregar dados.");
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    if (user && !loading) fetchData();
  }, [user, loading]);

  const handleViewDetails = (credit: MetalCreditWithUsageDto) => {
    setSelectedCredit(credit);
    setDetailsModalOpen(true);
  };

  const handlePayWithCash = (credit: MetalCreditWithUsageDto) => {
    setSelectedCredit(credit);
    setPayWithCashModalOpen(true);
  };

  const handleEdit = (credit: MetalCreditWithUsageDto) => {
    setSelectedCredit(credit);
    setEditModalOpen(true);
  };

  const filteredCredits = credits.filter((credit) => {
    const matchesMetalType = metalTypeFilter === "ALL" || credit.metalType === metalTypeFilter;
    const matchesStatus = statusFilter === "ALL" || credit.status === statusFilter;
    
    let matchesDate = true;
    if (dateRange?.from) {
      const creditDate = new Date(credit.date);
      const start = startOfDay(dateRange.from);
      const end = dateRange.to ? endOfDay(dateRange.to) : endOfDay(dateRange.from);
      matchesDate = isWithinInterval(creditDate, { start, end });
    }

    return matchesMetalType && matchesStatus && matchesDate;
  });

  const clearFilters = () => {
    setMetalTypeFilter("ALL");
    setStatusFilter("ALL");
    setDateRange(undefined);
  };

  const columns: ColumnDef<MetalCreditWithUsageDto>[] = [
    {
      accessorKey: "clientName",
      header: "Cliente",
      cell: ({ row }) => {
        return row.original.clientName || "Cliente não encontrado";
      },
    },
    {
      accessorKey: "metalType",
      header: "Tipo de Metal",
      cell: ({ row }) => {
        return row.original.metalType;
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const statusMap: Record<string, string> = {
          PENDING: "Pendente",
          PARTIALLY_PAID: "Pago Parcialmente",
          PAID: "Pago",
          CANCELED: "Cancelado",
        };
        return statusMap[row.original.status] || row.original.status;
      },
    },
    {
      accessorKey: "grams",
      header: "Saldo (g)",
      cell: ({ row }) => formatGrams(Number(row.original.grams)),
    },
    {
      accessorKey: "date",
      header: "Data do Crédito",
      cell: ({ row }) => {
        return formatDate(row.original.date as unknown as string);
      },
    },
    {
      id: "actions",
      header: "Ações",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Abrir menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleViewDetails(row.original)}>
              Visualizar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleEdit(row.original)}>
              Editar
            </DropdownMenuItem>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>Pagar</DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem asChild>
                  <Link href={`/metal-payments/pay-client?clientId=${row.original.clientId}&metalType=${row.original.metalType}&grams=${row.original.grams}`}>
                    Pagar com Metal
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handlePayWithCash(row.original)}>
                  Pagar com Dinheiro
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  if (loading) return <p className="text-center p-10">Carregando...</p>;
  if (!user)
    return <p className="text-center p-10">Faça login para continuar.</p>;

  return (
    <>
      <Card className="mx-auto my-8">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Créditos de Metal dos Clientes</CardTitle>
          </div>
          <div className="flex flex-wrap gap-4 mt-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium">Período</label>
              <DateRangePicker date={dateRange} onDateChange={setDateRange} />
            </div>
            <div className="flex flex-col gap-1.5 min-w-[150px]">
              <label className="text-xs font-medium">Tipo de Metal</label>
              <Select value={metalTypeFilter} onValueChange={setMetalTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Metal" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todos</SelectItem>
                  <SelectItem value="AU">Ouro (AU)</SelectItem>
                  <SelectItem value="AG">Prata (AG)</SelectItem>
                  <SelectItem value="RH">Ródio (RH)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5 min-w-[180px]">
              <label className="text-xs font-medium">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todos</SelectItem>
                  <SelectItem value="PENDING">Pendente</SelectItem>
                  <SelectItem value="PARTIALLY_PAID">Pago Parcialmente</SelectItem>
                  <SelectItem value="PAID">Pago</SelectItem>
                  <SelectItem value="CANCELED">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              {(metalTypeFilter !== "ALL" || statusFilter !== "ALL" || dateRange) && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="h-10">
                  <X className="mr-2 h-4 w-4" />
                  Limpar Filtros
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isFetching ? (
            <p className="text-center p-10">Buscando dados...</p>
          ) : (
            <DataTable
              columns={columns}
              data={filteredCredits}
              filterColumnId="clientName"
              filterPlaceholder="Pesquisar por cliente..."
            />
          )}
        </CardContent>
      </Card>

      <MetalCreditDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setDetailsModalOpen(false)}
        credit={selectedCredit}
      />

      <PayWithCashModal
        isOpen={isPayWithCashModalOpen}
        onClose={() => setPayWithCashModalOpen(false)}
        credit={selectedCredit}
      />

      <EditMetalCreditModal
        isOpen={isEditModalOpen}
        onClose={() => setEditModalOpen(false)}
        credit={selectedCredit}
      />
    </>
  );
}
