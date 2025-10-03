"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Combobox } from "@/components/ui/combobox";
import { useTransfer } from "../hooks/use-transfer";

const transferSchema = z.object({
  toAccountId: z.string().min(1, "Campo obrigatório"),
  amount: z.coerce.number().positive("O valor deve ser positivo"),
  description: z.string().optional(),
});

interface TransferFormProps {
  fromAccountId: string;
  transferType: "BRL" | "GOLD";
  onSave: () => void;
}

export function TransferForm({ fromAccountId, transferType, onSave }: TransferFormProps) {
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(transferSchema),
    defaultValues: {
      toAccountId: "",
      amount: 0,
      description: "",
    },
  });

  const { accounts, isLoading, performTransfer } = useTransfer(transferType, fromAccountId);

  const onSubmit = async (data: z.infer<typeof transferSchema>) => {
    await performTransfer({ ...data, fromAccountId });
    onSave();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label>Conta de Destino</Label>
        <Controller
          name="toAccountId"
          control={control}
          render={({ field }) => (
            <Combobox
              options={accounts.map((acc) => ({ value: acc.id, label: acc.nome }))}
              value={field.value}
              onChange={field.onChange}
              placeholder="Selecione a conta de destino"
              disabled={isLoading}
            />
          )}
        />
        {errors.toAccountId && <p className="text-red-500 text-sm">{errors.toAccountId.message}</p>}
      </div>

      <div>
        <Label>Valor</Label>
        <Controller
          name="amount"
          control={control}
          render={({ field }) => <Input type="number" {...field} />}
        />
        {errors.amount && <p className="text-red-500 text-sm">{errors.amount.message}</p>}
      </div>

      <div>
        <Label>Descrição</Label>
        <Controller
          name="description"
          control={control}
          render={({ field }) => <Input {...field} />}
        />
      </div>

      <Button type="submit" disabled={isSubmitting || isLoading}>
        {isSubmitting ? "Transferindo..." : "Transferir"}
      </Button>
    </form>
  );
}