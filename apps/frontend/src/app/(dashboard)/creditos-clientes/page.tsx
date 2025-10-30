"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";
import { toast } from "sonner";
import { ColumnDef } from "@tanstack/react-table";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { MetalCredit } from "@sistema-erp-electrosal/core";
import { MetalCreditWithUsageDto } from "@/types/metal-credit-with-usage.dto";
import { Button } from "@/components/ui/button";
import { EyeIcon } from "lucide-react";
import { MetalCreditDetailsModal } from "@/components/metal-credits/MetalCreditDetailsModal";

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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCredit, setSelectedCredit] = useState<MetalCreditWithUsageDto | null>(null);

  const fetchData = async () => {
    setIsFetching(true);
    try {
      const creditsResponse = await api.get<MetalCreditWithUsageDto[]>("/metal-credits");
      console.log("[DEBUG] Raw credits data from backend:", creditsResponse.data);
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
    setIsModalOpen(true);
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
        console.log("[DEBUG] Frontend metalType:", row.original.props.metalType);
        return row.original.props.metalType;
      },
    },
    {
      accessorKey: "grams",
      header: "Saldo (g)",
      cell: ({ row }) => formatGrams(Number(row.original.props.grams)),
    },
    {
      accessorKey: "date",
      header: "Data do Crédito",
      cell: ({ row }) => {
        console.log("[DEBUG] Frontend date:", row.original.props.date);
        return formatDate(row.original.props.date as unknown as string);
      },
    },
    {
      id: "actions",
      header: "Ações",
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleViewDetails(row.original)}
        >
          <EyeIcon className="h-4 w-4" />
        </Button>
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
        </CardHeader>
        <CardContent>
          {isFetching ? (
            <p className="text-center p-10">Buscando dados...</p>
          ) : (
            <DataTable
              columns={columns}
              data={credits}
              filterColumnId="clientName"
              filterPlaceholder="Pesquisar por cliente..."
            />
          )}
        </CardContent>
      </Card>

      <MetalCreditDetailsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        credit={selectedCredit}
      />
    </>
  );
}
