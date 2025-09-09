"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, PlusCircle } from "lucide-react";
import { LancarResultadoModal } from "@/components/analises-quimicas/LancarResultadoModal";

// Importe outros componentes de UI conforme necessário

// TODO: Ajuste a URL da API conforme seu backend
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

interface AnaliseQuimica {
  id: string;
  numeroAnalise: string;
  nomeCliente?: string;
  dataEntrada: string;
  descricaoMaterial: string;
  status: string;
}

export default function AnalisesQuimicasPage() {
  const [analises, setAnalises] = useState<AnaliseQuimica[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [analiseParaLancar, setAnaliseParaLancar] = useState<AnaliseQuimica | null>(null);

  useEffect(() => {
    async function fetchAnalises() {
      setIsLoading(true);
      try {
        const res = await fetch(`${API_URL}/analises-quimicas`);
        if (!res.ok) throw new Error("Erro ao buscar análises químicas");
        setAnalises(await res.json());
      } catch (err) {
        // TODO: Adicione feedback visual
        setAnalises([]);
      } finally {
        setIsLoading(false);
      }
    }
    fetchAnalises();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Análises Químicas</h1>
        <Button /* onClick={} */>
          <PlusCircle className="mr-2 h-4 w-4" /> Nova Análise
        </Button>
      </div>
      {isLoading ? (
        <div className="flex items-center justify-center min-h-[200px]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr>
                <th className="px-4 py-2">Nº Análise</th>
                <th className="px-4 py-2">Cliente</th>
                <th className="px-4 py-2">Data Entrada</th>
                <th className="px-4 py-2">Material</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {analises.map((a) => (
                <tr key={a.id} className="border-b">
                  <td className="px-4 py-2">{a.numeroAnalise}</td>
                  <td className="px-4 py-2">{a.nomeCliente}</td>
                  <td className="px-4 py-2">{a.dataEntrada}</td>
                  <td className="px-4 py-2">{a.descricaoMaterial}</td>
                  <td className="px-4 py-2">{a.status}</td>
                  <td className="px-4 py-2 text-right">
                    <Button size="sm" variant="outline" onClick={() => setAnaliseParaLancar(a)}>
                      Lançar Resultado
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <LancarResultadoModal
            isOpen={!!analiseParaLancar}
            onOpenChange={(open) => setAnaliseParaLancar(open ? analiseParaLancar : null)}
            analise={analiseParaLancar}
            onSuccess={() => {
              setAnaliseParaLancar(null);
              // Recarregar lista após lançamento
              (async () => {
                setIsLoading(true);
                try {
                  const res = await fetch(`${API_URL}/analises-quimicas`);
                  if (!res.ok) throw new Error("Erro ao buscar análises químicas");
                  setAnalises(await res.json());
                } catch {
                  setAnalises([]);
                } finally {
                  setIsLoading(false);
                }
              })();
            }}
          />
        </div>
      )}
    </div>
  );
}