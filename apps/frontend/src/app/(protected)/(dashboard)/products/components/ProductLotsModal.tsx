"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { toast } from "sonner";
import { Plus, Pencil, Check, X, Layers, AlertCircle } from "lucide-react";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
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
        return type || "Desconhecida";
    }
  };

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title={`Rastreamento de Lotes - ${product?.name || ""}`}
      description="Gerencie os lotes de estoque, acompanhe a origem e faça correções de quantidade ou custo."
    >
      <div className="space-y-4">
        {/* Top Summary Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-muted/40 rounded-lg border">
          <div className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-primary" />
            <div>
              <span className="text-sm font-medium">Estoque Total Calculado: </span>
              <span className="text-base font-bold text-primary">
                {product?.stock || 0} {product?.stockUnit || "g"}
              </span>
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => setIsCreating(!isCreating)}
            variant={isCreating ? "outline" : "default"}
          >
            {isCreating ? (
              <>
                <X className="h-4 w-4 mr-1" /> Cancelar Novo Lote
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-1" /> Novo Lote / Entrada
              </>
            )}
          </Button>
        </div>

        {/* Create Lot Form */}
        {isCreating && (
          <div className="p-4 border rounded-lg bg-accent/20 space-y-3">
            <h4 className="text-sm font-semibold flex items-center gap-1.5">
              <Plus className="h-4 w-4 text-primary" /> Adicionar Novo Lote de Estoque
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <Label className="text-xs">Número do Lote (Opcao)</Label>
                <Input
                  placeholder="Ex: LOTE-1002"
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
                placeholder="Ex: Ajuste inicial de saldo ou compra manual"
                value={newLot.notes}
                onChange={(e) => setNewLot({ ...newLot, notes: e.target.value })}
              />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button size="sm" variant="ghost" onClick={() => setIsCreating(false)}>
                Cancelar
              </Button>
              <Button size="sm" onClick={handleCreateLot}>
                Salvar e Criar Lote
              </Button>
            </div>
          </div>
        )}

        {/* Lots Table */}
        {loading ? (
          <p className="text-sm text-muted-foreground text-center py-6">Carregando lotes...</p>
        ) : lots.length === 0 ? (
          <div className="text-center py-8 border rounded-lg bg-muted/10">
            <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm font-medium">Nenhum lote registrado para este produto.</p>
            <p className="text-xs text-muted-foreground mt-1">
              Clique em "Novo Lote / Entrada" para cadastrar o primeiro lote.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto border rounded-lg">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted text-muted-foreground uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-3 py-2">Lote #</th>
                  <th className="px-3 py-2">Origem</th>
                  <th className="px-3 py-2">Qtd Inicial</th>
                  <th className="px-3 py-2">Qtd Restante</th>
                  <th className="px-3 py-2">Custo Unit.</th>
                  <th className="px-3 py-2">Data</th>
                  <th className="px-3 py-2 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {lots.map((lot) => {
                  const isEditing = editingLotId === lot.id;
                  const isZero = lot.remainingQuantity <= 0;

                  if (isEditing) {
                    return (
                      <tr key={lot.id} className="bg-accent/30">
                        <td className="px-3 py-2">
                          <Input
                            size={1}
                            className="h-7 text-xs"
                            value={editForm.batchNumber}
                            onChange={(e) =>
                              setEditForm({ ...editForm, batchNumber: e.target.value })
                            }
                          />
                        </td>
                        <td className="px-3 py-2 text-muted-foreground">
                          {formatSourceType(lot.sourceType)}
                        </td>
                        <td className="px-3 py-2">
                          <Input
                            type="number"
                            step="0.0001"
                            className="h-7 text-xs w-20"
                            value={editForm.quantity}
                            onChange={(e) =>
                              setEditForm({ ...editForm, quantity: e.target.value })
                            }
                          />
                        </td>
                        <td className="px-3 py-2">
                          <Input
                            type="number"
                            step="0.0001"
                            className="h-7 text-xs w-24 font-bold"
                            value={editForm.remainingQuantity}
                            onChange={(e) =>
                              setEditForm({ ...editForm, remainingQuantity: e.target.value })
                            }
                          />
                        </td>
                        <td className="px-3 py-2">
                          <Input
                            type="number"
                            step="0.01"
                            className="h-7 text-xs w-20"
                            value={editForm.costPrice}
                            onChange={(e) =>
                              setEditForm({ ...editForm, costPrice: e.target.value })
                            }
                          />
                        </td>
                        <td className="px-3 py-2 text-muted-foreground">
                          {new Date(lot.createdAt).toLocaleDateString("pt-BR")}
                        </td>
                        <td className="px-3 py-2 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-green-600"
                              onClick={() => handleSaveEdit(lot.id)}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-red-500"
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
                    <tr key={lot.id} className={isZero ? "opacity-50 bg-muted/20" : "hover:bg-muted/10"}>
                      <td className="px-3 py-2 font-mono font-medium">
                        {lot.batchNumber || "Sem N°"}
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">
                        <Badge variant="outline" className="text-[10px] py-0">
                          {formatSourceType(lot.sourceType)}
                        </Badge>
                      </td>
                      <td className="px-3 py-2">{lot.quantity}</td>
                      <td className="px-3 py-2 font-bold text-primary">
                        {lot.remainingQuantity}
                      </td>
                      <td className="px-3 py-2">
                        {new Intl.NumberFormat("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        }).format(lot.costPrice || 0)}
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">
                        {new Date(lot.createdAt).toLocaleDateString("pt-BR")}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          title="Editar lote"
                          onClick={() => handleStartEdit(lot)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </ResponsiveDialog>
  );
}
