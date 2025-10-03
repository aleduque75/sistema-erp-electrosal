"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useState } from "react";
import { TransferForm } from "./transfer-form";

interface TransferModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  fromAccountId: string;
  onSave: () => void;
  accountType: "BRL" | "GOLD";
}

export function TransferModal({
  isOpen,
  onOpenChange,
  fromAccountId,
  onSave,
  accountType,
}: TransferModalProps) {
  const [transferType, setTransferType] = useState<"BRL" | "GOLD">(
    accountType
  );

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Realizar Transferência</DialogTitle>
          <DialogDescription>
            Selecione o tipo de transferência e preencha os detalhes.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <ToggleGroup
            type="single"
            value={transferType}
            onValueChange={(value: "BRL" | "GOLD") =>
              value && setTransferType(value)
            }
            className="grid grid-cols-2"
          >
            <ToggleGroupItem value="BRL">Real (R$)</ToggleGroupItem>
            <ToggleGroupItem value="GOLD">Ouro (g)</ToggleGroupItem>
          </ToggleGroup>
        </div>
        <TransferForm
          fromAccountId={fromAccountId}
          transferType={transferType}
          onSave={() => {
            onSave();
            onOpenChange(false);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}