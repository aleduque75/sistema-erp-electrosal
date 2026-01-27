import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Activity, 
  Zap, 
  Box, 
  Clock, 
  Image as ImageIcon, 
  X, 
  ArrowRight,
  FlaskConical,
  Database
} from "lucide-react";

import { useState, useEffect } from "react";
import { ImageUpload } from "@/components/shared/ImageUpload";
import { ImageGallery } from "@/components/shared/ImageGallery";
import { cn } from "@/lib/utils";
import { Media } from "@/types/media";
import { getChemicalReactionById } from "@/services/chemicalReactionsApi";

// NOTA: Esta interface DEVE existir em '@/services/chemicalReactionsApi.ts'
export interface ChemicalReactionDetails {
    id: string;
    reactionNumber: string;
    createdAt: string;
    updatedAt: string | null;
    reactionDate: string | null;
    status: 'STARTED' | 'PROCESSING' | 'PENDING_PURITY' | 'PENDING_PURITY_ADJUSTMENT' | 'COMPLETED' | 'CANCELED' | string;
    auUsedGrams: number;
    outputProductGrams: number;
    metalType: string;
    notes?: string | null;
    medias: Media[];
    
    productionBatch?: {
        batchNumber: string;
        product: { name: string; goldValue: number };
    } | null;

    lots: Array<{
        id: string;
        lotNumber?: string;
        initialGrams: number;
        remainingGrams: number;
        gramsToUse: number;
        description: string | null;
        notes: string | null;
    }>;
}

const formatGrams = (grams: number) => new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 4, maximumFractionDigits: 4 }).format(grams) + " g";
const formatDate = (date: string | null) => date ? new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-';

const statusVariantMap: { [key in ChemicalReactionDetails['status']]: 'default' | 'secondary' | 'destructive' | 'outline' } = {
  STARTED: 'secondary',
  PROCESSING: 'secondary',
  PENDING_PURITY: 'secondary',
  PENDING_PURITY_ADJUSTMENT: 'secondary',
  COMPLETED: 'default',
  CANCELED: 'destructive',
};

const statusLabelMap: Record<string, string> = {
  STARTED: 'Iniciada',
  PROCESSING: 'Em Processamento',
  PENDING_PURITY: 'Aguardando Pureza',
  PENDING_PURITY_ADJUSTMENT: 'Aguardando Ajuste',
  COMPLETED: 'Finalizada',
  CANCELED: 'Cancelada',
};

interface ReactionDetailsModalProps {
  reaction: ChemicalReactionDetails | null;
  isOpen: boolean;
  onClose: () => void;
}

const DetailRow = ({ label, value, icon: Icon, className = "" }: { label: string; value: React.ReactNode; icon?: any; className?: string }) => (
  <div className={cn("flex items-center justify-between py-2 border-b last:border-0", className)}>
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      {Icon && <Icon className="h-4 w-4" />}
      <span>{label}</span>
    </div>
    <div className="font-medium text-sm">{value}</div>
  </div>
);

export function ReactionDetailsModal({ reaction, isOpen, onClose }: ReactionDetailsModalProps) {
  const [currentReaction, setCurrentReaction] = useState<ChemicalReactionDetails | null>(reaction);

  useEffect(() => {
    setCurrentReaction(reaction);
  }, [reaction]);

  const refreshReaction = async () => {
    if (currentReaction?.id) {
        try {
            // @ts-ignore - Ignoring type mismatch for now as local interface might differ slightly
            const updatedReaction = await getChemicalReactionById(currentReaction.id);
            // @ts-ignore
            setCurrentReaction(updatedReaction);
        } catch (error) {
            console.error("Failed to refresh reaction details", error);
        }
    }
  };

  if (!currentReaction) return null;

  const totalGramsToUse = currentReaction.lots.reduce((acc, lot) => acc + (lot.gramsToUse || 0), 0) || 0;
  const statusLabel = statusLabelMap[currentReaction.status] || currentReaction.status;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange => !onOpenChange && onClose()}>
      <DialogContent className="sm:max-w-4xl p-0 gap-0 overflow-hidden bg-muted/5">
        <DialogHeader className="p-6 pb-2 bg-background border-b relative">
          <div className="flex items-center justify-between pr-8">
            <div className="space-y-1">
              <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                Reação #{currentReaction.reactionNumber}
                <Badge variant={statusVariantMap[currentReaction.status] as any}>{statusLabel}</Badge>
              </DialogTitle>
              <p className="text-xs text-muted-foreground font-mono">ID: {currentReaction.id}</p>
            </div>
            <Badge variant="outline" className="text-lg px-4 py-1">{currentReaction.metalType}</Badge>
          </div>
          <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
            <X className="h-4 w-4" />
            <span className="sr-only">Fechar</span>
          </DialogClose>
        </DialogHeader>

        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Insumos */}
            <Card className="h-full">
              <CardHeader className="pb-3 border-b bg-muted/10">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Zap className="h-4 w-4 text-yellow-500" /> Insumos (Metal)
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="bg-primary/5 p-4 rounded-lg border border-primary/10 flex flex-col items-center">
                  <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1">Total Utilizado</span>
                  <span className="text-2xl font-bold text-primary">{formatGrams(totalGramsToUse)}</span>
                  <span className="text-[10px] text-muted-foreground">{currentReaction.metalType} Puro</span>
                </div>

                <div className="space-y-2 mt-4">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-tight">Detalhamento dos Lotes:</p>
                  <div className="max-h-[150px] overflow-y-auto pr-2">
                    {currentReaction.lots.map(lot => (
                      <div key={lot.id} className="flex items-center justify-between py-2 text-sm border-b last:border-0">
                        <div className="flex flex-col">
                          <span className="font-semibold">Lote {lot.lotNumber || lot.id.substring(0, 8)}</span>
                          <span className="text-[10px] text-muted-foreground italic">{lot.description || 'Sem descrição'}</span>
                        </div>
                        <Badge variant="secondary">{formatGrams(lot.gramsToUse)}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Resultados */}
            <Card className="h-full">
              <CardHeader className="pb-3 border-b bg-muted/10">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Box className="h-4 w-4 text-blue-500" /> Resultados da Produção
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-1">
                {currentReaction.status === 'COMPLETED' ? (
                  <>
                    <DetailRow label="Produto Final" value={currentReaction.productionBatch?.product.name} icon={FlaskConical} />
                    <DetailRow label="Lote Gerado" value={<Badge className="font-mono">{currentReaction.productionBatch?.batchNumber}</Badge>} icon={Database} />
                    <DetailRow label="Peso Bruto (Sal)" value={new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2 }).format(currentReaction.outputProductGrams) + " g"} icon={Activity} />
                    
                    <div className="mt-4 p-3 bg-blue-50 rounded-md border border-blue-100 flex items-center justify-between">
                      <span className="text-xs font-semibold text-blue-700 uppercase">Rendimento Metal</span>
                      <span className="font-bold text-blue-800">{formatGrams(currentReaction.outputProductGrams * (currentReaction.productionBatch?.product.goldValue || 0))}</span>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground italic text-sm text-center">
                    <Activity className="h-8 w-8 mb-2 opacity-20" />
                    Produção ainda não finalizada.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Cronologia */}
            <Card>
              <CardHeader className="pb-3 border-b bg-muted/10">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Clock className="h-4 w-4 text-green-500" /> Cronologia e Observações
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <DetailRow label="Iniciada em" value={formatDate(currentReaction.createdAt)} />
                <DetailRow label="Data da Reação" value={currentReaction.reactionDate ? new Date(currentReaction.reactionDate).toLocaleDateString('pt-BR') : '-'} />
                <DetailRow label="Última Atualização" value={formatDate(currentReaction.updatedAt)} />
                
                {currentReaction.notes && (
                  <div className="mt-4">
                    <p className="text-xs font-bold text-muted-foreground uppercase mb-1">Observações:</p>
                    <div className="p-3 bg-muted/50 rounded border text-sm">{currentReaction.notes}</div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Imagens */}
            <Card>
              <CardHeader className="pb-3 border-b bg-muted/10">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <ImageIcon className="h-4 w-4 text-purple-500" /> Mídias e Imagens
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <ImageUpload 
                    entity={{ type: 'chemicalReaction', id: currentReaction.id }} 
                    onMediaUploadSuccess={() => refreshReaction()}
                />
                
                {currentReaction.medias && currentReaction.medias.length > 0 && (
                    <ImageGallery 
                        media={currentReaction.medias} 
                        onDeleteSuccess={refreshReaction} 
                    />
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="flex justify-end gap-2 p-4 bg-background border-t">
          <Button variant="ghost" onClick={onClose}>Fechar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}