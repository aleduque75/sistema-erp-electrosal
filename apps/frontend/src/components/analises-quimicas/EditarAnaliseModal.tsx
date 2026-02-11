"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AnaliseQuimicaForm, AnaliseQuimicaFormValues } from "./AnaliseQuimicaForm";
import { toast } from "sonner";
import { updateAnaliseQuimica } from "@/services/analisesApi";
import { AnaliseQuimica } from "@/types/analise-quimica";

interface EditarAnaliseModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  analise: AnaliseQuimica | null;
  onSuccess: () => void;
}

export function EditarAnaliseModal({
  isOpen,
  onOpenChange,
  analise,
  onSuccess,
}: EditarAnaliseModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!analise) {
    return null;
  }

  const onSubmit = async (values: AnaliseQuimicaFormValues) => {
    setIsSubmitting(true);
    try {
      await updateAnaliseQuimica(analise.id, values);
      toast.success("Sucesso!", {
        description: "Análise química atualizada.",
      });
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Falha ao atualizar análise:", error);
      toast.error("Erro ao salvar", {
        description: "Ocorreu um erro ao atualizar a análise. Tente novamente.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const initialData = {
    ...analise,
    dataEntrada: new Date(analise.dataEntrada),
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>Editar Análise Química #{analise.numeroAnalise}</DialogTitle>
          <DialogDescription>
            Atualize os detalhes da análise abaixo.
          </DialogDescription>
        </DialogHeader>
        <AnaliseQuimicaForm
          onSubmit={onSubmit}
          isSubmitting={isSubmitting}
          initialData={initialData}
        />
      </DialogContent>
    </Dialog>
  );
}
