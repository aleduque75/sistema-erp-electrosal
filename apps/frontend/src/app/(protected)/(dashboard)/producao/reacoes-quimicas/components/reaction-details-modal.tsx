import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Activity,
  Zap,
  Box,
  Clock,
  Image as ImageIcon,
  FlaskConical,
  Database,
  Pencil,
  Check,
  Loader2,
  Printer
} from "lucide-react";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { ImageUpload } from "@/components/shared/ImageUpload";
import { ImageGallery } from "@/components/shared/ImageGallery";
import { cn } from "@/lib/utils";
import { Media } from "@/types/media";
import { getChemicalReactionById, updateChemicalReaction } from "@/services/chemicalReactionsApi";
import { updatePureMetalLot } from "@/services/pureMetalLotsApi";

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
    pureMetalLotId?: string;
    lotNumber?: string;
    initialGrams: number;
    remainingGrams: number;
    gramsToUse: number;
    description: string | null;
    notes: string | null;
  }>;

  rawMaterialsUsed: Array<{
    id: string;
    quantity: number;
    cost: number;
    rawMaterial: {
      name: string;
      unit: string;
    };
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
  onUpdate?: () => void;
  onPrintPdf?: (reactionId: string) => void;
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

export function ReactionDetailsModal({ reaction, isOpen, onClose, onUpdate, onPrintPdf }: ReactionDetailsModalProps) {
  const [currentReaction, setCurrentReaction] = useState<ChemicalReactionDetails | null>(reaction);

  // Estados de edição de histórico/detalhes dos lotes
  const [editingLotId, setEditingLotId] = useState<string | null>(null);
  const [editingLotText, setEditingLotText] = useState<string>('');
  const [isSavingLot, setIsSavingLot] = useState<boolean>(false);

  // Estados de edição de observações da reação
  const [isEditingNotes, setIsEditingNotes] = useState<boolean>(false);
  const [editingNotesText, setEditingNotesText] = useState<string>('');
  const [isSavingNotes, setIsSavingNotes] = useState<boolean>(false);

  useEffect(() => {
    setCurrentReaction(reaction);
    setEditingLotId(null);
    setIsEditingNotes(false);
  }, [reaction]);

  const refreshReaction = async () => {
    if (currentReaction?.id) {
      try {
        const updatedReaction = await getChemicalReactionById(currentReaction.id);
        setCurrentReaction(updatedReaction as unknown as ChemicalReactionDetails);
      } catch (error) {
        console.error("Failed to refresh reaction details", error);
      }
    }
  };

  const handleSaveLotDescription = async (lotId: string) => {
    if (!lotId) return;
    setIsSavingLot(true);
    try {
      const trimmedText = editingLotText.trim();
      await updatePureMetalLot(lotId, {
        description: trimmedText || null,
        notes: trimmedText || undefined,
      });
      toast.success("Histórico/detalhes do lote atualizados com sucesso!");
      setEditingLotId(null);
      await refreshReaction();
      onUpdate?.();
    } catch (error) {
      console.error("Erro ao salvar histórico do lote:", error);
      toast.error("Falha ao salvar detalhes do lote.");
    } finally {
      setIsSavingLot(false);
    }
  };

  const handleSaveReactionNotes = async () => {
    if (!currentReaction) return;
    setIsSavingNotes(true);
    try {
      const trimmedText = editingNotesText.trim();
      await updateChemicalReaction(currentReaction.id, {
        notes: trimmedText || undefined,
      });
      toast.success("Observações atualizadas com sucesso!");
      setIsEditingNotes(false);
      await refreshReaction();
      onUpdate?.();
    } catch (error) {
      console.error("Erro ao salvar observações:", error);
      toast.error("Falha ao salvar observações.");
    } finally {
      setIsSavingNotes(false);
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
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-tight">Detalhamento dos Lotes:</p>
                    <span className="text-[10px] text-muted-foreground">Clique no lápis para editar histórico/origem</span>
                  </div>
                  <div className="max-h-[220px] overflow-y-auto pr-2 space-y-2">
                    {currentReaction.lots.map((lot: any) => {
                      const lotId = lot.id || lot.pureMetalLotId;
                      const isEditing = editingLotId === lotId;
                      const currentDesc = lot.description || lot.notes || '';

                      return (
                        <div key={lotId} className="flex flex-col py-2 border-b last:border-0 gap-1.5">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-semibold text-xs">
                              Lote {lot.lotNumber || (lotId || '').substring(0, 8)}
                            </span>
                            <Badge variant="secondary" className="text-xs font-mono">
                              {formatGrams(lot.gramsToUse)}
                            </Badge>
                          </div>

                          {isEditing ? (
                            <div className="space-y-1.5 pt-1">
                              <Input
                                value={editingLotText}
                                onChange={(e) => setEditingLotText(e.target.value)}
                                placeholder="Descrição / Histórico de origem do lote..."
                                className="h-8 text-xs bg-background"
                                autoFocus
                                disabled={isSavingLot}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleSaveLotDescription(lotId);
                                  if (e.key === 'Escape') setEditingLotId(null);
                                }}
                              />
                              <div className="flex items-center justify-end gap-1.5">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 px-2 text-xs"
                                  onClick={() => setEditingLotId(null)}
                                  disabled={isSavingLot}
                                >
                                  Cancelar
                                </Button>
                                <Button
                                  size="sm"
                                  className="h-6 px-2 text-xs gap-1"
                                  onClick={() => handleSaveLotDescription(lotId)}
                                  disabled={isSavingLot}
                                >
                                  {isSavingLot ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                                  Salvar
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-start justify-between gap-2 group">
                              <span className="text-[11px] text-muted-foreground italic break-words flex-1 leading-snug">
                                {currentDesc || 'Sem descrição'}
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setEditingLotId(lotId);
                                  setEditingLotText(currentDesc);
                                }}
                                className="h-6 w-6 p-0 text-muted-foreground hover:text-primary transition-opacity"
                                title="Editar histórico / descrição do lote"
                              >
                                <Pencil className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {currentReaction.rawMaterialsUsed && currentReaction.rawMaterialsUsed.length > 0 && (
                  <div className="space-y-2 mt-4 pt-4 border-t border-dashed">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-tight">Outros Insumos (Químicos):</p>
                    <div className="max-h-[150px] overflow-y-auto pr-2">
                      {currentReaction.rawMaterialsUsed.map(item => (
                        <div key={item.id} className="flex items-center justify-between py-2 text-sm border-b last:border-0 border-muted/20">
                          <div className="flex flex-col">
                            <span className="font-medium">{item.rawMaterial.name}</span>
                          </div>
                          <Badge variant="outline" className="font-mono">{item.quantity} {item.rawMaterial.unit}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
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

                    <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/40 rounded-md border border-blue-100 dark:border-blue-900/50 flex items-center justify-between">
                      <span className="text-xs font-semibold text-blue-700 dark:text-blue-400 uppercase">Rendimento Metal</span>
                      <span className="font-bold text-blue-800 dark:text-blue-300">{formatGrams(currentReaction.outputProductGrams * (currentReaction.productionBatch?.product.goldValue || 0))}</span>
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

                <div className="mt-4 pt-3 border-t">
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-xs font-bold text-muted-foreground uppercase">Observações:</p>
                    {!isEditingNotes && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-[11px] text-primary hover:text-primary gap-1"
                        onClick={() => {
                          setIsEditingNotes(true);
                          setEditingNotesText(currentReaction.notes || '');
                        }}
                      >
                        <Pencil className="h-3 w-3" />
                        {currentReaction.notes ? 'Editar' : 'Adicionar'}
                      </Button>
                    )}
                  </div>

                  {isEditingNotes ? (
                    <div className="space-y-2">
                      <Textarea
                        value={editingNotesText}
                        onChange={(e) => setEditingNotesText(e.target.value)}
                        placeholder="Escreva observações sobre esta reação..."
                        className="text-xs bg-background min-h-[70px]"
                        disabled={isSavingNotes}
                        autoFocus
                      />
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 px-2 text-xs"
                          onClick={() => setIsEditingNotes(false)}
                          disabled={isSavingNotes}
                        >
                          Cancelar
                        </Button>
                        <Button
                          size="sm"
                          className="h-6 px-2 text-xs gap-1"
                          onClick={handleSaveReactionNotes}
                          disabled={isSavingNotes}
                        >
                          {isSavingNotes ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                          Salvar
                        </Button>
                      </div>
                    </div>
                  ) : currentReaction.notes ? (
                    <div className="p-3 bg-muted/50 rounded border text-xs whitespace-pre-wrap">
                      {currentReaction.notes}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground italic">Nenhuma observação registrada.</p>
                  )}
                </div>
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

        <div className="flex justify-between items-center p-4 bg-background border-t">
          {onPrintPdf ? (
            <Button
              variant="outline"
              size="sm"
              className="gap-2 text-xs"
              onClick={() => onPrintPdf(currentReaction.id)}
            >
              <Printer className="h-4 w-4" />
              Imprimir Relatório (PDF)
            </Button>
          ) : <div />}
          <Button variant="ghost" onClick={onClose}>Fechar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}