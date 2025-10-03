// apps/frontend/src/app/(dashboard)/producao/reacoes-quimicas/[id]/page.tsx

import { getChemicalReactionById, ChemicalReactionDetails } from "@/services/chemicalReactionsApi";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductionStepClientBlock } from "./components/production-step-client-block";
import { AdjustPurityClientBlock } from "./components/adjust-purity-client-block";

// Helper para formatação
const formatGrams = (grams: number) => new Intl.NumberFormat('pt-BR', { style: 'unit', unit: 'gram', minimumFractionDigits: 2 }).format(grams);
const formatDate = (date: string | null) => date ? new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-';

const statusVariantMap: { [key in ChemicalReactionDetails['status']]: 'default' | 'secondary' | 'destructive' | 'outline' } = {
  STARTED: 'secondary',
  PROCESSING: 'secondary',
  PENDING_PURITY: 'secondary',
  PENDING_PURITY_ADJUSTMENT: 'secondary',
  COMPLETED: 'default',
  CANCELED: 'destructive',
};

export default async function ReactionDetailPage({ params }: { params: { id: string } }) {
  // Nota: A tipagem de `reaction` agora deve incluir `finishedAt` e `outputProductGrams`
  // A lógica do lado do servidor (API) deve garantir que esses campos sejam retornados
  type ReactionWithFinishedAt = ChemicalReactionDetails & { 
    finishedAt?: string | null;
    outputProductGrams?: number;
  };
  const reaction: ReactionWithFinishedAt = await getChemicalReactionById(params.id).catch(() => notFound());

  return (
    <div className="space-y-4 p-4 md:p-8">
      {/* Cabeçalho */}
      <div className="flex items-center gap-4">
        <Link href="/producao/reacoes-quimicas">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Detalhes da Reação</h1>
          <p className="text-sm text-muted-foreground">ID: {reaction.id}</p>
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        {/* Coluna Esquerda - Status e Ações */}
        <div className="md:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Badge variant={statusVariantMap[reaction.status]} className="text-lg">{reaction.status.replace('_', ' ')}</Badge>
              <div className="text-sm text-muted-foreground">
                <p>Iniciada em: {formatDate(reaction.createdAt)}</p>
                {/* LÓGICA CORRIGIDA: Usa reaction.finishedAt */}
                <p>Finalizada em: {reaction.status === 'COMPLETED' ? formatDate(reaction.finishedAt ?? null) : '-'}</p>
              </div>
            </CardContent>
          </Card>
          
          {(reaction.status === 'STARTED' || reaction.status === 'PROCESSING') && (
            <ProductionStepClientBlock reactionId={reaction.id} auUsedGrams={reaction.auUsedGrams} />
          )}

          {reaction.status === 'PENDING_PURITY_ADJUSTMENT' && (
            <AdjustPurityClientBlock reactionId={reaction.id} />
          )}
        </div>

        {/* Coluna Direita - Detalhes */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Insumos Utilizados</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p><strong>Ouro Utilizado:</strong> {formatGrams(reaction.auUsedGrams)}</p>
              {/* ... (outros detalhes de insumos) */}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Resultados da Reação</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {(reaction.status === 'PENDING_PURITY_ADJUSTMENT' || reaction.status === 'COMPLETED') ? (
                <>
                  <p><strong>Lote Gerado:</strong> {reaction.productionBatch?.batchNumber}</p>
                  <p><strong>Produto:</strong> {reaction.productionBatch?.product.name}</p>
                  <p><strong>Quantidade Produzida:</strong> {reaction.outputProductGrams !== undefined ? formatGrams(reaction.outputProductGrams) : '-'}</p>
                  {/* ... (outros detalhes de resultados) */}
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Aguardando finalização da produção...</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}