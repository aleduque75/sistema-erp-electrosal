"use client";

import { useState } from "react";
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

export function LegacyImport() {
  const [isJsonImporting, setIsJsonImporting] = useState(false);
  const [quotationFile, setQuotationFile] = useState<File | null>(null);
  const [isFullImporting, setIsFullImporting] = useState(false);
  const [auditData, setAuditData] = useState<any>(null);

  const handleFullLegacyImport = async () => {
    if (!window.confirm('Este é um processo longo que executará todas as etapas de importação do legado em sequência. Deseja continuar?')) return;
    setIsFullImporting(true);
    const promise = api.post("/json-imports/full-legacy-import");
    toast.promise(promise, {
      loading: "Iniciando processo de importação completa... Isso pode levar vários minutos.",
      success: (response) => response.data.message,
      error: (err) => err.response?.data?.message || "Falha no processo de importação completa.",
    });
  };

  const handleAuditFiles = async () => {
    toast.info("Buscando amostra dos arquivos JSON...");
    try {
      const response = await api.get("/json-imports/audit-import-files");
      setAuditData(response.data);
      toast.success("Amostra carregada. Role para baixo para ver os dados.");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Falha ao auditar arquivos.");
    }
  };

  const handleImportCompanies = async () => {
    setIsJsonImporting(true);
    toast.info("Iniciando importação e atualização de empresas...");
    try {
      const response = await api.post("/json-imports/companies");
      toast.success(response.data.message);
    } catch (err: any) {
      toast.error(
        err.response?.data?.message || "Falha ao importar empresas."
      );
    } finally {
      setIsJsonImporting(false);
    }
  };

  const handleImportContas = async () => {
    setIsJsonImporting(true);
    toast.info("Iniciando importação de contas correntes...");
    try {
      const response = await api.post("/json-imports/contas");
      toast.success(response.data.message);
    } catch (err: any) {
      toast.error(
        err.response?.data?.message || "Falha ao importar contas."
      );
    } finally {
      setIsJsonImporting(false);
    }
  };

  const handleImportProducts = async () => {
    setIsJsonImporting(true);
    toast.info("Iniciando importação de produtos do arquivo JSON...");
    try {
      const response = await api.post("/json-imports/products", {
        jsonDirectory: "/home/aleduque/Documentos/cursos/sistema-erp-electrosal/json-imports",
      });
      const successCount = response.data.filter((r: any) => r.status === 'success').length;
      const failedCount = response.data.filter((r: any) => r.status === 'failed').length;
      toast.success(`Importação de produtos concluída: ${successCount} sucesso(s), ${failedCount} falha(s).`);
      if (failedCount > 0) {
        console.error("Detalhes das falhas na importação de produtos:", response.data.filter((r: any) => r.status === 'failed'));
        toast.error("Verifique o console para detalhes das falhas.");
      }
    } catch (err: any) {
      toast.error(
        err.response?.data?.message || "Falha ao importar produtos."
      );
    } finally {
      setIsJsonImporting(false);
    }
  };

  const handleImportSalesAndFinance = async () => {
    setIsJsonImporting(true);
    toast.info("Iniciando importação completa de vendas e financeiro...");
    try {
      const response = await api.post("/json-imports/sales-finance");
      toast.success(response.data.message);
    } catch (err: any) {
      toast.error(
        err.response?.data?.message || "Falha ao importar vendas."
      );
    } finally {
      setIsJsonImporting(false);
    }
  };

  const handleDeleteSales = async () => {
    if (window.confirm('TEM CERTEZA? Esta ação apagará permanentemente TODAS as vendas e seus itens do banco de dados. Esta ação não pode ser desfeita.')) {
      setIsJsonImporting(true);
      toast.info("Iniciando exclusão de todas as vendas...");
      try {
        const response = await api.delete("/json-imports/delete-all-sales");
        toast.success(`Exclusão concluída: ${response.data.deletedSalesCount} vendas e ${response.data.deletedItemsCount} itens foram excluídos.`);
      } catch (err: any) {
        toast.error(
          err.response?.data?.message || "Falha ao excluir vendas."
        );
      } finally {
        setIsJsonImporting(false);
      }
    }
  };

  const handleResetAndSeed = async () => {
    if (window.confirm('TEM CERTEZA? Esta ação apagará permanentemente TODOS os dados e executará o seed novamente. Esta ação não pode ser desfeita.')) {
      setIsJsonImporting(true);
      toast.info("Iniciando reset e seed do banco de dados...");
      try {
        const response = await api.post("/json-imports/reset-and-seed");
        toast.success(response.data.message);
      } catch (err: any) {
        toast.error(
          err.response?.data?.message || "Falha ao resetar e popular o banco de dados."
        );
      } finally {
        setIsJsonImporting(false);
      }
    }
  };

  const handleImportQuotations = async () => {
    if (!quotationFile) {
      toast.error("Por favor, selecione o arquivo pedidoItens.json.");
      return;
    }
    setIsJsonImporting(true);
    toast.info("Iniciando importação de cotações...");
    const formData = new FormData();
    formData.append("file", quotationFile);

    try {
      const response = await api.post("/quotation-imports", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success(`${response.data.createdCount} cotações importadas com sucesso!`);
    } catch (err: any) {
      toast.error(
        err.response?.data?.message || "Falha ao importar cotações."
      );
    } finally {
      setIsJsonImporting(false);
    }
  };

  return (
    <div className="flex flex-wrap gap-8 justify-center items-start">
      {/* Card Principal de Importação Unificada */}
      <Card className="w-full max-w-lg border-primary">
        <CardHeader>
          <CardTitle className="text-primary">Importar Dados Legados (Processo Completo)</CardTitle>
          <CardDescription>
            Clique aqui para executar o processo completo de importação de dados do sistema legado. Isso inclui empresas, contas, produtos, vendas, e o cálculo final de ajustes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={handleFullLegacyImport}
            disabled={isFullImporting}
            className="w-full"
          >
            {isFullImporting
              ? "Importando... (Pode levar vários minutos)"
              : "Iniciar Importação Completa"}
          </Button>
        </CardContent>
      </Card>

      {/* Card de Importação de Vendas e Financeiro */}
      <Card className="w-full max-w-lg border-blue-500">
        <CardHeader>
          <CardTitle className="text-blue-700">Importar Vendas e Financeiro</CardTitle>
          <CardDescription>
            Importa o fluxo completo de vendas a partir dos arquivos <code>pedidos.json</code>, <code>pedidoItens.json</code>, <code>financeiro.json</code> e <code>Empresa.json</code>.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={handleImportSalesAndFinance}
            disabled={isJsonImporting}
            className="w-full"
          >
            {isJsonImporting
              ? "Analisando Dados..."
              : "Iniciar Importação de Vendas e Financeiro"}
          </Button>
        </CardContent>
      </Card>

      {/* Card de Auditoria */}
      <Card className="w-full max-w-lg border-purple-500">
        <CardHeader>
          <CardTitle className="text-purple-700">Auditar Arquivos de Importação</CardTitle>
          <CardDescription>
            Ferramenta de diagnóstico para inspecionar a estrutura dos arquivos JSON e encontrar a chave de ligação correta entre eles.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            onClick={handleAuditFiles}
          >
            Auditar Arquivos
          </Button>
        </CardContent>
      </Card>

      {/* Card de Reset e Seed */}
      <Card className="w-full max-w-lg border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Resetar e Popular Banco de Dados</CardTitle>
          <CardDescription>
            Apaga permanentemente <strong>TODOS</strong> os dados e executa o seed novamente. Use como primeiro passo antes da importação completa.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="destructive"
            onClick={handleResetAndSeed}
            disabled={isJsonImporting}
            className="w-full"
          >
            {isJsonImporting
              ? "Resetando..."
              : "Excluir e Popular Dados"}
          </Button>
        </CardContent>
      </Card>

      {/* ================================================================== */}
      {/* ========= BOTÕES ANTIGOS E REDUNDANTES OCULTADOS ABAIXO ========= */}
      {/* ================================================================== */}

      {/*
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Importar Dados Legados (JSON)</CardTitle>
          <CardDescription>
            Importe empresas a partir do arquivo <code>Empresa.json</code>.
            Esta ação verifica por <code>externalId</code> e não duplicará registros.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={handleImportCompanies}
            disabled={isJsonImporting}
            className="w-full"
          >
            {isJsonImporting
              ? "Importando Empresas..."
              : "Iniciar Importação de Empresas"}
          </Button>
        </CardContent>
      </Card>

      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Importar Contas Correntes</CardTitle>
          <CardDescription>
            Importe as contas correntes a partir do arquivo <code>conta_corrente.json</code>.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={handleImportContas}
            disabled={isJsonImporting}
            className="w-full"
          >
            {isJsonImporting
              ? "Importando Contas..."
              : "Iniciar Importação de Contas"}
          </Button>
        </CardContent>
      </Card>

      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Importar Produtos Legados (JSON)</CardTitle>
          <CardDescription>
            Importe produtos a partir do arquivo <code>produtos.json</code>.
            Esta ação verifica por <code>externalId</code> e não duplicará registros.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={handleImportProducts}
            disabled={isJsonImporting}
            className="w-full"
          >
            {isJsonImporting
              ? "Importando Produtos..."
              : "Iniciar Importação de Produtos"}
          </Button>
        </CardContent>
      </Card>

      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Importar Cotações (JSON)</CardTitle>
          <CardDescription>
            Importe cotações a partir do arquivo <code>pedidoItens.json</code>.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="quotation-file">Arquivo pedidoItens.json</Label>
            <Input
              id="quotation-file"
              type="file"
              accept=".json"
              onChange={(e) =>
                setQuotationFile(e.target.files ? e.target.files[0] : null)
              }
            />
          </div>
          <Button
            onClick={handleImportQuotations}
            disabled={isJsonImporting}
            className="w-full"
          >
            {isJsonImporting
              ? "Importando Cotações..."
              : "Iniciar Importação de Cotações"}
          </Button>
        </CardContent>
      </Card>

      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Importar Vendas e Financeiro (Completo)</CardTitle>
          <CardDescription>
            Importa o fluxo completo de vendas a partir dos arquivos <code>pedidos.json</code>, <code>pedidoItens.json</code>, <code>financeiro.json</code> e <code>Empresa.json</code>.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={handleImportSalesAndFinance}
            disabled={isJsonImporting}
            className="w-full"
          >
            {isJsonImporting
              ? "Analisando Dados..."
              : "Iniciar Análise de Vendas"}
          </Button>
        </CardContent>
      </Card>

      <Card className="w-full max-w-lg border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Excluir Vendas Legadas</CardTitle>
          <CardDescription>
            Apaga permanentemente <strong>TODAS</strong> as vendas e seus itens do banco de dados. Use com cuidado antes de uma nova importação.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="destructive"
            onClick={handleDeleteSales}
            disabled={isJsonImporting}
            className="w-full"
          >
            {isJsonImporting
              ? "Excluindo..."
              : "Excluir Todas as Vendas"}
          </Button>
        </CardContent>
      </Card>
      */}

      {auditData && (
        <Card className="w-full max-w-4xl col-span-1 lg:col-span-2 xl:col-span-3">
          <CardHeader>
            <CardTitle>Resultado da Auditoria</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="mt-4 p-4 bg-muted rounded-lg text-sm overflow-x-auto">
              {JSON.stringify(auditData, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
