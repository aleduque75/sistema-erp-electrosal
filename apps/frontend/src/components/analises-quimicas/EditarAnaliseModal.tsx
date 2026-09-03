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
      await updateAnaliseQuimica(analise.id, {
        ...values,
        dataEntrada: values.dataEntrada ? values.dataEntrada.toISOString() : undefined,
      });
      toast.success("Sucesso!", {
        description: "Análise química atualizada.",
      });
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Falha ao atualizar análise:", error);
      const apiMessage = error?.response?.data?.message || error?.message || "Ocorreu um erro ao atualizar a análise. Tente novamente.";
      const description = Array.isArray(apiMessage) ? apiMessage.join(", ") : apiMessage;
      toast.error("Erro ao salvar", {
        description,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const initialData: Partial<AnaliseQuimicaFormValues> = {
    clienteId: analise.cliente?.id || (analise as any).clienteId || "",
    metalType: (analise.metalType as any) || "AU",
    descricaoMaterial: analise.descricaoMaterial,
    volumeOuPesoEntrada: analise.volumeOuPesoEntrada,
    unidadeEntrada: analise.unidadeEntrada,
    observacoes: analise.observacoes || "",
    dataEntrada: analise.dataEntrada ? new Date(analise.dataEntrada) : new Date(),
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
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
