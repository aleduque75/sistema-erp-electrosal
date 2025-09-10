"use client";

import { useEffect, useState, useCallback } from "react";
import { NovaAnaliseModal } from "@/components/analises-quimicas/NovaAnaliseModal";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AnalisesQuimicasTable } from "@/components/analises-quimicas/AnalisesQuimicasTable";
import { getAnalisesQuimicas } from "@/services/analisesApi";
import { AnaliseQuimica } from "@/types/analise-quimica";

export default function AnalisesQuimicasPage() {
  const [analises, setAnalises] = useState<AnaliseQuimica[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalises = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getAnalisesQuimicas();
      setAnalises(data);
    } catch (err) {
      setError("Falha ao carregar as análises. Tente novamente mais tarde.");
      setAnalises([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalises();
  }, [fetchAnalises]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Análises Químicas</h1>
        <NovaAnaliseModal onAnaliseCreated={fetchAnalises} />
      </div>

      {error && (
        <Card className="border-destructive bg-destructive/10">
          <CardHeader>
            <CardTitle className="text-destructive">Erro</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Lista de Análises</CardTitle>
          <CardDescription>
            Gerencie as análises químicas pendentes e concluídas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AnalisesQuimicasTable
            analises={analises}
            isLoading={isLoading}
            onAnaliseUpdated={fetchAnalises}
          />
        </CardContent>
      </Card>
    </div>
  );
}
