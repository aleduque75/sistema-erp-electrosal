import React, { useState } from "react";
import { Check, ChevronsUpDown, PlusCircle } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
import { toast } from "sonner";
import axios from "axios";

interface ContaContabil {
  id: string;
  codigo: string;
  nome: string;
}

interface ContaContabilComboboxProps {
  selectedContaId: string | undefined;
  onSelectConta: (contaId: string) => void;
  onContaCreated: (newConta: ContaContabil) => void; // Callback para quando uma nova conta é criada
  contasContabeis: ContaContabil[];
  loadingContas: boolean;
}

export function ContaContabilCombobox({
  selectedContaId,
  onSelectConta,
  onContaCreated,
  contasContabeis,
  loadingContas,
}: ContaContabilComboboxProps) {
  const [open, setOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleNewContaSave = async () => {
    setIsModalOpen(false);
    // A lista de contas será atualizada pelo onContaCreated no componente pai
  };

  return (
    <div className="flex items-center gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-[200px] justify-between"
            disabled={loadingContas}
          >
            {selectedContaId
              ? contasContabeis.find((conta) => conta.id === selectedContaId)?.nome
              : "Selecione a Conta..."}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-0">
          <Command>
            <CommandInput placeholder="Buscar conta..." />
            <CommandList>
              <CommandEmpty>Nenhuma conta encontrada.</CommandEmpty>
              <CommandGroup>
                {contasContabeis.map((conta) => (
                  <CommandItem
                    key={conta.id}
                    value={conta.nome}
                    onSelect={() => {
                      onSelectConta(conta.id);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedContaId === conta.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {`${conta.codigo} - ${conta.nome}`}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

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
