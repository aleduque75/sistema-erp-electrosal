"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NewSaleForm } from "../components/NewSaleForm"; // Importa o formulário

export default function CreateSalePage() {
  const router = useRouter();

  return (
    <Card className="m-4">
      <CardHeader>
        <CardTitle className="text-2xl">Registrar Nova Venda</CardTitle>
      </CardHeader>
      <CardContent className="h-[85vh]">
        <NewSaleForm onSave={() => router.push('/sales')} />
      </CardContent>
    </Card>
  );
}