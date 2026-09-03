"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PlusCircle } from "lucide-react";
import { AnaliseQuimicaForm, AnaliseQuimicaFormValues } from "./AnaliseQuimicaForm";
import { toast } from "sonner";
import { createAnaliseQuimica } from "@/services/analisesApi";

interface NovaAnaliseModalProps {
  onAnaliseCreated: () => void;
}

export function NovaAnaliseModal({ onAnaliseCreated }: NovaAnaliseModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  

  const onSubmit = async (values: AnaliseQuimicaFormValues) => {
    setIsSubmitting(true);
    try {
      await createAnaliseQuimica({
        clienteId: values.clienteId,
        metalType: values.metalType,
        dataEntrada: values.dataEntrada ? values.dataEntrada.toISOString() : undefined,
        descricaoMaterial: values.descricaoMaterial,
        volumeOuPesoEntrada: Number(values.volumeOuPesoEntrada),
        unidadeEntrada: values.unidadeEntrada,
        observacoes: values.observacoes,
      });
      toast.success("Sucesso!", {
        description: "Nova análise química registrada.",
      });
      setIsOpen(false);
      onAnaliseCreated(); // Callback to refresh the list
    } catch (error: any) {
      console.error("Falha ao criar análise:", error);
      const apiMessage = error?.response?.data?.message || error?.message || "Ocorreu um erro ao registrar a análise. Tente novamente.";
      const description = Array.isArray(apiMessage) ? apiMessage.join(", ") : apiMessage;
      toast.error("Erro ao salvar", {
        description,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" /> Nova Análise
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>Registrar Nova Análise Química</DialogTitle>
          <DialogDescription>
            Preencha os detalhes abaixo para registrar uma nova análise.
          </DialogDescription>
        </DialogHeader>
        <AnaliseQuimicaForm onSubmit={onSubmit} isSubmitting={isSubmitting} />
      </DialogContent>
    </Dialog>
  );
}
