// Crie este arquivo em: apps/frontend/src/app/(dashboard)/credit-cards/[id]/edit/page.tsx

"use client";

import { CreditCardForm } from "@/app/(dashboard)/credit-cards/credit-card-form"; // Ajuste o caminho se necessário
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import { toast } from "sonner"; // Added
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Interface para tipar os dados do cartão
interface CreditCard {
  id: string;
  name: string;
  flag: string;
  closingDay: number;
  dueDate: number;
  contaContabilPassivoId?: string | null;
}

export default function EditCreditCardPage() {
  const router = useRouter();
  const params = useParams();
  const cardId = params?.id as string;

  const [card, setCard] = useState<CreditCard | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (cardId) {
      api
        .get(`/credit-cards/${cardId}`)
        .then((res) => setCard(res.data))
        .catch(() => toast.error("Falha ao carregar dados do cartão."))
        .finally(() => setIsLoading(false));
    }
  }, [cardId]);

  if (isLoading)
    return <p className="text-center p-10">Carregando dados do cartão...</p>;
  if (!card) return <p className="text-center p-10">Cartão não encontrado.</p>;

  return (
    <Card className="mx-auto my-8 max-w-2xl">
      <CardHeader>
        <CardTitle>Editar Cartão de Crédito</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Passa os dados carregados da API para o formulário */}
        <CreditCardForm
          initialData={card}
          onSave={() => router.push("/credit-cards")}
        />
      </CardContent>
    </Card>
  );
}
