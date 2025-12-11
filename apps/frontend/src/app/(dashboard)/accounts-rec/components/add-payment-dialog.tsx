"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"

interface AddPaymentDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onSelectPaymentType: (type: 'financial' | 'metalCredit' | 'metal') => void
}

export function AddPaymentDialog({ isOpen, onOpenChange, onSelectPaymentType }: AddPaymentDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Adicionar Pagamento</DialogTitle>
          <DialogDescription>
            Selecione o tipo de pagamento que deseja adicionar.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Button
            variant="outline"
            onClick={() => {
              onSelectPaymentType('financial');
              onOpenChange(false);
            }}
          >
            Pagamento Financeiro (R$)
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              onSelectPaymentType('metalCredit');
              onOpenChange(false);
            }}
          >
            Pagamento com Crédito de Metal (g)
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              onSelectPaymentType('metal');
              onOpenChange(false);
            }}
          >
            Pagamento com Metal Físico (g)
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
