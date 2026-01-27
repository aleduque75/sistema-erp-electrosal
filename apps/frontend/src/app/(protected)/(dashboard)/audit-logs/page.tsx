"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";
import { toast } from "sonner";
import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";

interface AuditLogEntry {
  timestamp: string;
  userId?: string;
  userName?: string; // Novo campo
  entityType: string;
  entityId: string;
  entityName?: string; // Novo campo
  description: string;
}

export default function AuditLogsPage() {
  const { user, isLoading } = useAuth();
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setIsPageLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = async () => {
    setIsPageLoading(true);
    setError(null);
    try {
      const response = await api.get("/audit-logs");
      setLogs(response.data);
    } catch (err: any) {
      console.error("Failed to fetch audit logs:", err);
      setError("Falha ao carregar os logs de auditoria.");
      toast.error("Falha ao carregar os logs de auditoria.");
    } finally {
      setIsPageLoading(false);
    }
  };

  useEffect(() => {
    if (!isLoading && user) {
      fetchLogs();
    }
  }, [user, isLoading]);

  const columns: ColumnDef<AuditLogEntry>[] = [
    {
      accessorKey: "timestamp",
      header: "Data/Hora",
      cell: ({ row }) => {
        return format(new Date(row.original.timestamp), "dd/MM/yyyy HH:mm:ss", {
          locale: ptBR,
        });
      },
    },
    { accessorKey: "userName", header: "Usuário" }, // Usando o nome do usuário
    { accessorKey: "entityType", header: "Tipo" },
    { accessorKey: "entityName", header: "Item Excluído" }, // Usando o nome da entidade
    { accessorKey: "description", header: "Descrição" },
  ];

  if (isLoading) {
    return <p className="text-center p-10">Carregando logs...</p>;
  }

  if (error) {
    return <p className="text-center p-10 text-red-500">{error}</p>;
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Logs de Auditoria</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={logs}
            filterColumnId="description"
            filterPlaceholder="Filtrar por descrição..."
          />
        </CardContent>
      </Card>
    </div>
  );
}
