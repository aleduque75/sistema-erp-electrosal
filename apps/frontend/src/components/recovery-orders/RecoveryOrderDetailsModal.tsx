'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AddRawMaterialModal } from '@/app/(dashboard)/recovery-orders/[id]/add-raw-material-modal';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { X } from 'lucide-react';
import { ImageUpload } from "@/components/shared/ImageUpload";
import { ImageGallery } from "@/components/shared/ImageGallery";
import { getMediaForRecoveryOrder } from "@/services/mediaApi";
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
  dataInicio: string;
  dataFim?: string;
  salespersonId?: string;
  salespersonName?: string;
  commissionPercentage?: number;
  commissionAmount?: number;
  rawMaterialsUsed: RawMaterialUsed[];
  analisesEnvolvidas?: {
    id: string;
    numeroAnalise: string;
    metalType: string;
    volumeOuPesoEntrada: number;
    resultadoAnaliseValor: number | null;
    auEstimadoBrutoGramas: number | null;
  }[];
  images?: Media[];
}

interface RecoveryOrderDetailsModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  recoveryOrder: RecoveryOrder | null;
  onUpdate: () => void;
}

import { ApplyRecoveryOrderCommissionModal } from './ApplyRecoveryOrderCommissionModal';

export function RecoveryOrderDetailsModal({ isOpen, onOpenChange, recoveryOrder, onUpdate }: RecoveryOrderDetailsModalProps) {
  const router = useRouter();
  const [isAddRawMaterialModalOpen, setAddRawMaterialModalOpen] = useState(false);
  const [isCommissionModalOpen, setIsCommissionModalOpen] = useState(false);
  const [media, setMedia] = useState<Media[]>([]);
  const [isLoadingMedia, setIsLoadingMedia] = useState(false);

  const formatCurrency = (value?: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);

  const fetchMedia = async () => {
    if (!recoveryOrder?.id) return;
    setIsLoadingMedia(true);
    try {
      const fetchedMedia = await getMediaForRecoveryOrder(recoveryOrder.id);
      setMedia(fetchedMedia);
    } catch (error) {
      toast.error("Erro ao carregar mídias da ordem de recuperação.");
    } finally {
      setIsLoadingMedia(false);
    }
  };

  useEffect(() => {
    if (isOpen && recoveryOrder) {
      fetchMedia();
    }
  }, [isOpen, recoveryOrder]);

  const handleMediaUpdate = () => {
    fetchMedia();
    onUpdate(); // Atualiza a lista principal
  };

  const handleRawMaterialAdded = () => {
    setAddRawMaterialModalOpen(false);
    onUpdate();
  };

  if (!recoveryOrder) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl p-0">
        <DialogHeader className="p-6 pb-4 flex flex-row items-center justify-between">
          <div>
            <DialogTitle>Detalhes da Ordem de Recuperação</DialogTitle>
            <DialogDescription>Ordem Nº: {recoveryOrder.orderNumber}</DialogDescription>
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
              onClick={() => window.open(`/api/pdf/recovery-order/${recoveryOrder.id}`, '_blank')}
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
                <p><span className="font-semibold">Status:</span> {recoveryOrder.status}</p>
                <p><span className="font-semibold">Metal:</span> {recoveryOrder.metalType}</p>
                <p><span className="font-semibold">Início:</span> {format(new Date(recoveryOrder.dataInicio), 'dd/MM/yyyy HH:mm')}</p>
                {recoveryOrder.dataFim && <p><span className="font-semibold">Fim:</span> {format(new Date(recoveryOrder.dataFim), 'dd/MM/yyyy HH:mm')}</p>}
                <p><span className="font-semibold">Descrição:</span> {recoveryOrder.descricao || 'N/A'}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold">Financeiro / Comissão</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-1">
                <p><span className="font-semibold">Vendedor:</span> {recoveryOrder.salespersonName || 'Não informado'}</p>
                <p><span className="font-semibold">Comissão (%):</span> {recoveryOrder.commissionPercentage ? `${recoveryOrder.commissionPercentage}%` : '0%'}</p>
                <p><span className="font-semibold">Comissão (R$):</span> {formatCurrency(recoveryOrder.commissionAmount || 0)}</p>
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
                <p className="font-bold">{recoveryOrder.totalBrutoEstimadoGramas.toFixed(2)}g</p>
              </div>
              <div>
                <p className="text-muted-foreground">Proc. Bruto</p>
                <p className="font-bold">{recoveryOrder.resultadoProcessamentoGramas?.toFixed(2) ?? 'N/A'}g</p>
              </div>
              <div>
                <p className="text-muted-foreground">Teor Final</p>
                <p className="font-bold">{recoveryOrder.teorFinal ? `${(recoveryOrder.teorFinal * 100).toFixed(2)}%` : 'N/A'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Puro Recuperado</p>
                <p className="font-bold text-green-600">{recoveryOrder.auPuroRecuperadoGramas?.toFixed(2) ?? 'N/A'}g</p>
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
                    <TableHead>Entrada</TableHead>
                    <TableHead>Teor</TableHead>
                    <TableHead>Au Bruto (g)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recoveryOrder.analisesEnvolvidas?.map(analise => (
                    <TableRow key={analise.id}>
                      <TableCell>{analise.numeroAnalise}</TableCell>
                      <TableCell>{analise.volumeOuPesoEntrada.toFixed(2)}</TableCell>
                      <TableCell>{analise.resultadoAnaliseValor?.toFixed(2) ?? 'N/A'}%</TableCell>
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
                  {recoveryOrder.rawMaterialsUsed?.length > 0 ? recoveryOrder.rawMaterialsUsed.map((rm) => (
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
              <ImageUpload entity={{ type: 'recoveryOrder', id: recoveryOrder.id }} onUploadSuccess={handleMediaUpdate} />
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
        recoveryOrderId={recoveryOrder.id}
        onRawMaterialAdded={handleRawMaterialAdded}
      />

      <ApplyRecoveryOrderCommissionModal
        recoveryOrder={recoveryOrder as any}
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
