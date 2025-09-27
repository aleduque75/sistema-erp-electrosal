import { getReactionById, ReactionDetails } from "@/lib/api/chemical-reactions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FinalizeReactionClientBlock } from "./components/finalize-reaction-client-block";

// Helper para formatação
const formatGrams = (grams: number) => new Intl.NumberFormat('pt-BR', { style: 'unit', unit: 'gram', minimumFractionDigits: 2 }).format(grams);
const formatDate = (date: string | null) => date ? new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-';

const statusVariantMap: { [key in ReactionDetails['status']]: 'default' | 'secondary' | 'destructive' | 'outline' } = {
  STARTED: 'secondary',
  PROCESSING: 'secondary',
  PENDING_PURITY: 'secondary',
  FINALIZED: 'default',
  CANCELED: 'destructive',
};

export default async function ReactionDetailPage({ params }: { params: { id: string } }) {
  const reaction = await getReactionById(params.id).catch(() => notFound());

  return (
    <div className="space-y-4 p-4 md:p-8">
      {/* Cabeçalho */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/producao/reacoes-quimicas">
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
                <p>Finalizada em: {formatDate(reaction.endedAt)}</p>
              </div>
            </CardContent>
          </Card>
          
          {reaction.status !== 'FINALIZED' && reaction.status !== 'CANCELED' && (
            <FinalizeReactionClientBlock reactionId={reaction.id} />
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
              <p><strong>Conta de Origem:</strong> {reaction.sourceMetalAccount?.name || 'N/A'}</p>
              <div>
                <strong>Sobras Consumidas:</strong>
                {reaction.leftoversUsed.length > 0 ? (
                  <ul className="list-disc pl-5 mt-1">
                    {reaction.leftoversUsed.map(l => <li key={l.id}>{`${l.type}: ${formatGrams(l.grams)}`}</li>)}
                  </ul>
                ) : <p className="text-sm text-muted-foreground">Nenhuma</p>}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Resultados da Reação</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {reaction.status === 'FINALIZED' ? (
                <>
                  <p><strong>Lote Gerado:</strong> {reaction.productionBatch?.batchNumber}</p>
                  <p><strong>Produto:</strong> {reaction.productionBatch?.product.name}</p>
                  <div>
                    <strong>Novas Sobras:</strong>
                    {reaction.leftoversProduced.length > 0 ? (
                      <ul className="list-disc pl-5 mt-1">
                        {reaction.leftoversProduced.map(l => <li key={l.id}>{`${l.type}: ${formatGrams(l.grams)}`}</li>)}
                      </ul>
                    ) : <p className="text-sm text-muted-foreground">Nenhuma</p>}
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Aguardando finalização da reação...</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}