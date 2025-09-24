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
import { QuotationForm } from "./QuotationForm"; // Updated import

interface NovaQuotationModalProps { // Renamed interface
  onSaveSuccess: () => void; // Renamed prop
}

export function NovaQuotationModal({ onSaveSuccess }: NovaQuotationModalProps) { // Renamed function and prop
  const [isOpen, setIsOpen] = useState(false);

  const handleSave = () => {
    onSaveSuccess(); // Updated prop usage
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" /> Nova Cotação
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>Registrar Nova Cotação</DialogTitle>
          <DialogDescription>
            Preencha os detalhes abaixo para registrar uma nova cotação.
          </DialogDescription>
        </DialogHeader>
        <QuotationForm onSave={handleSave} />
      </DialogContent>
    </Dialog>
  );
}
