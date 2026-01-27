"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

// Interfaces
interface ContaCorrente {
  id: string;
  nome: string;
}
interface ContaContabil {
  id: string;
  nome: string;
}

export function ImportOfxForm() {
  const [contasCorrentes, setContasCorrentes] = useState<ContaCorrente[]>([]);
  const [contasPadrao, setContasPadrao] = useState<ContaContabil[]>([]);

  const [selectedContaCorrenteId, setSelectedContaCorrenteId] = useState("");
  const [selectedContaPadraoId, setSelectedContaPadraoId] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    // Busca as contas para os selects
    Promise.all([
      api.get("/contas-correntes"),
      api.get("/contas-contabeis"), // Idealmente, filtre por uma conta específica
    ])
      .then(([contasCorrentesRes, contasContabeisRes]) => {
        setContasCorrentes(contasCorrentesRes.data);
        // TODO: Encontrar a conta "A Classificar" de forma mais inteligente
        setContasPadrao(contasContabeisRes.data);
      })
      .catch(() => toast.error("Erro ao carregar contas."));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContaCorrenteId || !selectedFile || !selectedContaPadraoId) {
      toast.error("Por favor, selecione a conta, a conta padrão e um arquivo.");
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("contaCorrenteId", selectedContaCorrenteId);
    formData.append("contaContabilPadraoId", selectedContaPadraoId);

    try {
      const response = await api.post(
        "/bank-statement-imports/import-ofx",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      toast.success(response.data.message);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Erro ao importar arquivo.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card className="max-w-md">
      <CardHeader>
        <CardTitle>Importar Extrato Bancário (.ofx)</CardTitle>
        <CardDescription>
          Selecione a conta de destino e o arquivo OFX exportado do seu banco.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Para Qual Conta Corrente?</Label>
            <Select
              value={selectedContaCorrenteId}
              onValueChange={setSelectedContaCorrenteId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                {contasCorrentes.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Classificar como (Conta Padrão)</Label>
            <Select
              value={selectedContaPadraoId}
              onValueChange={setSelectedContaPadraoId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                {contasPadrao.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="ofx-file">Arquivo .ofx</Label>
            <Input
              id="ofx-file"
              type="file"
              accept=".ofx"
              onChange={(e) =>
                setSelectedFile(e.target.files ? e.target.files[0] : null)
              }
            />
          </div>
          <Button type="submit" disabled={isUpisLoading} className="w-full">
            {isUpisLoading ? "Importando..." : "Importar"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
