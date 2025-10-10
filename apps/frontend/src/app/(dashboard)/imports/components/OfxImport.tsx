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
import { useQuery } from "@tanstack/react-query";
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

// --- NOVAS INTERFACES PARA USER PROFILE E SETTINGS ---
interface UserSettings {
  id: string;
  defaultReceitaContaId: string | null;
  defaultDespesaContaId: string | null;
}

interface UserProfile {
  id: string;
  name: string;
  email: string;
  settings: UserSettings | null;
}
// --------------------------------------------------

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    value
  );
const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString("pt-BR", { timeZone: "UTC" });

export function OfxImport() {
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

  // --- BUSCA O PERFIL DO USUÁRIO COM AS CONFIGURAÇÕES ---
  const { data: userProfile, isLoading: isLoadingProfile } = useQuery<UserProfile>({
    queryKey: ["userProfile"],
    queryFn: () => api.get("/users/profile").then((res) => res.data),
  });
  // -----------------------------------------------------

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
      const newPreviewData: PreviewTransaction[] = response.data;
      setPreviewData(newPreviewData);

      // --- LÓGICA DE CATEGORIZAÇÃO AUTOMÁTICA ---
      const defaultReceitaId = userProfile?.settings?.defaultReceitaContaId;
      const defaultDespesaId = userProfile?.settings?.defaultDespesaContaId;

      const initialSelections = newPreviewData.reduce((acc: Record<string, SelectionState>, t: PreviewTransaction) => {
        let suggestedContaId: string | undefined = undefined;

        if (t.status === "new") {
          const searchDescription = t.description.toLowerCase();
          const accountsToSearch = t.type === 'CREDIT' ? contasDeEntrada : contasDeSaida;
          const defaultId = t.type === 'CREDIT' ? defaultReceitaId : defaultDespesaId;

          // 1. Tenta encontrar um match exato ou parcial
          const foundAccount = accountsToSearch.find(acc => searchDescription.includes(acc.nome.toLowerCase()));

          if (foundAccount) {
            suggestedContaId = foundAccount.id;
          } else if (defaultId) {
            suggestedContaId = defaultId;
          }
        }

        acc[t.fitId] = {
          selected: t.status === "new",
          contaContabilId: suggestedContaId,
          description: t.description,
        };
        return acc;
      }, {});
      setSelections(initialSelections);
      // --------------------------------------------

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

  if (previewData.length === 0) {
    return (
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
            <Button type="submit" disabled={isUploading || isLoadingProfile} className="w-full">
              {isUploading ? "Analisando..." : "Analisar Arquivo"}
            </Button>
          </form>
        </CardContent>
      </Card>
    );
  }

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
                        {t.type === "CREDIT" ? "+ " : "- "}
                        {formatCurrency(Math.abs(t.amount))}
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
