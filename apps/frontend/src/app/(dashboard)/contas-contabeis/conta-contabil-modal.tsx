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

interface ContaContabilModalProps {
  onSave: () => void;
}

export function ContaContabilModal({ onSave }: ContaContabilModalProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Nova Conta</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Criar Nova Conta</DialogTitle>
        </DialogHeader>
        <ContaContabilForm onSave={onSave} />
      </DialogContent>
    </Dialog>
  );
}
