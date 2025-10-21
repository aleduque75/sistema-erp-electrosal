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
import { QuotationForm } from "./QuotationForm";

interface Quotation {
  id: string;
  metal: string;
  date: string;
  buyPrice: number;
  sellPrice: number;
  tipoPagamento?: string;
}

interface EditQuotationModalProps {
  quotation: Quotation;
  onSaveSuccess: () => void;
}

export function EditQuotationModal({ quotation, onSaveSuccess }: EditQuotationModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleSave = () => {
    onSaveSuccess();
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost">Editar</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>Editar Cotação</DialogTitle>
          <DialogDescription>
            Atualize os detalhes da cotação abaixo.
          </DialogDescription>
        </DialogHeader>
        <QuotationForm onSave={handleSave} initialData={quotation} />
      </DialogContent>
    </Dialog>
  );
}
