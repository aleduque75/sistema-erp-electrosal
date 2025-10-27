"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import api from "@/lib/api";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AddRawMaterialModal } from "./add-raw-material-modal";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Link from "next/link";

interface RawMaterialUsed {
  id: string;
  rawMaterialId: string;
  rawMaterialName: string;
  quantity: number;
  cost: number;
  unit: string;
}

interface RecoveryOrder {
  id: string;
  descricao: string | null;
  status: string;
  totalBrutoEstimadoGramas: number;
  auPuroRecuperadoGramas: number | null;
  rawMaterialsUsed: RawMaterialUsed[];
}

export default function RecoveryOrderDetailsPage() {
  const params = useParams();
  const { id } = params;
  const [recoveryOrder, setRecoveryOrder] = useState<RecoveryOrder | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchRecoveryOrder = async () => {
    try {
      const response = await api.get(`/recovery-orders/${id}`);
      setRecoveryOrder(response.data);
    } catch (error) {
      toast.error("Falha ao buscar detalhes da ordem de recuperação.");
    }
  };

  useEffect(() => {
    if (id) {
      fetchRecoveryOrder();
    }
  }, [id]);

  const handleRawMaterialAdded = () => {
    fetchRecoveryOrder();
  };

  if (!recoveryOrder) {
    return <p>Carregando...</p>;
  }

  return (
    <div className="space-y-4">
      <Link href="/recovery-orders">
        <Button variant="outline">Voltar</Button>
      </Link>
      <Card>
        <CardHeader>
          <CardTitle>Detalhes da Ordem de Recuperação</CardTitle>
        </CardHeader>
        <CardContent>
          <p>ID: {recoveryOrder.id}</p>
          <p>Descrição: {recoveryOrder.descricao}</p>
          <p>Status: {recoveryOrder.status}</p>
          <p>Total Bruto Estimado (g): {recoveryOrder.totalBrutoEstimadoGramas}</p>
          <p>Au Puro Recuperado (g): {recoveryOrder.auPuroRecuperadoGramas ?? "N/A"}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Matérias-Primas Utilizadas</CardTitle>
          <Button onClick={() => setIsModalOpen(true)}>Adicionar Matéria-Prima</Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Quantidade</TableHead>
                <TableHead>Custo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recoveryOrder.rawMaterialsUsed?.map((rm) => (
                <TableRow key={rm.id}>
                  <TableCell>{rm.rawMaterialName}</TableCell>
                  <TableCell>{rm.quantity} {rm.unit}</TableCell>
                  <TableCell>{new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(rm.cost)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AddRawMaterialModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        recoveryOrderId={id as string}
        onRawMaterialAdded={handleRawMaterialAdded}
      />
    </div>
  );
}