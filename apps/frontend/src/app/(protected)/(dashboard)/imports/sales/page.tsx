"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import api from "@/lib/api"; // Assumindo que você tem uma instância de axios ou fetch wrapper

interface ImportResults {
  error?: string;
  [key: string]: any;
}

export default function ImportSalesPage() {
  const [jsonDirectory, setJsonDirectory] = useState("");
  const [loading, setIsPageLoading] = useState(false);
  const [results, setResults] = useState<ImportResults | null>(null);

  const handleImport = async () => {
    if (!jsonDirectory) {
      toast.error("Por favor, informe o caminho do diretório JSON.");
      return;
    }

    setIsPageLoading(true);
    setResults(null);
    try {
      const response = await api.post("/json-imports/import-sales", {
        jsonDirectory,
      });
      setResults(response.data);
      toast.success("Importação de vendas iniciada com sucesso!");
    } catch (error) {
      console.error("Erro ao importar vendas:", error);
      toast.error("Falha ao importar vendas. Verifique o console para mais detalhes.");
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
      setResults({ error: errorMessage });
    } finally {
      setIsPageLoading(false);
    }
  };

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-3xl font-bold">Importar Vendas Antigas</h1>

      <Card>
        <CardHeader>
          <CardTitle>Configurações de Importação</CardTitle>
          <CardDescription>Informe o caminho absoluto para o diretório contendo os arquivos pedidos.json e pedidoItens.json.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="jsonDirectory">Caminho do Diretório JSON</Label>
            <Input
              id="jsonDirectory"
              type="text"
              placeholder="Ex: /home/usuario/dados_antigos/vendas"
              value={jsonDirectory}
              onChange={(e) => setJsonDirectory(e.target.value)}
            />
          </div>
          <Button onClick={handleImport} disabled={loading}>
            {loading ? "Importando..." : "Iniciar Importação"}
          </Button>
        </CardContent>
      </Card>

      {results && (
        <Card>
          <CardHeader>
            <CardTitle>Resultados da Importação</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="whitespace-pre-wrap text-sm">
              {JSON.stringify(results, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
