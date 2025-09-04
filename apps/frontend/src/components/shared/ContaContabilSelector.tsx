import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { ContaContabilForm } from "@/components/forms/conta-contabil-form";
import { PlusCircle } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";

interface ContaContabil {
  id: string;
  codigo: string;
  nome: string;
}

interface ContaContabilSelectorProps {
  selectedContaId: string | undefined;
  onSelectConta: (contaId: string) => void;
  onContaCreated: (newConta: ContaContabil) => void; // Callback para quando uma nova conta é criada
  contasContabeis: ContaContabil[];
  loadingContas: boolean;
}

export function ContaContabilSelector({
  selectedContaId,
  onSelectConta,
  onContaCreated,
  contasContabeis,
  loadingContas,
}: ContaContabilSelectorProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleNewContaSave = async () => {
    setIsModalOpen(false);
    // A lista de contas será atualizada pelo onContaCreated no componente pai
  };

  return (
    <div className="flex items-center gap-2">
      <Select
        value={selectedContaId || ""}
        onValueChange={onSelectConta}
        disabled={loadingContas || contasContabeis.length === 0}
      >
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Selecione a Conta" />
        </SelectTrigger>
        <SelectContent>
          {loadingContas ? (
            <SelectItem value="loading" disabled>Carregando contas...</SelectItem>
          ) : contasContabeis.length === 0 ? (
            <SelectItem value="no-accounts" disabled>Nenhuma conta cadastrada.</SelectItem>
          ) : (
            contasContabeis.map((conta) => (
              <SelectItem key={conta.id} value={conta.id}>
                {`${conta.codigo} - ${conta.nome}`}
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>

      <Button
        variant="outline"
        size="icon"
        onClick={() => setIsModalOpen(true)}
        disabled={loadingContas}
      >
        <PlusCircle className="h-4 w-4" />
        <span className="sr-only">Adicionar Nova Conta</span>
      </Button>

      <AlertDialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Criar Nova Conta Contábil</AlertDialogTitle>
            <AlertDialogDescription>
              Preencha os dados para criar uma nova conta contábil.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <ContaContabilForm onSave={handleNewContaSave} />
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
