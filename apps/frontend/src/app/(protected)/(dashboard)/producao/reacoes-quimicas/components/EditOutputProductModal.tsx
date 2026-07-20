"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import api from "@/lib/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChemicalReactionDetails } from "@/types/chemical-reaction";

interface EditOutputProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  reaction: ChemicalReactionDetails | null;
  onSave: () => void;
}

export function EditOutputProductModal({ isOpen, onClose, reaction, onSave }: EditOutputProductModalProps) {
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: productGroups, isLoading } = useQuery({ 
    queryKey: ["productGroups"],
    queryFn: async () => {
      const response = await api.get("/product-groups");
      return response.data.filter((pg: any) => pg.isReactionProductGroup);
    },
    enabled: isOpen,
  });

  useEffect(() => {
    if (reaction && isOpen) {
      setSelectedProductId(reaction.outputProduct?.id || "");
    }
  }, [reaction, isOpen]);

  const handleSubmit = async () => {
    if (!reaction || !selectedProductId) return;
    setIsSubmitting(true);
    try {
      await api.patch(`/chemical-reactions/${reaction.id}`, {
        outputProductId: selectedProductId
      });
      toast.success("Produto final atualizado com sucesso!");
      onSave();
    } catch (error: any) {
      toast.error("Erro ao atualizar o produto", {
        description: error.response?.data?.message || "Ocorreu um erro desconhecido"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Produto Final</DialogTitle>
          <DialogDescription>
            Altere o produto que será gerado por esta reação química.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <label className="text-sm font-medium leading-none mb-2 block">
            Produto Final
          </label>
          <Select
            value={selectedProductId}
            onValueChange={setSelectedProductId}
            disabled={isLoading || isSubmitting}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione o produto..." />
            </SelectTrigger>
            <SelectContent>
              {isLoading ? (
                <SelectItem value="loading" disabled>
                  Carregando produtos...
                </SelectItem>
              ) : (
                productGroups?.map((pg: any) => (
                  pg.products && pg.products.length > 0 ? (
                    <optgroup key={pg.id} label={pg.name} className="p-1 font-semibold text-sm text-muted-foreground">
                      {pg.products.map((product: any) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name}
                        </SelectItem>
                      ))}
                    </optgroup>
                  ) : null
                ))
              )}
            </SelectContent>
          </Select>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || !selectedProductId || selectedProductId === reaction?.outputProduct?.id}>
            {isSubmitting ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
