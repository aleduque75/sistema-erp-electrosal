'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { X, Check, Loader2 } from 'lucide-react';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { ImageUpload } from "@/components/shared/ImageUpload";
import { ImageGallery } from "@/components/shared/ImageGallery";
import { AddRawMaterialModal } from '@/app/(dashboard)/recovery-orders/[id]/add-raw-material-modal';
import { ApplyRecoveryOrderCommissionModal } from './ApplyRecoveryOrderCommissionModal';
import { EditableDateDetailItem } from './EditableDateDetailItem';

import { getMediaForRecoveryOrder } from "@/services/mediaApi";
import { getRecoveryOrderById, updateRecoveryOrder } from '@/services/recoveryOrdersApi';
import { Media } from "@/types/media";

interface RawMaterialUsed {
  id: string;
  rawMaterialId: string;
  rawMaterialName: string;
  quantity: number;
  cost: number;
  unit: string;
}

interface RecoveryOrder {
  id: string;
  orderNumber: string;
  descricao: string | null;
  status: string;
  metalType: string;
  totalBrutoEstimadoGramas: number;
  resultadoProcessamentoGramas?: number | null;
  teorFinal?: number | null;
  auPuroRecuperadoGramas: number | null;
  residuoGramas?: number | null;
  dataInicio: string | null;
  dataFim?: string | null;
  dataCriacao: string | null;
  salespersonId?: string;
  salespersonName?: string;
  commissionPercentage?: number;
  commissionAmount?: number;
  rawMaterialsUsed: RawMaterialUsed[];
  analisesEnvolvidas?: {
    id: string;
    numeroAnalise: string;
    clienteName?: string;
    metalType: string;
    volumeOuPesoEntrada: number;
    unidadeEntrada: string;
    resultadoAnaliseValor: number | null;
    auEstimadoBrutoGramas: number | null;
    isResidue: boolean;
  }[];
  images?: Media[];
}

interface RecoveryOrderDetailsModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  recoveryOrder: RecoveryOrder | null;
  onUpdate: () => void;
}

export function RecoveryOrderDetailsModal({ isOpen, onOpenChange, recoveryOrder: initialRecoveryOrder, onUpdate }: RecoveryOrderDetailsModalProps) {
  const router = useRouter();
  const [currentRecoveryOrder, setCurrentRecoveryOrder] = useState<RecoveryOrder | null>(initialRecoveryOrder);
  const [isFetchingOrder, setIsFetchingOrder] = useState(false);

  const [isAddRawMaterialModalOpen, setAddRawMaterialModalOpen] = useState(false);
  const [isCommissionModalOpen, setIsCommissionModalOpen] = useState(false);
  const [media, setMedia] = useState<Media[]>([]);
  const [isLoadingMedia, setIsLoadingMedia] = useState(false);

  // Editable date states
  const [isEditingDataInicio, setIsEditingDataInicio] = useState(false);
  const [editedDataInicio, setEditedDataInicio] = useState<Date | undefined>(undefined);
  const [isSavingDataInicio, setIsSavingDataInicio] = useState(false);

  const [isEditingDataFim, setIsEditingDataFim] = useState(false);
  const [editedDataFim, setEditedDataFim] = useState<Date | undefined>(undefined);
  const [isSavingDataFim, setIsSavingDataFim] = useState(false);

  const [isEditingDataCriacao, setIsEditingDataCriacao] = useState(false);
  const [editedDataCriacao, setEditedDataCriacao] = useState<Date | undefined>(undefined);
  const [isSavingDataCriacao, setIsSavingDataCriacao] = useState(false);


  const formatCurrency = (value?: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);

  const fetchRecoveryOrderData = async (orderId: string) => {
    setIsFetchingOrder(true);
    try {
      const fetchedOrder = await getRecoveryOrderById(orderId);
      setCurrentRecoveryOrder(fetchedOrder);
      setEditedDataInicio(fetchedOrder.dataInicio ? new Date(fetchedOrder.dataInicio) : undefined);
      setEditedDataFim(fetchedOrder.dataFim ? new Date(fetchedOrder.dataFim) : undefined);
      setEditedDataCriacao(fetchedOrder.dataCriacao ? new Date(fetchedOrder.dataCriacao) : undefined);
    } catch (error) {
      toast.error("Erro ao carregar dados da ordem de recuperação.");
      console.error("Erro ao carregar ordem:", error);
    } finally {
      setIsFetchingOrder(false);
    }
  };

  const fetchMedia = async (orderId: string) => {
    setIsLoadingMedia(true);
    try {
      const fetchedMedia = await getMediaForRecoveryOrder(orderId);
      setMedia(fetchedMedia);
    } catch (error) {
      toast.error("Erro ao carregar mídias da ordem de recuperação.");
    } finally {
      setIsLoadingMedia(false);
    }
  };

  useEffect(() => {
    if (isOpen && initialRecoveryOrder?.id) {
      fetchRecoveryOrderData(initialRecoveryOrder.id);
      fetchMedia(initialRecoveryOrder.id);
    } else {
      setCurrentRecoveryOrder(null); // Clear order when modal is closed
    }
  }, [isOpen, initialRecoveryOrder?.id]);

  const handleMediaUpdate = () => {
    if(currentRecoveryOrder?.id) fetchMedia(currentRecoveryOrder.id);
    onUpdate(); // Atualiza a lista principal
  };

  const handleRawMaterialAdded = () => {
    setAddRawMaterialModalOpen(false);
    if(currentRecoveryOrder?.id) fetchRecoveryOrderData(currentRecoveryOrder.id);
    onUpdate();
  };

  const handleSaveDate = async (
    field: 'dataInicio' | 'dataFim' | 'dataCriacao',
    dateValue: Date | undefined,
    setIsEditing: (value: boolean) => void,
    setIsSaving: (value: boolean) => void,
  ) => {
    if (!currentRecoveryOrder) return;

    setIsSaving(true);
    try {
      const updateDto: Partial<RecoveryOrder> = {
        [field]: dateValue ? dateValue.toISOString() : null,
      };
      
      await updateRecoveryOrder(currentRecoveryOrder.id, updateDto);
      toast.success("Data atualizada com sucesso!");
      setIsEditing(false);
      await fetchRecoveryOrderData(currentRecoveryOrder.id); // Re-fetch data after successful save
      onUpdate?.(); // Trigger a re-fetch of the main list
    } catch (error) {
      toast.error("Erro ao atualizar data.");
      console.error(`Erro ao atualizar ${field}:`, error);
    } finally {
      setIsSaving(false);
    }
  };


  if (!currentRecoveryOrder) {
    if (isFetchingOrder) {
      return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
          <DialogContent className="max-w-4xl p-0 flex items-center justify-center h-[300px]">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </DialogContent>
        </Dialog>
      );
    }
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl p-0">
        <DialogHeader className="p-6 pb-4 flex flex-row items-center justify-between">
          <div>
            <DialogTitle>Detalhes da Ordem de Recuperação</DialogTitle>
            <DialogDescription>Ordem Nº: {currentRecoveryOrder.orderNumber}</DialogDescription>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => setIsCommissionModalOpen(true)}
            >
              Editar Comissão
            </Button>
            <Button 
              variant="outline" 
              onClick={() => window.open(`/api/pdf/recovery-order/${currentRecoveryOrder.id}`, '_blank')}
            >
              Gerar PDF
            </Button>
          </div>
        </DialogHeader>
        <div className="space-y-4 p-6 max-h-[80vh] overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold">Informações Gerais</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-1">
                <p><span className="font-semibold">Status:</span> {currentRecoveryOrder.status}</p>
                <p><span className="font-semibold">Metal:</span> {currentRecoveryOrder.metalType}</p>
                
                <EditableDateDetailItem
                  label="Início"
                  value={currentRecoveryOrder.dataInicio ? new Date(currentRecoveryOrder.dataInicio) : undefined}
                  isEditing={isEditingDataInicio}
                  setIsEditing={setIsEditingDataInicio}
                  editedValue={editedDataInicio}
                  setEditedValue={setEditedDataInicio as (date: Date | undefined) => void}
                  isSaving={isSavingDataInicio}
                  onSave={() => handleSaveDate('dataInicio', editedDataInicio, setIsEditingDataInicio, setIsSavingDataInicio)}
                  onCancel={() => { setIsEditingDataInicio(false); setEditedDataInicio(currentRecoveryOrder.dataInicio ? new Date(currentRecoveryOrder.dataInicio) : undefined); }}
                />
                
                <EditableDateDetailItem
                  label="Fim"
                  value={currentRecoveryOrder.dataFim ? new Date(currentRecoveryOrder.dataFim) : undefined}
                  isEditing={isEditingDataFim}
                  setIsEditing={setIsEditingDataFim}
                  editedValue={editedDataFim}
                  setEditedValue={setEditedDataFim as (date: Date | undefined) => void}
                  isSaving={isSavingDataFim}
                  onSave={() => handleSaveDate('dataFim', editedDataFim, setIsEditingDataFim, setIsSavingDataFim)}
                  onCancel={() => { setIsEditingDataFim(false); setEditedDataFim(currentRecoveryOrder.dataFim ? new Date(currentRecoveryOrder.dataFim) : undefined); }}
                />

                <EditableDateDetailItem
                  label="Data de Criação"
                  value={currentRecoveryOrder.dataCriacao ? new Date(currentRecoveryOrder.dataCriacao) : undefined}
                  isEditing={isEditingDataCriacao}
                  setIsEditing={setIsEditingDataCriacao}
                  editedValue={editedDataCriacao}
                  setEditedValue={setEditedDataCriacao as (date: Date | undefined) => void}
                  isSaving={isSavingDataCriacao}
                  onSave={() => handleSaveDate('dataCriacao', editedDataCriacao, setIsEditingDataCriacao, setIsSavingDataCriacao)}
                  onCancel={() => { setIsEditingDataCriacao(false); setEditedDataCriacao(currentRecoveryOrder.dataCriacao ? new Date(currentRecoveryOrder.dataCriacao) : undefined); }}
                />

                <p><span className="font-semibold">Descrição:</span> {currentRecoveryOrder.descricao || 'N/A'}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold">Financeiro / Comissão</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-1">
                <p><span className="font-semibold">Vendedor:</span> {currentRecoveryOrder.salespersonName || 'Não informado'}</p>
                <p><span className="font-semibold">Comissão (%):</span> {currentRecoveryOrder.commissionPercentage ? `${currentRecoveryOrder.commissionPercentage}%` : '0%'}</p>
                <p><span className="font-semibold">Comissão (R$):</span> {formatCurrency(currentRecoveryOrder.commissionAmount || 0)}</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Resultados (g)</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Bruto Estimado</p>
                <p className="font-bold">{currentRecoveryOrder.totalBrutoEstimadoGramas.toFixed(2)}g</p>
              </div>
              <div>
                <p className="text-muted-foreground">Proc. Bruto</p>
                <p className="font-bold">{currentRecoveryOrder.resultadoProcessamentoGramas?.toFixed(2) ?? 'N/A'}g</p>
              </div>
              <div>
                <p className="text-muted-foreground">Teor Final</p>
                <p className="font-bold">{currentRecoveryOrder.teorFinal ? `${(currentRecoveryOrder.teorFinal * 100).toFixed(2)}%` : 'N/A'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Puro Recuperado</p>
                <p className="font-bold text-green-600">{currentRecoveryOrder.auPuroRecuperadoGramas?.toFixed(2) ?? 'N/A'}g</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Análises Químicas</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nº</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Entrada</TableHead>
                    <TableHead>Resultado</TableHead>
                    <TableHead>Au Bruto (g)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentRecoveryOrder.analisesEnvolvidas?.map(analise => (
                    <TableRow key={analise.id}>
                      <TableCell>{analise.numeroAnalise}</TableCell>
                      <TableCell>{analise.clienteName || 'N/A'}</TableCell>
                      <TableCell>
                        {analise.isResidue
                          ? 'N/A'
                          : `${analise.volumeOuPesoEntrada?.toFixed(2) ?? 'N/A'} ${analise.unidadeEntrada || ''}`}
                      </TableCell>
                      <TableCell>
                        {analise.isResidue
                          ? 'N/A'
                          : analise.resultadoAnaliseValor?.toFixed(2) ?? 'N/A'}
                      </TableCell>
                      <TableCell>{analise.auEstimadoBrutoGramas?.toFixed(4) ?? 'N/A'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold">Matérias-Primas Utilizadas</CardTitle>
              <Button size="sm" variant="outline" onClick={() => setAddRawMaterialModalOpen(true)}>Adicionar</Button>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Quantidade</TableHead>
                    <TableHead>Custo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentRecoveryOrder.rawMaterialsUsed?.length > 0 ? currentRecoveryOrder.rawMaterialsUsed.map((rm) => (
                    <TableRow key={rm.id}>
                      <TableCell>{rm.rawMaterialName}</TableCell>
                      <TableCell>{rm.quantity} {rm.unit}</TableCell>
                      <TableCell>{formatCurrency(rm.cost)}</TableCell>
                    </TableRow>
                  )) : (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-muted-foreground italic">Nenhuma matéria-prima registrada.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Imagens</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ImageUpload 
                entity={{ type: 'recoveryOrder', id: currentRecoveryOrder.id }} 
                onMediaUploadSuccess={(newMedia) => {
                  fetchMedia(currentRecoveryOrder.id);
                }} 
              />
              {isLoadingMedia ? (
                <p>Carregando imagens...</p>
              ) : media.length > 0 ? (
                <ImageGallery media={media} onDeleteSuccess={handleMediaUpdate} />
              ) : (
                <p className="text-sm text-muted-foreground">Nenhuma imagem associada.</p>
              )}
            </CardContent>
          </Card>
        </div>
        <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
          <X className="h-4 w-4" />
          <span className="sr-only">Fechar</span>
        </DialogClose>
      </DialogContent>
      
      <AddRawMaterialModal
        isOpen={isAddRawMaterialModalOpen}
        onClose={() => setAddRawMaterialModalOpen(false)}
        recoveryOrderId={currentRecoveryOrder.id}
        onRawMaterialAdded={handleRawMaterialAdded}
      />

      <ApplyRecoveryOrderCommissionModal
        recoveryOrder={currentRecoveryOrder as any}
        open={isCommissionModalOpen}
        onOpenChange={setIsCommissionModalOpen}
        onSuccess={() => {
          onUpdate();
          onOpenChange(false); // Fecha o modal de detalhes para atualizar os dados
        }}
      />
    </Dialog>
  );
}
