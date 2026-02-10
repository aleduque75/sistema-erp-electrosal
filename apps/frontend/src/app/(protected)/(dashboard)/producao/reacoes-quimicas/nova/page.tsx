import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { NewReactionForm } from "./components/new-reaction-form";

export default function NewChemicalReactionPage() {
  return (
    <div className="space-y-4 p-4 md:p-8">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/producao/reacoes-quimicas">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Iniciar Nova Reação</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Insumos da Reação</CardTitle>
          <CardDescription>
            Selecione os insumos para iniciar uma nova reação química.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <NewReactionForm />
        </CardContent>
      </Card>
    </div>
  );
}