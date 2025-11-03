'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { toast } from 'sonner';
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
  descricao: string | null;
  status: string;
  totalBrutoEstimadoGramas: number;
  auPuroRecuperadoGramas: number | null;
  rawMaterialsUsed: RawMaterialUsed[];
  images?: Media[];
}

interface RecoveryOrderDetailsModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  recoveryOrder: RecoveryOrder | null;
  onUpdate: () => void;
}

export function RecoveryOrderDetailsModal({ isOpen, onOpenChange, recoveryOrder, onUpdate }: RecoveryOrderDetailsModalProps) {
  const router = useRouter();
  const [isAddRawMaterialModalOpen, setAddRawMaterialModalOpen] = useState(false);
  const [media, setMedia] = useState<Media[]>([]);
  const [isLoadingMedia, setIsLoadingMedia] = useState(false);

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
      <DialogContent className="max-w-3xl p-0">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle>Detalhes da Ordem de Recuperação</DialogTitle>
          <DialogDescription>ID: {recoveryOrder.id}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 p-6 max-h-[80vh] overflow-y-auto">
          <Card>
            <CardHeader>
              <CardTitle>Informações Gerais</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <p><span className="font-semibold">Descrição:</span> {recoveryOrder.descricao}</p>
              <p><span className="font-semibold">Status:</span> {recoveryOrder.status}</p>
              <p><span className="font-semibold">Total Bruto Estimado (g):</span> {recoveryOrder.totalBrutoEstimadoGramas}</p>
              <p><span className="font-semibold">Au Puro Recuperado (g):</span> {recoveryOrder.auPuroRecuperadoGramas ?? 'N/A'}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Imagens da Ordem</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ImageUpload entity={{ type: 'recoveryOrder', id: recoveryOrder.id }} onUploadSuccess={handleMediaUpdate} />
              {isLoadingMedia ? (
                <p>Carregando imagens...</p>
              ) : media.length > 0 ? (
                <ImageGallery media={media} onDeleteSuccess={handleMediaUpdate} />
              ) : (
                <p className="text-sm text-muted-foreground">Nenhuma imagem associada a esta ordem de recuperação.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Matérias-Primas Utilizadas</CardTitle>
              <Button onClick={() => setAddRawMaterialModalOpen(true)}>Adicionar Matéria-Prima</Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Quantidade</TableHead>
                    <TableHead>Custo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recoveryOrder.rawMaterialsUsed?.map((rm) => (
                    <TableRow key={rm.id}>
                      <TableCell>{rm.rawMaterialName}</TableCell>
                      <TableCell>{rm.quantity} {rm.unit}</TableCell>
                      <TableCell>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(rm.cost)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
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
    </Dialog>
  );
}
