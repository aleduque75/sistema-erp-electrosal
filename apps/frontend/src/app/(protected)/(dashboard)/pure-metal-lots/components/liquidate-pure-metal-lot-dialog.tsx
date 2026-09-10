"use client";

import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PureMetalLot } from "@/types/pure-metal-lot";
import { liquidatePureMetalLot } from "../pure-metal-lot.api";
import { CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";

interface LiquidatePureMetalLotDialogProps {
  lot: PureMetalLot | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function LiquidatePureMetalLotDialog({
  lot,
  isOpen,
  onOpenChange,
  onSuccess,
}: LiquidatePureMetalLotDialogProps) {
  const [notes, setNotes] = useState("Liquidação de saldo residual");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setNotes("Liquidação de saldo residual");
    }
  }, [isOpen, lot]);

  if (!lot) return null;

  const remainingGrams = Number(lot.remainingGrams || 0);

  const handleConfirm = async () => {
    try {
      setIsSubmitting(true);
      await liquidatePureMetalLot(lot.id, notes);
      toast.success("Lote liquidado com sucesso!");
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      const msg = error?.response?.data?.message || "Erro ao liquidar lote.";
      toast.error(msg);
      console.error("Erro ao liquidar lote:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <DialogTitle>Liquidar Lote de Metal Puro</DialogTitle>
          </div>
          <DialogDescription>
            Encerre o lote zerando qualquer saldo residual restante.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="rounded-lg border bg-muted/40 p-3.5 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Origem:</span>
              <span className="font-medium text-right truncate max-w-[260px]">
                {lot.notes || lot.originDetails?.orderNumber || lot.sourceType.replace("_", " ")}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tipo de Metal:</span>
              <span className="font-semibold">{lot.metalType}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Saldo Inicial:</span>
              <span>{Number(lot.initialGrams).toFixed(2)} g</span>
            </div>
            <div className="flex justify-between items-center pt-1 border-t">
              <span className="font-semibold">Saldo Restante a Liquidar:</span>
              <span className="text-base font-bold text-amber-600 dark:text-amber-400">
                {remainingGrams.toFixed(2)} g
              </span>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-3 rounded-md bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <p>
              Ao confirmar, será registrada uma movimentação de saída do resíduo (se houver), o saldo restante será zerado (0,00 g) e o status passará para <strong>Liquidado</strong>.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes" className="text-xs font-medium">
              Motivo / Observação
            </Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Perda de processo, sobra irrecuperável..."
              className="resize-none text-sm h-20"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="default"
            onClick={handleConfirm}
            disabled={isSubmitting}
            className="bg-amber-600 hover:bg-amber-700 text-white dark:bg-amber-700 dark:hover:bg-amber-800"
          >
            {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Confirmar Liquidação
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
