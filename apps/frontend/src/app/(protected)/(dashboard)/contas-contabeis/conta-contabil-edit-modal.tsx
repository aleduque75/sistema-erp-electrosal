"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ContaContabilForm } from "./conta-contabil-form";

interface Conta {
  id: string;
  codigo: string;
  nome: string;
  tipo: string;
  aceitaLancamento: boolean;
  contaPaiId: string | null;
  subContas?: Conta[];
}

interface ContaContabilEditModalProps {
  conta: Conta;
  onSave: () => void;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function ContaContabilEditModal({
  conta,
  onSave,
  isOpen,
  onOpenChange,
}: ContaContabilEditModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Conta: {conta.nome}</DialogTitle>
        </DialogHeader>
        <ContaContabilForm conta={conta} onSave={onSave} />
      </DialogContent>
    </Dialog>
  );
}
