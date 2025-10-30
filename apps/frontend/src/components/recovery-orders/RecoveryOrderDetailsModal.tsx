'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation'; // Importar useRouter
import api from '@/lib/api';
import { toast } from 'sonner';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AddRawMaterialModal } from '@/app/(dashboard)/recovery-orders/[id]/add-raw-material-modal';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { X } from 'lucide-react';

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
  images?: Media[]; // Novo campo para múltiplas imagens
}

interface Media {
  id: string;
  filename: string;
  path: string;
  mimetype: string;
  size: number;
  width?: number;
  height?: number;
}

interface RecoveryOrderDetailsModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  recoveryOrder: RecoveryOrder | null;
  onUpdate: () => void;
}

export function RecoveryOrderDetailsModal({ isOpen, onOpenChange, recoveryOrder, onUpdate }: RecoveryOrderDetailsModalProps) {
  const router = useRouter(); // Inicializar useRouter
  const [isAddRawMaterialModalOpen, setAddRawMaterialModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setSelectedFile(event.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !recoveryOrder) {
      toast.error("Selecione um arquivo para enviar.");
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const uploadResponse = await api.post(`/media/upload?recoveryOrderId=${recoveryOrder.id}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success("Imagem enviada com sucesso!");
      onUpdate();
      setSelectedFile(null);
      onOpenChange(false); // Fechar o modal para forçar a re-renderização do pai
      router.refresh(); // Forçar revalidação dos dados da página
    } catch (error) {
      toast.error("Falha ao enviar a imagem.");
    } finally {
      setIsUploading(false);
    }
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
            <CardContent>
              {recoveryOrder.images && recoveryOrder.images.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {recoveryOrder.images.map((img) => (
                    <div key={img.id} className="relative group">
                      <img src={`http://localhost:3002/media/${img.filename}`} alt={img.filename} className="max-w-full h-auto rounded-lg object-cover aspect-square" />
                      {/* Adicionar botão de remover imagem aqui, se necessário */}
                    </div>
                  ))}                </div>
              ) : (
                <p>Nenhuma imagem associada.</p>
              )}
              <div className="mt-4 flex items-center gap-2">
                <input type="file" onChange={handleFileChange} className="flex-grow" />
                <Button onClick={handleUpload} disabled={!selectedFile || isUploading}>
                  {isUploading ? "Enviando..." : "Enviar Imagem"}
                </Button>
              </div>
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