"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import api from "@/lib/api";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AddRawMaterialModal } from "./add-raw-material-modal";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface RawMaterialUsed {
  id: string;
  rawMaterial: {
    id: string;
    name: string;
    unit: string;
  };
  quantity: number;
  cost: number;
}

interface ChemicalReaction {
  id: string;
  notes: string | null;
  status: string;
  auUsedGrams: number;
  outputProductGrams: number;
  rawMaterialsUsed: RawMaterialUsed[];
}

export default function ChemicalReactionDetailsPage() {
  const params = useParams();
  const { id } = params;
  const [chemicalReaction, setChemicalReaction] = useState<ChemicalReaction | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchChemicalReaction = async () => {
    try {
      const response = await api.get(`/chemical-reactions/${id}`);
      setChemicalReaction(response.data);
    } catch (error) {
      toast.error("Falha ao buscar detalhes da reação química.");
    }
  };

  useEffect(() => {
    if (id) {
      fetchChemicalReaction();
    }
  }, [id]);

  const handleRawMaterialAdded = () => {
    fetchChemicalReaction();
  };

  if (!chemicalReaction) {
    return <p>Carregando...</p>;
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Detalhes da Reação Química</CardTitle>
        </CardHeader>
        <CardContent>
          <p>ID: {chemicalReaction.id}</p>
          <p>Notas: {chemicalReaction.notes}</p>
          <p>Status: {chemicalReaction.status}</p>
          <p>Ouro Utilizado (g): {chemicalReaction.auUsedGrams}</p>
          <p>Produto Gerado (g): {chemicalReaction.outputProductGrams}</p>
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
              {chemicalReaction.rawMaterialsUsed.map((rm) => (
                <TableRow key={rm.id}>
                  <TableCell>{rm.rawMaterial.name}</TableCell>
                  <TableCell>{rm.quantity} {rm.rawMaterial.unit}</TableCell>
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
        chemicalReactionId={id as string}
        onRawMaterialAdded={handleRawMaterialAdded}
      />
    </div>
  );
}