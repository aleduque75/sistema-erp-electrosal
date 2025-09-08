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
  // Adicionando campos da Pessoa
  cpf?: string | null;
  birthDate?: string | null;
  gender?: string | null;
  cep?: string | null;
  logradouro?: string | null;
  numero?: string | null;
  complemento?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  uf?: string | null;
  role?: "CLIENT" | "FORNECEDOR" | "FUNCIONARIO"; // Add role
  type?: "FISICA" | "JURIDICA"; // Add PessoaType
  existingPessoaId?: string | null; // Add existing Pessoa ID
  existingRoles?: string[]; // Add existing roles
}
interface SelectionState {
  selected: boolean;
  name: string;
  email: string | null;
  phone?: string | null;
  // Adicionando campos da Pessoa
  cpf?: string | null;
  birthDate?: string | null;
  gender?: string | null;
  cep?: string | null;
  logradouro?: string | null;
  numero?: string | null;
  complemento?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  uf?: string | null;
  role?: "CLIENT" | "FORNECEDOR" | "FUNCIONARIO"; // Add role
  type?: "FISICA" | "JURIDICA"; // Add PessoaType
  existingPessoaId?: string | null; // Add existing Pessoa ID
  existingRoles?: string[]; // Add existing roles
}

export default function ImportClientsPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewData, setPreviewData] = useState<PreviewClient[]>([]);;
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
          cpf: client.cpf,
          birthDate: client.birthDate,
          gender: client.gender,
          cep: client.cep,
          logradouro: client.logradouro,
          numero: client.numero,
          complemento: client.complemento,
          bairro: client.bairro,
          cidade: client.cidade,
          uf: client.uf,
          role: client.role, // Add role
          type: client.type, // Add PessoaType
          existingPessoaId: client.existingPessoaId,
          existingRoles: client.existingRoles,
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
        cpf: data.cpf,
        birthDate: data.birthDate,
        gender: data.gender,
        cep: data.cep,
        logradouro: data.logradouro,
        numero: data.numero,
        complemento: data.complemento,
        bairro: data.bairro,
        cidade: data.cidade,
        uf: data.uf,
        role: data.role, // Add role
        type: data.type, // Add PessoaType
      }));

    if (clientsToImport.length === 0) {
      toast.info("Nenhum novo cliente selecionado para importar.");
      return;
    }

    setIsProcessing(true);
    try {
      const response = await api.post("/clients/bulk-create", {
        pessoas: clientsToImport,
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
                <TableHead>CPF (Editável)</TableHead>
                <TableHead>Data Nasc. (Editável)</TableHead>
                <TableHead>Gênero (Editável)</TableHead>
                <TableHead>CEP (Editável)</TableHead>
                <TableHead>Logradouro (Editável)</TableHead>
                <TableHead>Número (Editável)</TableHead>
                <TableHead>Complemento (Editável)</TableHead>
                <TableHead>Bairro (Editável)</TableHead>
                <TableHead>Cidade (Editável)</TableHead>
                <TableHead>UF (Editável)</TableHead>
                <TableHead>Tipo (Editável)</TableHead>
                <TableHead>Papel (Editável)</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Papéis Existentes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {previewData.map((client, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <Checkbox
                      checked={selections[index]?.selected || false}
                      disabled={client.status === "duplicate" && client.existingRoles?.includes(selections[index]?.role || "")}
                      onCheckedChange={(checked) =>
                        handleSelectionChange(index, "selected", !!checked)
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      value={selections[index]?.name || ''}
                      onChange={(e) =>
                        handleSelectionChange(index, "name", e.target.value)
                      }
                      disabled={client.status === "duplicate"}
                      className="w-full px-2 py-1"
                    />
                  </TableCell>
                  <TableCell>{client.email || "N/A"}</TableCell>
                  <TableCell>
                    <Input
                      value={selections[index]?.phone || ''}
                      onChange={(e) =>
                        handleSelectionChange(index, "phone", e.target.value)
                      }
                      disabled={client.status === "duplicate"}
                      className="w-full px-2 py-1"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      value={selections[index]?.cpf || ''}
                      onChange={(e) =>
                        handleSelectionChange(index, "cpf", e.target.value)
                      }
                      disabled={client.status === "duplicate"}
                      className="w-full px-2 py-1"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      value={selections[index]?.birthDate || ''}
                      onChange={(e) =>
                        handleSelectionChange(index, "birthDate", e.target.value)
                      }
                      disabled={client.status === "duplicate"}
                      className="w-full px-2 py-1"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      value={selections[index]?.gender || ''}
                      onChange={(e) =>
                        handleSelectionChange(index, "gender", e.target.value)
                      }
                      disabled={client.status === "duplicate"}
                      className="w-full px-2 py-1"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      value={selections[index]?.cep || ''}
                      onChange={(e) =>
                        handleSelectionChange(index, "cep", e.target.value)
                      }
                      disabled={client.status === "duplicate"}
                      className="w-full px-2 py-1"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      value={selections[index]?.logradouro || ''}
                      onChange={(e) =>
                        handleSelectionChange(index, "logradouro", e.target.value)
                      }
                      disabled={client.status === "duplicate"}
                      className="w-full px-2 py-1"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      value={selections[index]?.numero || ''}
                      onChange={(e) =>
                        handleSelectionChange(index, "numero", e.target.value)
                      }
                      disabled={client.status === "duplicate"}
                      className="w-full px-2 py-1"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      value={selections[index]?.complemento || ''}
                      onChange={(e) =>
                        handleSelectionChange(index, "complemento", e.target.value)
                      }
                      disabled={client.status === "duplicate"}
                      className="w-full px-2 py-1"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      value={selections[index]?.bairro || ''}
                      onChange={(e) =>
                        handleSelectionChange(index, "bairro", e.target.value)
                      }
                      disabled={client.status === "duplicate"}
                      className="w-full px-2 py-1"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      value={selections[index]?.cidade || ''}
                      onChange={(e) =>
                        handleSelectionChange(index, "cidade", e.target.value)
                      }
                      disabled={client.status === "duplicate"}
                      className="w-full px-2 py-1"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      value={selections[index]?.uf || ''}
                      onChange={(e) =>
                        handleSelectionChange(index, "uf", e.target.value)
                      }
                      disabled={client.status === "duplicate"}
                      className="w-full px-2 py-1"
                    />
                  </TableCell>
                  <TableCell>
                    <select
                      value={selections[index]?.type || "FISICA"}
                      onChange={(e) =>
                        handleSelectionChange(index, "type", e.target.value)
                      }
                      disabled={client.status === "duplicate"}
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="FISICA">Pessoa Física</option>
                      <option value="JURIDICA">Pessoa Jurídica</option>
                    </select>
                  </TableCell>
                  <TableCell>
                    <select
                      value={selections[index]?.role || "CLIENT"}
                      onChange={(e) =>
                        handleSelectionChange(index, "role", e.target.value)
                      }
                      disabled={client.status === "duplicate" && client.existingRoles?.includes(selections[index]?.role || "")}
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="CLIENT">Cliente</option>
                      <option value="FORNECEDOR">Fornecedor</option>
                      <option value="FUNCIONARIO">Funcionário</option>
                    </select>
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
                   <TableCell>
                     {client.existingRoles && client.existingRoles.length > 0 ? (
                       client.existingRoles.map((role) => (
                         <Badge key={role} variant="outline" className="mr-1">
                           {role}
                         </Badge>
                       ))
                     ) : (
                       "Nenhum"
                     )}
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