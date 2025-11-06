// apps/frontend/src/app/(dashboard)/producao/reacoes-quimicas/components/reaction-details-modal.tsx
'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

import { useState, useEffect } from "react";
import { getChemicalReactionById } from "@/services/chemicalReactionsApi";
import { ProductionStepClientBlock } from "../[id]/components/production-step-client-block";
import { ImageUpload } from "@/components/shared/ImageUpload";

// NOTA: Esta interface DEVE existir em '@/services/chemicalReactionsApi.ts'
// Garanta que ela tenha todos os campos abaixo, especialmente outputProductGrams e updatedAt.
export interface ChemicalReactionDetails {
    id: string;
    createdAt: string;
    updatedAt: string | null;
    status: 'STARTED' | 'PROCESSING' | 'PENDING_PURITY' | 'PENDING_PURITY_ADJUSTMENT' | 'COMPLETED' | 'CANCELED' | string;
    auUsedGrams: number;
    outputProductGrams: number; // CAMPO QUE ESTAVA FALTANDO
    
    productionBatch?: {
        batchNumber: string;
        product: { name: string; };
    } | null;

    lots: Array<{
        id: string;
        initialGrams: number;
        remainingGrams: number;
        gramsToUse: number;
        description: string | null;
        notes: string | null;
    }>;
}


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

interface ReactionDetailsModalProps {
  reaction: ChemicalReactionDetails | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ReactionDetailsModal({ reaction, isOpen, onClose }: ReactionDetailsModalProps) {

  const [currentReaction, setCurrentReaction] = useState<ChemicalReactionDetails | null>(reaction);

  const totalGramsToUse = currentReaction?.lots.reduce((acc, lot) => acc + (lot.gramsToUse || 0), 0) || 0;



  // Update currentReaction when the prop changes

  useEffect(() => {

    setCurrentReaction(reaction);

  }, [reaction]);



  if (!currentReaction) return null;



  return (

    <Dialog open={isOpen} onOpenChange={onClose}>

      <DialogContent className="max-w-2xl">

        <DialogHeader>

          <DialogTitle>Detalhes da Reação</DialogTitle>

        </DialogHeader>

        <div className="space-y-6 p-4">

          <div className="flex justify-between items-center">

            <p className="text-sm text-muted-foreground">ID: {currentReaction.id}</p>

            <Badge variant={statusVariantMap[currentReaction.status]} className="text-lg">{currentReaction.status.replace('_', ' ')}</Badge>

          </div>



          <Separator />



          <div>

            <h3 className="font-semibold text-lg mb-2">Insumos</h3>

            <div className="grid gap-2">

              <p><strong>Ouro Utilizado:</strong> {formatGrams(totalGramsToUse)}</p>

              {currentReaction.lots && currentReaction.lots.length > 0 ? (

                <div className="mt-2">

                  <p className="font-medium text-sm text-muted-foreground">Lotes de Metal (Insumo):</p>

                  <ul className="list-disc list-inside ml-4 text-sm">

                    {currentReaction.lots.map(lot => (

                      <li key={lot.id}>

                        Lote {lot.id.substring(0, 8)} ({lot.description || '-'}) - {formatGrams(lot.gramsToUse)} (Restante: {formatGrams(lot.remainingGrams)})

                      </li>

                    ))}

                  </ul>

                </div>

              ) : (

                <p className="text-sm text-muted-foreground">Nenhum lote de metal utilizado como insumo.</p>

              )}

            </div>

          </div>



          <Separator />



          <div>

            <h3 className="font-semibold text-lg mb-2">Resultados</h3>

            <div className="grid gap-2">

              <p><strong>Lote Gerado:</strong> {currentReaction.productionBatch?.batchNumber}</p>

              <p><strong>Produto:</strong> {currentReaction.productionBatch?.product.name}</p>

              <p><strong>Quantidade Produzida:</strong> {formatGrams(currentReaction.outputProductGrams)}</p>

            </div>

          </div>



          <Separator />



          <div>

            <h3 className="font-semibold text-lg mb-2">Datas</h3>

            <div className="grid gap-2">

              <p><strong>Iniciada em:</strong> {formatDate(currentReaction.createdAt)}</p>

              <p><strong>Finalizada em:</strong> {currentReaction.status === 'COMPLETED' ? formatDate(currentReaction.updatedAt) : '-'}</p>

            </div>

          </div>



          <Separator />



          <div>

            <h3 className="font-semibold text-lg mb-2">Imagens</h3>

            <ImageUpload entity={{ type: 'chemicalReaction', id: currentReaction.id }} />

          </div>

        </div>

      </DialogContent>

    </Dialog>

  );

}