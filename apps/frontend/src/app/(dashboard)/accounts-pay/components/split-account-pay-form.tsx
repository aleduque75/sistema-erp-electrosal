"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface SplitAccountPayFormProps {
  onSave: (numberOfInstallments: number) => void;
}

export function SplitAccountPayForm({ onSave }: SplitAccountPayFormProps) {
  const [installments, setInstallments] = useState(2);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (installments > 1) {
      onSave(installments);
    } else {
      alert("O número de parcelas deve ser maior que 1.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="installments">Dividir em quantas parcelas?</Label>
        <Input
          id="installments"
          type="number"
          min="2"
          value={installments}
          onChange={(e) => setInstallments(parseInt(e.target.value, 10))}
        />
      </div>
      <Button type="submit" className="w-full">Confirmar Parcelamento</Button>
    </form>
  );
}