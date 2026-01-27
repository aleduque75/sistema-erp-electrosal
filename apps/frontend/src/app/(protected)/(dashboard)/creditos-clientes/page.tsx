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
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, X, User, Calendar, Scale, Eye, Edit, CreditCard, Wallet, Coins } from "lucide-react";
import Link from "next/link";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { MetalCreditWithUsageDto } from "@/types/metal-credit-with-usage.dto";
import { Button } from "@/components/ui/button";
import { MetalCreditDetailsModal } from "@/components/metal-credits/MetalCreditDetailsModal";
import { PayWithCashModal } from "@/components/metal-credits/PayWithCashModal";
import { EditMetalCreditModal } from "@/components/metal-credits/EditMetalCreditModal";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { DateRange } from "react-day-picker";
import { isWithinInterval, startOfDay, endOfDay } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

const formatGrams = (value?: number) => {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  }).format(value || 0) + " g";
};

const formatDate = (dateString?: string) => {
  if (!dateString) return "";
  return new Date(dateString).toLocaleDateString("pt-BR", { timeZone: 'UTC' });
};

// Status Configuration
const statusConfig: Record<string, { label: string; color: string; dot: string }> = {
  PENDING: { label: 'Disponível', color: 'bg-emerald-100 text-emerald-800 border-emerald-200', dot: 'bg-emerald-500' },
  PARTIALLY_PAID: { label: 'Parcialmente Usado', color: 'bg-amber-100 text-amber-800 border-amber-200', dot: 'bg-amber-500' },
  PAID: { label: 'Esgotado / Pago', color: 'bg-slate-100 text-slate-600 border-slate-200', dot: 'bg-slate-400' },
  CANCELED: { label: 'Cancelado', color: 'bg-red-100 text-red-800 border-red-200', dot: 'bg-red-500' },
};

export default function CreditosClientesPage() {
  const { user, isLoading } = useAuth();
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
  const [hideZeroed, setHideZeroed] = useState(true);

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
    if (user && !isLoading) fetchData();
  }, [user, isLoading]);

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
    const isNotZeroed = !hideZeroed || Number(credit.grams) > 0.0001;
    
    let matchesDate = true;
    if (dateRange?.from) {
      const creditDate = new Date(credit.date);
      const start = startOfDay(dateRange.from);
      const end = dateRange.to ? endOfDay(dateRange.to) : endOfDay(dateRange.from);
      matchesDate = isWithinInterval(creditDate, { start, end });
    }

    return matchesMetalType && matchesStatus && matchesDate && isNotZeroed;
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
      cell: ({ row }) => (
        <div className="font-medium">{row.original.clientName || "Cliente não encontrado"}</div>
      ),
    },
    {
      accessorKey: "metalType",
      header: "Metal",
      cell: ({ row }) => (
        <Badge variant="outline">{row.original.metalType}</Badge>
      ),
    },
    {
      accessorKey: "grams",
      header: "Saldo (g)",
      cell: ({ row }) => (
        <span className="font-bold">{formatGrams(Number(row.original.grams))}</span>
      ),
    },
    {
      accessorKey: "date",
      header: "Data",
      cell: ({ row }) => formatDate(row.original.date as unknown as string),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const statusInfo = statusConfig[row.original.status] || { label: row.original.status, color: 'bg-gray-100', dot: 'bg-gray-400' };
        return (
          <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.color} border`}>
             <div className={`w-1.5 h-1.5 rounded-full mr-1.5 ${statusInfo.dot}`} />
             {statusInfo.label}
          </div>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const credit = row.original;
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
              <DropdownMenuItem onClick={() => handleViewDetails(credit)}>
                <Eye className="mr-2 h-4 w-4" /> Visualizar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleEdit(credit)}>
                <Edit className="mr-2 h-4 w-4" /> Editar
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                    <Wallet className="mr-2 h-4 w-4" /> Pagar
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuItem asChild>
                    <Link href={`/metal-payments/pay-client?clientId=${credit.clientId}&metalType=${credit.metalType}&grams=${credit.grams}`}>
                      <CreditCard className="mr-2 h-4 w-4" /> Pagar com Metal
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handlePayWithCash(credit)}>
                    <Coins className="mr-2 h-4 w-4" /> Pagar com Dinheiro
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  if (isLoading) return <p className="text-center p-10">Carregando...</p>;
  if (!user)
    return <p className="text-center p-10">Faça login para continuar.</p>;

  return (
    <div className="max-w-7xl mx-auto py-8 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Créditos de Metal</h1>
          <p className="text-muted-foreground">Gerencie o saldo de metal dos clientes.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center space-x-2 bg-muted/50 p-2 rounded-lg mr-2">
              <Checkbox
                id="hide-zeroed"
                checked={hideZeroed}
                onCheckedChange={(checked) => setHideZeroed(checked as boolean)}
              />
              <Label htmlFor="hide-zeroed" className="text-sm whitespace-nowrap cursor-pointer">Ocultar zerados</Label>
            </div>

            <DateRangePicker date={dateRange} onDateChange={setDateRange} />
            
            <Select value={metalTypeFilter} onValueChange={setMetalTypeFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Metal" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todos Metais</SelectItem>
                  <SelectItem value="AU">Ouro (AU)</SelectItem>
                  <SelectItem value="AG">Prata (AG)</SelectItem>
                  <SelectItem value="RH">Ródio (RH)</SelectItem>
                </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todos Status</SelectItem>
                  <SelectItem value="PENDING">Disponível</SelectItem>
                  <SelectItem value="PARTIALLY_PAID">Parcialmente Usado</SelectItem>
                  <SelectItem value="PAID">Esgotado / Pago</SelectItem>
                  <SelectItem value="CANCELED">Cancelado</SelectItem>
                </SelectContent>
            </Select>

            {(metalTypeFilter !== "ALL" || statusFilter !== "ALL" || dateRange) && (
                <Button variant="ghost" size="icon" onClick={clearFilters} title="Limpar Filtros">
                  <X className="h-4 w-4" />
                </Button>
            )}
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          {isFetching ? (
             <div className="text-center py-12 text-muted-foreground">
                <p>Carregando créditos...</p>
             </div>
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
    </div>
  );
}
