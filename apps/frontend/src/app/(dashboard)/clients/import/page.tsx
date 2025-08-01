"use client";

import { useState, useMemo } from "react";
import api from "@/lib/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";

// Interfaces
interface PreviewClient {
  name: string;
  email: string | null;
  phone?: string | null;
  status: "new" | "duplicate";
}
interface SelectionState {
  selected: boolean;
  name: string;
  email: string | null;
  phone?: string | null;
}

export default function ImportClientsPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewData, setPreviewData] = useState<PreviewClient[]>([]);
  const [selections, setSelections] = useState<Record<number, SelectionState>>(
    {}
  );

  const handlePreview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      toast.error("Por favor, selecione um arquivo.");
      return;
    }
    setIsProcessing(true);
    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const response = await api.post(
        "/client-imports/preview-google-csv",
        formData
      );
      setPreviewData(response.data);
      const initialSelections = response.data.reduce((acc, client, index) => {
        acc[index] = {
          selected: client.status === "new",
          name: client.name,
          email: client.email,
          phone: client.phone,
        };
        return acc;
      }, {});
      setSelections(initialSelections);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Erro ao analisar arquivo.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFinalImport = async () => {
    const clientsToImport = Object.entries(selections)
      .filter(([index, data]) => data.selected)
      .map(([index, data]) => ({
        email: data.email,
        name: data.name,
        phone: data.phone,
      }));

    if (clientsToImport.length === 0) {
      toast.info("Nenhum novo cliente selecionado para importar.");
      return;
    }

    setIsProcessing(true);
    try {
      const response = await api.post("/clients/bulk-create", {
        clients: clientsToImport,
      });
      toast.success(`${response.data.count} clientes importados com sucesso!`);
      setPreviewData([]); // Volta para a tela de upload
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Erro ao importar clientes.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSelectionChange = (
    index: number,
    key: keyof SelectionState,
    value: any
  ) => {
    setSelections((prev) => ({
      ...prev,
      [index]: { ...prev[index], [key]: value },
    }));
  };

  // --- LÓGICA DE RENDERIZAÇÃO CORRIGIDA ---
  if (previewData.length === 0) {
    // ETAPA 1: Se não há dados para pré-visualizar, mostra o formulário de upload
    return (
      <Card className="mx-auto my-8 max-w-lg">
        <CardHeader>
          <CardTitle>Importar Clientes (CSV do Google)</CardTitle>
          <CardDescription>
            Exporte os contatos do Google Contacts como um arquivo .csv e
            analise-os aqui.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePreview} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="csv-file">Arquivo .csv</Label>
              <Input
                id="csv-file"
                type="file"
                accept=".csv"
                onChange={(e) =>
                  setSelectedFile(e.target.files ? e.target.files[0] : null)
                }
                required
              />
            </div>
            <Button type="submit" disabled={isProcessing} className="w-full">
              {isProcessing ? "Analisando..." : "Analisar Arquivo"}
            </Button>
          </form>
        </CardContent>
      </Card>
    );
  } else {
    // ETAPA 2: Se HÁ dados para pré-visualizar, mostra a tabela de conciliação
    return (
      <Card className="mx-auto my-8 max-w-4xl">
        <CardHeader>
          <CardTitle>Conciliação de Clientes</CardTitle>
          <CardDescription>
            Selecione, edite os detalhes e importe os novos clientes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <Checkbox />
                </TableHead>
                <TableHead>Nome (Editável)</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Telefone (Editável)</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {previewData.map((client, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <Checkbox
                      checked={selections[index]?.selected || false}
                      disabled={client.status === "duplicate"}
                      onCheckedChange={(checked) =>
                        handleSelectionChange(index, "selected", !!checked)
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      defaultValue={client.name}
                      onBlur={(e) =>
                        handleSelectionChange(index, "name", e.target.value)
                      }
                      disabled={client.status === "duplicate"}
                    />
                  </TableCell>
                  <TableCell>{client.email || "N/A"}</TableCell>
                  <TableCell>
                    <Input
                      defaultValue={client.phone || ""}
                      onBlur={(e) =>
                        handleSelectionChange(index, "phone", e.target.value)
                      }
                      disabled={client.status === "duplicate"}
                    />
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        client.status === "new" ? "default" : "secondary"
                      }
                    >
                      {client.status === "new" ? "Novo" : "Já existe"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="flex justify-end gap-2 pt-4 mt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setPreviewData([])}
              disabled={isProcessing}
            >
              Cancelar
            </Button>
            <Button onClick={handleFinalImport} disabled={isProcessing}>
              {isProcessing ? "Importando..." : `Importar Selecionados`}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }
}
