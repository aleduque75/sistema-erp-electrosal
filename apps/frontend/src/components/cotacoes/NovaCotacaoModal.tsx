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
import { CotacaoForm } from "./CotacaoForm";

interface NovaCotacaoModalProps {
  onSave: () => void;
}

export function NovaCotacaoModal({ onSave }: NovaCotacaoModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleSave = () => {
    onSave();
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
        <CotacaoForm onSave={handleSave} />
      </DialogContent>
    </Dialog>
  );
}
