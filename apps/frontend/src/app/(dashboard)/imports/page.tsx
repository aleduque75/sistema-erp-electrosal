"use client";

import { useState, useEffect, useMemo } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ContaContabilForm } from "@/components/forms/conta-contabil-form";
import { TipoContaContabilPrisma } from "@/lib/types";

// Interfaces
interface ContaCorrente {
  id: string;
  nome: string;
}
interface ContaContabil {
  id: string;
  nome: string;
  codigo: string;
}
interface PreviewTransaction {
  fitId: string;
  type: "CREDIT" | "DEBIT";
  amount: number;
  description: string;
  postedAt: string;
  status: "new" | "duplicate";
}
interface SelectionState {
  selected: boolean;
  contaContabilId?: string;
  description?: string; // Guarda a descrição editada
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    value
  );
const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString("pt-BR", { timeZone: "UTC" });

export default function ImportPage() {
  const [contasCorrentes, setContasCorrentes] = useState<ContaCorrente[]>([]);
  const [contasDeEntrada, setContasDeEntrada] = useState<ContaContabil[]>([]);
  const [contasDeSaida, setContasDeSaida] = useState<ContaContabil[]>([]);

  const [selectedContaCorrenteId, setSelectedContaCorrenteId] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [previewData, setPreviewData] = useState<PreviewTransaction[]>([]);
  const [selections, setSelections] = useState<Record<string, SelectionState>>(
    {}
  );

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCategoryType, setNewCategoryType] =
    useState<TipoContaContabilPrisma>(TipoContaContabilPrisma.DESPESA);

  const [isJsonImporting, setIsJsonImporting] = useState(false);
  const [quotationFile, setQuotationFile] = useState<File | null>(null);

  const fetchContas = async () => {
    try {
      const [resReceitas, resDespesas] = await Promise.all([
        api.get("/contas-contabeis?tipo=RECEITA"),
        api.get("/contas-contabeis?tipo=DESPESA"),
      ]);
      setContasDeEntrada(resReceitas.data);
      setContasDeSaida(resDespesas.data);
    } catch {
      toast.error("Erro ao recarregar o plano de contas.");
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

  useEffect(() => {
    api.get("/contas-correntes").then((res) => setContasCorrentes(res.data));
    fetchContas();
  }, []);

  const handlePreview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContaCorrenteId || !selectedFile) {
      toast.error("Por favor, selecione a conta e um arquivo.");
      return;
    }
    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("contaCorrenteId", selectedContaCorrenteId);

    try {
      const response = await api.post(
        "/bank-statement-imports/preview-ofx",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      setPreviewData(response.data);
      const initialSelections = response.data.reduce((acc: Record<string, SelectionState>, t: PreviewTransaction) => {
        acc[t.fitId] = {
          selected: t.status === "new",
          contaContabilId: undefined,
          description: t.description,
        };
        return acc;
      }, {});
      setSelections(initialSelections);
    } catch (err: any) {
      toast.error(
        err.response?.data?.message || "Erro ao pré-visualizar arquivo."
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleFinalImport = async () => {
    const transactionsToImport = previewData
      .filter((t) => selections[t.fitId]?.selected)
      .map((t) => ({
        fitId: t.fitId,
        amount: t.amount,
        description: selections[t.fitId]?.description ?? t.description,
        postedAt: new Date(t.postedAt),
        tipo: t.type === "CREDIT" ? "CREDITO" : "DEBITO",
        contaContabilId: selections[t.fitId]?.contaContabilId,
      }));

    const unclassified = transactionsToImport.find((t) => !t.contaContabilId);
    if (unclassified) {
      toast.error(
        `A transação "${unclassified.description}" precisa de uma categoria.`
      );
      return;
    }

    if (transactionsToImport.length === 0) {
      toast.info("Nenhuma nova transação selecionada para importar.");
      return;
    }

    setIsUploading(true);
    const payload = {
      contaCorrenteId: selectedContaCorrenteId,
      transactions: transactionsToImport,
    };

    try {
      const response = await api.post("/transacoes/bulk-create", payload);
      toast.success(
        `${response.data.count} transações importadas com sucesso!`
      );
      setPreviewData([]);
    } catch (err: any) {
      toast.error(
        err.response?.data?.message || "Erro ao importar transações."
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleSelectionChange = (
    fitId: string,
    key: keyof SelectionState,
    value: any,
    originalDescription: string
  ) => {
    const newSelections = { ...selections };
    newSelections[fitId] = { ...newSelections[fitId], [key]: value };

    // Lógica de preenchimento automático
    if (key === "contaContabilId" && originalDescription) {
      previewData.forEach((t) => {
        if (
          t.description === originalDescription &&
          t.fitId !== fitId &&
          !newSelections[t.fitId]?.contaContabilId
        ) {
          newSelections[t.fitId] = {
            ...newSelections[t.fitId],
            contaContabilId: value,
          };
        }
      });
    }
    setSelections(newSelections);
  };

  const selectableItemsCount = useMemo(
    () => previewData.filter((t) => t.status === "new").length,
    [previewData]
  );
  const selectedItemsCount = useMemo(
    () => Object.values(selections).filter((s) => s.selected).length,
    [selections]
  );

  const handleToggleSelectAll = (checked: boolean) => {
    const newSelections = { ...selections };
    previewData.forEach((t) => {
      if (t.status === "new") {
        newSelections[t.fitId] = {
          ...newSelections[t.fitId],
          selected: checked,
        };
      }
    });
    setSelections(newSelections);
  };

  const openNewCategoryModal = (type: "CREDIT" | "DEBIT") => {
    setNewCategoryType(
      type === "CREDIT"
        ? TipoContaContabilPrisma.RECEITA
        : TipoContaContabilPrisma.DESPESA
    );
    setIsCategoryModalOpen(true);
  };

  // Etapa 1: Formulário de Upload
  if (previewData.length === 0) {
    return (
      <div className="flex flex-wrap gap-8 justify-center items-start">
        {/* Card de Importação de Extrato */}
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle>Importar Extrato Bancário (.ofx)</CardTitle>
            <CardDescription>
              Selecione a conta de destino e o arquivo OFX para conciliar as
              transações.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePreview} className="space-y-4">
              <div className="space-y-2">
                <Label>Importar Para Qual Conta Corrente?</Label>
                <Select
                  value={selectedContaCorrenteId}
                  onValueChange={setSelectedContaCorrenteId}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma conta..." />
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
                <Label htmlFor="ofx-file">Arquivo .ofx</Label>
                <Input
                  id="ofx-file"
                  type="file"
                  accept=".ofx, .OFX"
                  onChange={(e) =>
                    setSelectedFile(e.target.files ? e.target.files[0] : null)
                  }
                  required
                />
              </div>
              <Button type="submit" disabled={isUploading} className="w-full">
                {isUploading ? "Analisando..." : "Analisar Arquivo"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Card de Importação de Empresas JSON */}
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

        {/* Card de Importação de Contas Correntes JSON */}
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

        {/* Card de Importação de Produtos JSON */}
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

        {/* Card de Importação de Cotações JSON */}
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

        {/* Card de Importação de Vendas JSON */}
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

        {/* Card de Exclusão de Vendas JSON */}
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

        {/* Card de Reset e Seed */}
        <Card className="w-full max-w-lg border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Resetar e Popular Banco de Dados</CardTitle>
            <CardDescription>
              Apaga permanentemente <strong>TODOS</strong> os dados e executa o seed novamente. Use com cuidado.
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
      </div>
    );
  }

  // Etapa 2: Tabela de Conciliação
  return (
    <>
      <Card className="mx-auto my-8 max-w-6xl">
        <CardHeader>
          <CardTitle>Conciliação Bancária</CardTitle>
          <CardDescription>
            Selecione e categorize as novas transações que deseja importar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">
                    <Checkbox
                      checked={
                        selectableItemsCount > 0 &&
                        selectedItemsCount === selectableItemsCount
                          ? true
                          : selectedItemsCount > 0
                            ? "indeterminate"
                            : false
                      }
                      onCheckedChange={(checked) =>
                        handleToggleSelectAll(!!checked)
                      }
                    />
                  </TableHead>
                  <TableHead className="w-[120px]">Data</TableHead>
                  <TableHead>Descrição (Editável)</TableHead>
                  <TableHead className="w-[300px]">
                    Categoria (Plano de Contas)
                  </TableHead>
                  <TableHead className="w-[120px] text-right">Valor</TableHead>
                  <TableHead className="w-[100px]">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {previewData.map((t) => {
                  const contasParaEsteItem =
                    t.type === "CREDIT" ? contasDeEntrada : contasDeSaida;
                  return (
                    <TableRow
                      key={t.fitId}
                      className={t.status === "duplicate" ? "bg-muted/50" : ""}
                    >
                      <TableCell>
                        <Checkbox
                          checked={selections[t.fitId]?.selected || false}
                          disabled={t.status === "duplicate"}
                          onCheckedChange={(checked) =>
                            handleSelectionChange(
                              t.fitId,
                              "selected",
                              !!checked,
                              t.description
                            )
                          }
                        />
                      </TableCell>
                      <TableCell>{formatDate(t.postedAt)}</TableCell>
                      <TableCell>
                        <Input
                          type="text"
                          defaultValue={t.description}
                          onBlur={(e) =>
                            handleSelectionChange(
                              t.fitId,
                              "description",
                              e.target.value,
                              t.description
                            )
                          }
                          className="w-full h-8"
                          disabled={t.status === "duplicate"}
                        />
                      </TableCell>
                      <TableCell>
                        {t.status === "new" && (
                          <Select
                            value={selections[t.fitId]?.contaContabilId || ""}
                            onValueChange={(value) => {
                              if (value === "---create-new---") {
                                openNewCategoryModal(t.type);
                              } else {
                                handleSelectionChange(
                                  t.fitId,
                                  "contaContabilId",
                                  value,
                                  t.description
                                );
                              }
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione..." />
                            </SelectTrigger>
                            <SelectContent>
                              {contasParaEsteItem.map((c) => (
                                <SelectItem key={c.id} value={c.id}>
                                  {c.codigo} - {c.nome}
                                </SelectItem>
                              ))}
                              <SelectItem
                                value="---create-new---"
                                className="text-blue-600 font-bold"
                              >
                                + Criar nova categoria...
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      </TableCell>
                      <TableCell
                        className={`text-right font-medium ${t.type === "CREDIT" ? "text-green-600" : "text-red-600"}`}
                      >
                        {formatCurrency(t.amount)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={t.status === "new" ? "default" : "secondary"}
                        >
                          {t.status === "new" ? "Novo" : "Já existe"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          <div className="flex justify-end gap-2 pt-4 mt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setPreviewData([])}
              disabled={isUploading}
            >
              Cancelar
            </Button>
            <Button onClick={handleFinalImport} disabled={isUploading}>
              {isUploading
                ? "Importando..."
                : `Importar (${selectedItemsCount}) Selecionados`}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isCategoryModalOpen} onOpenChange={setIsCategoryModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Nova Conta Contábil</DialogTitle>
          </DialogHeader>
          <ContaContabilForm
            initialData={{ nome: "", tipo: newCategoryType, contaPaiId: null }}
            onSave={() => {
              setIsCategoryModalOpen(false);
              fetchContas();
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
