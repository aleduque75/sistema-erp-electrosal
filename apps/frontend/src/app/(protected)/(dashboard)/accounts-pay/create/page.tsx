"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import api from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

export default function CreateAccountPayPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [formData, setFormData] = useState({
    description: "",
    amount: "",
    dueDate: "",
    paid: false,
    paidAt: "",
  });
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      await api.post("/accounts-pay", {
        ...formData,
        amount: parseFloat(formData.amount),
        paidAt: formData.paid ? formData.paidAt : null,
      });
      router.push("/accounts-pay");
    } catch (err: any) {
      setError(err.response?.data?.message || err.message);
    }
  };

  if (isLoading) return <p className="p-8">Carregando...</p>;

  return (
    <div className="p-4 md:p-8 flex justify-center">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Nova Conta a Pagar</CardTitle>
        </CardHeader>
        <CardContent>
          {error && <p className="text-destructive mb-4 text-sm">{error}</p>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Valor (R$)</Label>
              <Input
                type="number"
                step="0.01"
                id="amount"
                value={formData.amount}
                onChange={(e) =>
                  setFormData({ ...formData, amount: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dueDate">Data de Vencimento</Label>
              <Input
                type="date"
                id="dueDate"
                value={formData.dueDate}
                onChange={(e) =>
                  setFormData({ ...formData, dueDate: e.target.value })
                }
                required
              />
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <Checkbox
                id="paid"
                checked={formData.paid}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, paid: !!checked })
                }
              />
              <Label htmlFor="paid">Já está pago?</Label>
            </div>

            {formData.paid && (
              <div className="space-y-2">
                <Label htmlFor="paidAt">Data do Pagamento</Label>
                <Input
                  type="date"
                  id="paidAt"
                  value={formData.paidAt}
                  onChange={(e) =>
                    setFormData({ ...formData, paidAt: e.target.value })
                  }
                />
              </div>
            )}

            <div className="flex items-center justify-between pt-4">
              <Button type="submit">Criar Conta</Button>
              <Link
                href="/accounts-pay"
                className="text-sm text-muted-foreground hover:underline"
              >
                Cancelar
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
