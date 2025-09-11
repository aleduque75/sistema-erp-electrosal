"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AnaliseQuimica } from "@/types/analise-quimica";
import { aprovarAnaliseQuimica } from "@/services/analisesApi";

interface ConfirmarAprovacaoModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  analise: AnaliseQuimica | null;
  onSuccess: () => void;
}

export function ConfirmarAprovacaoModal({
  isOpen,
  onOpenChange,
  analise,
  onSuccess,
}: ConfirmarAprovacaoModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!analise) return null;

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      console.log("Analise object in modal:", analise);
    console.log("Analise ID in modal:", analise.id);
    await aprovarAnaliseQuimica(analise.id);
      toast.success("Análise aprovada com sucesso!", {
        description: "Crédito lançado na conta do cliente.",
      });
      onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      toast.error("Erro ao aprovar análise", { description: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Confirmar Aprovação da Análise</DialogTitle>
          <DialogDescription>
            Tem certeza que deseja aprovar a análise Nº: <strong>{analise.numeroAnalise}</strong>?
            Esta ação lançará um crédito na conta do cliente.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={isSubmitting}>
            {isSubmitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              "Confirmar Aprovação"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
