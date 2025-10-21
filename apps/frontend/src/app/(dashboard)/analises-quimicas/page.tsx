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
import { AnaliseQuimica } from '@/types/analise-quimica';
import { StatusLegend } from "@/components/analises-quimicas/StatusLegend";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { TipoMetal } from "@/types/tipo-metal";

export default function AnalisesQuimicasPage() {
  const [analises, setAnalises] = useState<AnaliseQuimica[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [metalTypeFilter, setMetalTypeFilter] = useState<string>("all");

  const fetchAnalises = useCallback(async (metalType: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (metalType && metalType !== 'all') {
        params.append('metalType', metalType);
      }
      const data = await getAnalisesQuimicas(params.toString());
      setAnalises(data);
    } catch (err) {
      setError("Falha ao carregar as análises. Tente novamente mais tarde.");
      setAnalises([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalises(metalTypeFilter);
  }, [fetchAnalises, metalTypeFilter]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Análises Químicas</h1>
        <NovaAnaliseModal onAnaliseCreated={() => fetchAnalises(metalTypeFilter)} />
      </div>

      <StatusLegend />

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
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-full md:w-1/4">
            <Label>Filtrar por Metal</Label>
            <Select value={metalTypeFilter} onValueChange={setMetalTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um metal..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value={TipoMetal.AU}>Ouro (AU)</SelectItem>
                <SelectItem value={TipoMetal.AG}>Prata (AG)</SelectItem>
                <SelectItem value={TipoMetal.RH}>Ródio (RH)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

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
