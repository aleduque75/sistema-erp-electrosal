// apps/frontend/src/app/(dashboard)/contas-correntes/[id]/extrato/page.tsx

"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { toast } from "sonner";
import { subDays, format } from "date-fns";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  PlusCircle,
  ArrowRightLeft,
  MoreHorizontal,
} from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TransacaoForm } from "../../transacao-form";
// import { TransferModal } from "@/components/transfer-modal"; // Removido
import { Combobox } from "@/components/ui/combobox";
import { Checkbox } from "@/components/ui/checkbox";
import { formatInTimeZone } from "date-fns-tz";
import { ContaCorrenteType } from "@sistema-erp-electrosal/core"; // Importamos o objeto Enum (valor)
import { TransferFromSupplierAccountForm } from "../../components/transfer-from-supplier-account-form"; // Adicionado
import { SaleDetailsModal } from "../../../sales/sale-details-modal";

// Copied from sales/page.tsx

// Copied from sales/page.tsx
export interface Sale {
  id: string;
  orderNumber: string;
  pessoa: { name: string };
  totalAmount: number;
  feeAmount: number;
  netAmount: number;
  goldPrice: number;
  goldValue: number;
  paymentMethod: string;
  createdAt: string;
  status: 'PENDENTE' | 'CONFIRMADO' | 'A_SEPARAR' | 'FINALIZADO' | 'CANCELADO';
  lucro?: number;
  paymentAccountName?: string;
  saleItems: {
    id: string;
    productId: string;
    quantity: number;
    price: number;
    product: { name: string };
    inventoryLotId?: string;
  }[];
}


const formatCurrency = (value?: number | null) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    value || 0
  );

const formatGold = (value?: number | null) => {
  if (value == null) return "-";
  return `${value.toFixed(4).replace(".", ",")} g`;
};

const formatDateTime = (dateString?: string | null) =>
  dateString
    ? new Date(dateString).toLocaleString("pt-BR", { timeZone: "UTC" })
    : "N/A";

// Define o TIPO STRING LITERAL do Enum para uso nas interfaces
type ContaCorrenteTypeLiteral = "BANCO" | "FORNECEDOR_METAL" | "EMPRESTIMO";

interface ContaCorrenteExtrato {
  id: string;
  nome: string;
  numeroConta: string;
  moeda: string;
  initialBalanceBRL: number; // Updated
  initialBalanceGold: number; // Added
  // Usa o tipo string literal (CORRIGIDO)
  type: ContaCorrenteTypeLiteral;
}

interface TransacaoExtrato {
  id: string;
  dataHora: string;
  descricao: string;
  valor: number;
  goldAmount?: number;
  tipo: "CREDITO" | "DEBITO";
  contaContabilId: string; // Adicionado
  contaContabilNome: string; // Adicionado
  sale?: {
    id: string;
    orderNumber: number;
  };
}

interface ExtratoData {
  saldoAnteriorBRL: number; // Updated
  saldoAnteriorGold: number; // Added
  saldoFinalBRL: number; // Updated
  saldoFinalGold: number; // Added
  contaCorrente: ContaCorrenteExtrato;
  transacoes: TransacaoExtrato[];
}

export default function ExtratoPage() {
  const params = useParams();
  const router = useRouter();
  const id = (params?.id ?? "") as string;

  const [extrato, setExtrato] = useState<ExtratoData | null>(null);
  const [isFetching, setIsFetching] = useState(true);

  const [startDate, setStartDate] = useState(
    format(subDays(new Date(), 30), "yyyy-MM-dd")
  );
  const [endDate, setEndDate] = useState(format(new Date(), "yyyy-MM-dd"));

  const [currencyView, setCurrencyView] = useState<"BRL" | "GOLD">("BRL");

  const [isLancamentoModalOpen, setIsLancamentoModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false); // Novo estado para o modal de transferência
  const [contasContabeis, setContasContabeis] = useState<any[]>([]);
  const [editingTransacaoId, setEditingTransacaoId] = useState<string | null>(
    null
  );
  const [editingTransacao, setEditingTransacao] =
    useState<TransacaoExtrato | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingTransacaoId, setDeletingTransacaoId] = useState<string | null>(
    null
  );
  const [reconciledIds, setReconciledIds] = useState<string[]>([]);
  const [displayTransacoes, setDisplayTransacoes] = useState<
    TransacaoExtrato[]
  >([]);
  const [descriptionFilter, setDescriptionFilter] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [newContaContabilId, setNewContaContabilId] = useState<string>("");
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

  const handleViewSaleDetails = async (saleId: string) => {
    try {
      const response = await api.get(`/sales/${saleId}`);
      setSelectedSale(response.data);
    } catch (err) {
      toast.error("Falha ao buscar detalhes da venda.");
    }
  };

  const fetchContasContabeis = async () => {
    try {
      const response = await api.get("/contas-contabeis");
      setContasContabeis(response.data);
    } catch (err) {
      toast.error("Falha ao carregar contas contábeis.");
    }
  };

  const fetchExtrato = async () => {
    setIsFetching(true);
    try {
      const queryParams = new URLSearchParams({ startDate, endDate });
      const response = await api.get(
        `/contas-correntes/${id}/extrato?${queryParams.toString()}`
      );
      const formattedTransacoes = response.data.transacoes.map((t: any) => ({
        ...t,
        valor: parseFloat(t.valor),
        goldAmount: t.goldAmount ? parseFloat(t.goldAmount) : undefined,
      }));
      setExtrato({
        ...response.data,
        saldoAnteriorBRL: parseFloat(response.data.saldoAnteriorBRL),
        saldoAnteriorGold: parseFloat(response.data.saldoAnteriorGold),
        saldoFinalBRL: parseFloat(response.data.saldoFinalBRL),
        saldoFinalGold: parseFloat(response.data.saldoFinalGold),
        contaCorrente: {
          ...response.data.contaCorrente,
          initialBalanceBRL: parseFloat(
            response.data.contaCorrente.initialBalanceBRL
          ),
          initialBalanceGold: parseFloat(
            response.data.contaCorrente.initialBalanceGold
          ),
        },
        transacoes: formattedTransacoes,
      });
      setDisplayTransacoes(formattedTransacoes);
    } catch (err) {
      toast.error("Falha ao carregar extrato.");
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchExtrato();
      fetchContasContabeis();
    }
  }, [id, startDate, endDate]);

  const handleSaveLancamento = () => {
    setIsLancamentoModalOpen(false);
    setEditingTransacao(null);
    fetchExtrato();
  };

  const handleSaveTransfer = () => {
    setIsTransferModalOpen(false);
    fetchExtrato();
  };

  const handleUpdateContaContabil = async (
    transacaoId: string,
    newContaContabilId: string
  ) => {
    try {
      await api.patch(`/transacoes/${transacaoId}`, {
        contaContabilId: newContaContabilId,
      });
      toast.success("Conta contábil atualizada com sucesso!");
      setEditingTransacaoId(null);
      fetchExtrato();
    } catch (err) {
      toast.error("Falha ao atualizar conta contábil.");
    }
  };

  const handleBulkUpdate = async () => {
    if (selectedIds.length === 0 || !newContaContabilId) {
      toast.error("Selecione as transações e a nova conta contábil.");
      return;
    }

    try {
      await api.post("/transacoes/bulk-update-conta-contabil", {
        transactionIds: selectedIds,
        contaContabilId: newContaContabilId,
      });
      toast.success("Transações atualizadas com sucesso!");
      setSelectedIds([]);
      setNewContaContabilId("");
      fetchExtrato();
    } catch (err) {
      toast.error("Falha ao atualizar transações.");
    }
  };

  const handleMove = (transactionId: string, direction: "up" | "down") => {
    const index = displayTransacoes.findIndex((t) => t.id === transactionId);
    if (index === -1) return;

    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= displayTransacoes.length) return;

    const newTransacoes = [...displayTransacoes];
    const [movedItem] = newTransacoes.splice(index, 1);
    newTransacoes.splice(newIndex, 0, movedItem);
    setDisplayTransacoes(newTransacoes);
  };

  const handleDelete = async () => {
    if (!deletingTransacaoId) return;
    try {
      await api.delete(`/transacoes/${deletingTransacaoId}`);
      toast.success("Transação excluída com sucesso!");
      fetchExtrato();
    } catch (err) {
      toast.error("Falha ao excluir transação.");
    } finally {
      setIsDeleteModalOpen(false);
      setDeletingTransacaoId(null);
    }
  };

  const handleToggleReconciled = (transactionId: string) => {
    setReconciledIds((prev) =>
      prev.includes(transactionId)
        ? prev.filter((id) => id !== transactionId)
        : [...prev, transactionId]
    );
  };

  const filteredTransacoes = useMemo(() => {
    if (!descriptionFilter) {
      return displayTransacoes;
    }
    return displayTransacoes.filter((t) =>
      t.descricao.toLowerCase().includes(descriptionFilter.toLowerCase())
    );
  }, [displayTransacoes, descriptionFilter]);

  if (isFetching && !extrato) {
    return <p className="text-center p-10">Buscando extrato...</p>;
  }

  return (
    <>
      <Card className="my-8">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="text-2xl">Extrato da Conta</CardTitle>
              <p className="text-muted-foreground">
                {extrato?.contaCorrente.nome} -{" "}
                {extrato?.contaCorrente.numeroConta}
              </p>
            </div>

            <div className="flex items-center gap-4">
              <ToggleGroup
                type="single"
                value={currencyView}
                onValueChange={(value: "BRL" | "GOLD") =>
                  value && setCurrencyView(value)
                }
                aria-label="Visualização de Moeda"
              >
                <ToggleGroupItem value="BRL" aria-label="Visualizar em Reais">
                  R$
                </ToggleGroupItem>
                <ToggleGroupItem value="GOLD" aria-label="Visualizar em Ouro">
                  Au
                </ToggleGroupItem>
              </ToggleGroup>

              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => router.back()}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
                </Button>
                <Button onClick={() => setIsLancamentoModalOpen(true)}>
                  <PlusCircle className="mr-2 h-4 w-4" /> Novo Lançamento
                </Button>
                {/* CORRIGIDO: Usa a string literal 'FORNECEDOR_METAL' */}
                {extrato?.contaCorrente.type === "FORNECEDOR_METAL" && (
                  <Button
                    variant="outline"
                    onClick={() => setIsTransferModalOpen(true)}
                  >
                    {" "}
                    {/* Novo botão */}
                    <ArrowRightLeft className="mr-2 h-4 w-4" /> Transferir Ouro
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 my-4 p-4 border rounded-lg items-end">
            <div className="flex-1 w-full">
              <Label htmlFor="startDate">Data Inicial</Label>
              <Input
                type="date"
                id="startDate"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="flex-1 w-full">
              <Label htmlFor="endDate">Data Final</Label>
              <Input
                type="date"
                id="endDate"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div className="flex-1 w-full">
              <Label htmlFor="descriptionFilter">Filtrar por Descrição</Label>
              <Input
                id="descriptionFilter"
                type="text"
                value={descriptionFilter}
                onChange={(e) => setDescriptionFilter(e.target.value)}
                placeholder="Buscar..."
              />
            </div>
          </div>

          {selectedIds.length > 0 && (
            <div className="flex items-center gap-4 my-4 p-4 border rounded-lg bg-muted/50">
              <p className="text-sm font-medium">
                {selectedIds.length} transações selecionadas
              </p>
              <div className="w-[300px]">
                <Combobox
                  options={contasContabeis.map((cc) => ({
                    value: cc.id,
                    label: `${cc.codigo} - ${cc.nome}`,
                  }))}
                  placeholder="Selecione a nova conta..."
                  onChange={setNewContaContabilId}
                  value={newContaContabilId}
                />
              </div>
              <Button onClick={handleBulkUpdate}>Alterar em Lote</Button>
            </div>
          )}

          {isFetching ? (
            <p className="text-center p-4">Atualizando...</p>
          ) : extrato ? (
            <div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center md:text-left p-4 bg-muted/50 rounded-md mb-4">
                <div>
                  <strong>Saldo Anterior:</strong>
                  <p className="font-semibold text-lg">
                    {currencyView === "BRL"
                      ? formatCurrency(extrato.saldoAnteriorBRL)
                      : formatGold(extrato.saldoAnteriorGold)}
                  </p>
                </div>

                <div>
                  <strong>Saldo Final do Período:</strong>
                  <p className="font-semibold text-lg">
                    {currencyView === "BRL"
                      ? formatCurrency(extrato.saldoFinalBRL)
                      : formatGold(extrato.saldoFinalGold)}
                  </p>
                </div>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">
                      <Checkbox
                        checked={
                          selectedIds.length === filteredTransacoes.length &&
                          filteredTransacoes.length > 0
                        }
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedIds(filteredTransacoes.map((t) => t.id));
                          } else {
                            setSelectedIds([]);
                          }
                        }}
                      />
                    </TableHead>
                    <TableHead>Data/Hora</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Conta Contábil</TableHead>
                    <TableHead className="text-right">
                      Valor ({currencyView === "BRL" ? "R$" : "Au"})
                    </TableHead>
                    <TableHead className="w-[50px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransacoes.length > 0 ? (
                    filteredTransacoes.map((t, index) => (
                      <TableRow
                        key={t.id}
                        onClick={() => handleToggleReconciled(t.id)}
                        className={
                          reconciledIds.includes(t.id)
                            ? "bg-green-800/50 dark:bg-green-800 hover:bg-green-600/50 dark:hover:bg-green-700"
                            : ""
                        }
                      >
                        <TableCell>
                          <Checkbox
                            checked={selectedIds.includes(t.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedIds([...selectedIds, t.id]);
                              } else {
                                setSelectedIds(
                                  selectedIds.filter((id) => id !== t.id)
                                );
                              }
                            }}
                          />
                        </TableCell>
                        <TableCell>{formatDateTime(t.dataHora)}</TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <span>{t.descricao}</span>
                            {t.sale && (
                              <Button
                                variant="link"
                                className="h-auto p-1 ml-2 whitespace-nowrap"
                                onClick={() => handleViewSaleDetails(t.sale.id)}
                              >
                                (Venda #{t.sale.orderNumber})
                              </Button>
                            )}
                          </div>
                        </TableCell>
                        <TableCell
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingTransacaoId(t.id);
                          }}
                          className="cursor-pointer hover:bg-muted/50"
                        >
                          {editingTransacaoId === t.id ? (
                            <Combobox
                              options={contasContabeis.map((cc) => ({
                                value: cc.id,
                                label: `${cc.codigo} - ${cc.nome}`,
                              }))}
                              value={t.contaContabilId}
                              onChange={(value) => {
                                handleUpdateContaContabil(t.id, value);
                              }}
                              placeholder="Selecione a conta..."
                            />
                          ) : (
                            t.contaContabilNome
                          )}
                        </TableCell>
                        <TableCell
                          className={`text-right font-semibold ${t.tipo === "CREDITO" ? "text-green-600" : "text-red-600"}`}
                        >
                          {t.tipo === "DEBITO" && "- "}
                          {currencyView === "BRL"
                            ? formatCurrency(t.valor)
                            : formatGold(t.goldAmount)}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                className="h-8 w-8 p-0"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <span className="sr-only">Abrir menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              align="end"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <DropdownMenuItem
                                onClick={() => handleMove(t.id, "up")}
                                disabled={index === 0}
                              >
                                Mover para Cima
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleMove(t.id, "down")}
                                disabled={
                                  index === filteredTransacoes.length - 1
                                }
                              >
                                Mover para Baixo
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setEditingTransacao(t);
                                  setIsLancamentoModalOpen(true);
                                }}
                              >
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setDeletingTransacaoId(t.id);
                                  setIsDeleteModalOpen(true);
                                }}
                              >
                                Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center h-24">
                        Nenhuma transação no período selecionado.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-center p-10">
              Não foi possível carregar os dados do extrato.
            </p>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={isLancamentoModalOpen}
        onOpenChange={(isOpen) => {
          setIsLancamentoModalOpen(isOpen);
          if (!isOpen) {
            setEditingTransacao(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingTransacao
                ? "Editar Lançamento"
                : `Novo Lançamento em ${extrato?.contaCorrente.nome}`}
            </DialogTitle>
          </DialogHeader>
          <TransacaoForm
            contaCorrenteId={id}
            onSave={handleSaveLancamento}
            initialData={editingTransacao}
            moeda={extrato?.contaCorrente.moeda}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isTransferModalOpen} onOpenChange={setIsTransferModalOpen}>
        {" "}
        {/* Novo Dialog para transferência */}
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Transferir Ouro para Lotes de Metal Puro</DialogTitle>
            <DialogDescription>
              Realize a transferência de ouro desta conta para o estoque de
              lotes de metal puro.
            </DialogDescription>
          </DialogHeader>
          <TransferFromSupplierAccountForm
            supplierMetalAccountId={id}
            onSave={handleSaveTransfer}
            onClose={() => setIsTransferModalOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza de que deseja excluir esta transação? Esta ação não
              pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {selectedSale && (
        <SaleDetailsModal
          sale={selectedSale}
          open={!!selectedSale}
          onOpenChange={(open) => !open && setSelectedSale(null)}
        />
      )}
    </>
  );
}
