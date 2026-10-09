"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { toast } from "sonner";
import { Plus, Pencil, Check, X, Layers, AlertCircle, Trash2, RotateCcw, Sparkles } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  stockUnit?: string;
}

interface InventoryLot {
  id: string;
  productId: string;
  batchNumber?: string | null;
  quantity: number;
  remainingQuantity: number;
  costPrice: number;
  unitCostAu?: number | null;
  sourceType: string;
  sourceId?: string | null;
  notes?: string | null;
  receivedDate: string;
  createdAt: string;
}

interface ProductLotsModalProps {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStockUpdated: () => void;
}

export function ProductLotsModal({
  product,
  open,
  onOpenChange,
  onStockUpdated,
}: ProductLotsModalProps) {
  const [lots, setLots] = useState<InventoryLot[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingLotId, setEditingLotId] = useState<string | null>(null);

  // Edit Lot Form State
  const [editForm, setEditForm] = useState<{
    batchNumber: string;
    quantity: string;
    remainingQuantity: string;
    costPrice: string;
    notes: string;
  }>({
    batchNumber: "",
    quantity: "",
    remainingQuantity: "",
    costPrice: "",
    notes: "",
  });

  // Create Lot Form State
  const [isCreating, setIsCreating] = useState(false);
  const [newLot, setNewLot] = useState({
    batchNumber: "",
    quantity: "",
    costPrice: "",
    notes: "",
  });

  const formatGrams = (val: number | undefined | null) => {
    if (val === undefined || val === null || isNaN(val) || Math.abs(val) < 1e-6) return "0,00";
    return new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 4 }).format(val);
  };

  const fetchLots = async () => {
    if (!product) return;
    setLoading(true);
    try {
      const response = await api.get(`/stock/lots?productId=${product.id}`);
      setLots(response.data || []);
    } catch (err) {
      toast.error("Erro ao carregar lotes do produto.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && product) {
      fetchLots();
      setIsCreating(false);
      setEditingLotId(null);
    }
  }, [open, product]);

  const handleStartEdit = (lot: InventoryLot) => {
    setEditingLotId(lot.id);
    setEditForm({
      batchNumber: lot.batchNumber || "",
      quantity: String(lot.quantity || 0),
      remainingQuantity: String(lot.remainingQuantity || 0),
      costPrice: String(lot.costPrice || 0),
      notes: lot.notes || "",
    });
  };

  const handleSaveEdit = async (lotId: string) => {
    try {
      await api.patch(`/stock/lots/${lotId}`, {
        batchNumber: editForm.batchNumber || undefined,
        quantity: parseFloat(editForm.quantity) || 0,
        remainingQuantity: parseFloat(editForm.remainingQuantity) || 0,
        costPrice: parseFloat(editForm.costPrice) || 0,
        notes: editForm.notes || undefined,
      });

      toast.success("Lote atualizado com sucesso!");
      setEditingLotId(null);
      fetchLots();
      onStockUpdated();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Falha ao atualizar lote.");
    }
  };

  const handleZeroOutLot = async (lot: InventoryLot) => {
    try {
      await api.patch(`/stock/lots/${lot.id}`, {
        remainingQuantity: 0,
      });

      toast.success(`Saldo do lote ${lot.batchNumber || "sem N°"} zerado!`);
      fetchLots();
      onStockUpdated();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Falha ao zerar saldo do lote.");
    }
  };

  const handleZeroOutMicroResiduals = async () => {
    const microLots = lots.filter((l) => l.remainingQuantity > 0 && l.remainingQuantity < 0.05);
    if (microLots.length === 0) {
      toast.info("Nenhum lote com saldo residual insignificante (< 0,05g) encontrado.");
      return;
    }

    try {
      for (const lot of microLots) {
        await api.patch(`/stock/lots/${lot.id}`, {
          remainingQuantity: 0,
        });
      }

      toast.success(`${microLots.length} lotes residuais foram zerados!`);
      fetchLots();
      onStockUpdated();
    } catch (err: any) {
      toast.error("Falha ao zerar resíduos.");
    }
  };

  const handleCreateLot = async () => {
    if (!product) return;
    const qty = parseFloat(newLot.quantity);
    if (isNaN(qty) || qty <= 0) {
      toast.error("Informe uma quantidade válida.");
      return;
    }

    try {
      await api.post("/stock/adjust", {
        productId: product.id,
        quantity: qty,
        costPrice: parseFloat(newLot.costPrice) || 0,
        batchNumber: newLot.batchNumber || undefined,
        notes: newLot.notes || "Entrada manual via Cadastro de Produtos",
      });

      toast.success("Novo lote criado e estoque atualizado!");
      setIsCreating(false);
      setNewLot({ batchNumber: "", quantity: "", costPrice: "", notes: "" });
      fetchLots();
      onStockUpdated();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Falha ao criar lote.");
    }
  };

  const formatSourceType = (type: string) => {
    switch (type) {
      case "PURCHASE_ORDER":
        return "Pedido de Compra";
      case "CHEMICAL_REACTION":
        return "Reação Química";
      case "MANUAL_ADJUSTMENT":
        return "Ajuste Manual";
      default:
        return type || "Outro";
    }
  };

  const hasMicroResiduals = lots.some((l) => l.remainingQuantity > 0 && l.remainingQuantity < 0.05);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl sm:max-w-5xl w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <Layers className="h-6 w-6 text-primary" />
            Rastreamento & Ajuste de Lotes — {product?.name || ""}
          </DialogTitle>
          <DialogDescription>
            Gerencie os lotes de estoque, acompanhe a origem de produção/compra e faça acertos ou zere saldos residuais.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Top Summary Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-muted/30 rounded-xl border">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Layers className="h-5 w-5 text-primary" />
              </div>
              <div>
                <span className="text-xs text-muted-foreground uppercase font-semibold">Estoque Total Ativo</span>
                <div className="text-xl font-extrabold text-primary">
                  {formatGrams(product?.stock)} {product?.stockUnit || "g"}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {hasMicroResiduals && (
                <Button
                  size="sm"
                  variant="outline"
                  className="text-amber-500 border-amber-500/30 hover:bg-amber-500/10"
                  onClick={handleZeroOutMicroResiduals}
                  title="Zerar saldos residuais menores que 0,05g"
                >
                  <Sparkles className="h-4 w-4 mr-1.5" /> Zerar Resíduos (&lt; 0,05g)
                </Button>
              )}

              <Button
                size="sm"
                onClick={() => setIsCreating(!isCreating)}
                variant={isCreating ? "outline" : "default"}
              >
                {isCreating ? (
                  <>
                    <X className="h-4 w-4 mr-1.5" /> Cancelar
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-1.5" /> Novo Lote / Entrada
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Create Lot Form */}
          {isCreating && (
            <div className="p-4 border rounded-xl bg-accent/20 space-y-3 animate-in fade-in duration-200">
              <h4 className="text-sm font-semibold flex items-center gap-1.5">
                <Plus className="h-4 w-4 text-primary" /> Adicionar Novo Lote de Estoque
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs">Número do Lote (Opcional)</Label>
                  <Input
                    placeholder="Ex: LOTE-2026-01"
                    value={newLot.batchNumber}
                    onChange={(e) => setNewLot({ ...newLot, batchNumber: e.target.value })}
                  />
                </div>
                <div>
                  <Label className="text-xs">Quantidade ({product?.stockUnit || "g"}) *</Label>
                  <Input
                    type="number"
                    step="0.0001"
                    placeholder="Ex: 500"
                    value={newLot.quantity}
                    onChange={(e) => setNewLot({ ...newLot, quantity: e.target.value })}
                  />
                </div>
                <div>
                  <Label className="text-xs">Custo Unitário (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Ex: 150.00"
                    value={newLot.costPrice}
                    onChange={(e) => setNewLot({ ...newLot, costPrice: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label className="text-xs">Observações</Label>
                <Input
                  placeholder="Ex: Entrada inicial de estoque ou compra manual"
                  value={newLot.notes}
                  onChange={(e) => setNewLot({ ...newLot, notes: e.target.value })}
                />
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <Button size="sm" variant="ghost" onClick={() => setIsCreating(false)}>
                  Cancelar
                </Button>
                <Button size="sm" onClick={handleCreateLot}>
                  Salvar Lote
                </Button>
              </div>
            </div>
          )}

          {/* Lots Table */}
          {loading ? (
            <p className="text-sm text-muted-foreground text-center py-8">Carregando lotes de estoque...</p>
          ) : lots.length === 0 ? (
            <div className="text-center py-10 border rounded-xl bg-muted/10">
              <AlertCircle className="h-9 w-9 text-muted-foreground mx-auto mb-2" />
              <p className="text-base font-semibold">Nenhum lote registrado para este produto.</p>
              <p className="text-xs text-muted-foreground mt-1">
                Clique no botão "+ Novo Lote / Entrada" para cadastrar o primeiro lote de estoque.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto border rounded-xl">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/60 text-muted-foreground uppercase text-[10px] tracking-wider border-b">
                  <tr>
                    <th className="px-4 py-3">Lote #</th>
                    <th className="px-4 py-3">Origem</th>
                    <th className="px-4 py-3">Qtd Inicial</th>
                    <th className="px-4 py-3">Qtd Restante</th>
                    <th className="px-4 py-3">Custo Unitário</th>
                    <th className="px-4 py-3">Data</th>
                    <th className="px-4 py-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {lots.map((lot) => {
                    const isEditing = editingLotId === lot.id;
                    const isZero = lot.remainingQuantity <= 0.00001;

                    if (isEditing) {
                      return (
                        <tr key={lot.id} className="bg-accent/40">
                          <td className="px-4 py-3">
                            <Input
                              className="h-8 text-xs font-mono"
                              value={editForm.batchNumber}
                              onChange={(e) =>
                                setEditForm({ ...editForm, batchNumber: e.target.value })
                              }
                            />
                          </td>
                          <td className="px-4 py-3 text-muted-foreground font-medium">
                            {formatSourceType(lot.sourceType)}
                          </td>
                          <td className="px-4 py-3">
                            <Input
                              type="number"
                              step="0.0001"
                              className="h-8 text-xs w-24"
                              value={editForm.quantity}
                              onChange={(e) =>
                                setEditForm({ ...editForm, quantity: e.target.value })
                              }
                            />
                          </td>
                          <td className="px-4 py-3">
                            <Input
                              type="number"
                              step="0.0001"
                              className="h-8 text-xs w-28 font-extrabold text-primary"
                              value={editForm.remainingQuantity}
                              onChange={(e) =>
                                setEditForm({ ...editForm, remainingQuantity: e.target.value })
                              }
                            />
                          </td>
                          <td className="px-4 py-3">
                            <Input
                              type="number"
                              step="0.01"
                              className="h-8 text-xs w-24"
                              value={editForm.costPrice}
                              onChange={(e) =>
                                setEditForm({ ...editForm, costPrice: e.target.value })
                              }
                            />
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {new Date(lot.createdAt).toLocaleDateString("pt-BR")}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                size="sm"
                                variant="default"
                                className="h-8 px-2 bg-green-600 hover:bg-green-700 text-white"
                                onClick={() => handleSaveEdit(lot.id)}
                              >
                                <Check className="h-4 w-4 mr-1" /> Salvar
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 px-2"
                                onClick={() => setEditingLotId(null)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    }

                    return (
                      <tr key={lot.id} className={isZero ? "opacity-40 bg-muted/20" : "hover:bg-muted/10 transition-colors"}>
                        <td className="px-4 py-3 font-mono font-medium text-sm">
                          {lot.batchNumber || "Sem N°"}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          <Badge variant="outline" className="text-[10px] font-normal py-0.5">
                            {formatSourceType(lot.sourceType)}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 font-mono text-muted-foreground">
                          {formatGrams(lot.quantity)} {product?.stockUnit || "g"}
                        </td>
                        <td className="px-4 py-3 font-mono font-extrabold text-sm text-primary">
                          {formatGrams(lot.remainingQuantity)} {product?.stockUnit || "g"}
                        </td>
                        <td className="px-4 py-3 font-medium">
                          {new Intl.NumberFormat("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          }).format(lot.costPrice || 0)}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {new Date(lot.createdAt).toLocaleDateString("pt-BR")}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {!isZero && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs text-red-500 border-red-500/30 hover:bg-red-500/10 px-2"
                                title="Zerar saldo restante deste lote"
                                onClick={() => handleZeroOutLot(lot)}
                              >
                                <RotateCcw className="h-3 w-3 mr-1" /> Zerar Saldo
                              </Button>
                            )}
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8"
                              title="Editar lote"
                              onClick={() => handleStartEdit(lot)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
