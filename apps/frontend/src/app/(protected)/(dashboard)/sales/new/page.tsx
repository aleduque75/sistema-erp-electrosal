"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NewSaleForm } from "../components/NewSaleForm";
import { PlusCircle } from "lucide-react";

export default function CreateSalePage() {
  const router = useRouter();

  return (
    <div className="p-3 md:p-6 max-w-[1600px] mx-auto min-h-[calc(100vh-4.5rem)] flex flex-col">
      <Card className="flex-1 flex flex-col overflow-hidden border shadow-sm">
        <CardHeader className="py-3 px-4 md:px-6 border-b bg-muted/10">
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <PlusCircle className="h-5 w-5 text-primary" />
            Registrar Nova Venda
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 p-3 md:p-5 overflow-hidden flex flex-col">
          <NewSaleForm onSave={() => router.push('/sales')} />
        </CardContent>
      </Card>
    </div>
  );
}