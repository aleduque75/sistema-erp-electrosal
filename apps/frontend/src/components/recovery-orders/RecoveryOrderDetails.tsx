'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import api from '@/lib/api';
import { toast } from 'sonner';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AddRawMaterialModal } from '@/app/(dashboard)/recovery-orders/[id]/add-raw-material-modal';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Link from 'next/link';

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
  imageId?: string;
  image?: {
    id: string;
    path: string;
  };
}

export default function RecoveryOrderDetails() {
  const params = useParams();
  const { id } = params;
  const [recoveryOrder, setRecoveryOrder] = useState<RecoveryOrder | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const fetchRecoveryOrder = async () => {
    try {
      const response = await api.get(`/recovery-orders/${id}`);
      setRecoveryOrder(response.data);
    } catch (error) {
      toast.error('Falha ao buscar detalhes da ordem de recuperação.');
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setSelectedFile(event.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error("Selecione um arquivo para enviar.");
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const uploadResponse = await api.post("/media/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const mediaId = uploadResponse.data.id;

      await api.patch(`/recovery-orders/${id}/image`, { mediaId });

      toast.success("Imagem enviada com sucesso!");
      fetchRecoveryOrder();
      setSelectedFile(null);
    } catch (error) {
      toast.error("Falha ao enviar a imagem.");
    } finally {
      setIsUploading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchRecoveryOrder();
    }
  }, [id]);

  const handleRawMaterialAdded = () => {
    fetchRecoveryOrder();
  };

  if (!recoveryOrder) {
    return <p>Carregando...</p>;
  }

  return (
    <div className="space-y-4">
      <Link href="/recovery-orders">
        <Button variant="outline">Voltar</Button>
      </Link>
      <Card>
        <CardHeader>
          <CardTitle>Detalhes da Ordem de Recuperação</CardTitle>
        </CardHeader>
        <CardContent>
          <p>ID: {recoveryOrder.id}</p>
          <p>Descrição: {recoveryOrder.descricao}</p>
          <p>Status: {recoveryOrder.status}</p>
          <p>Total Bruto Estimado (g): {recoveryOrder.totalBrutoEstimadoGramas}</p>
          <p>Au Puro Recuperado (g): {recoveryOrder.auPuroRecuperadoGramas ?? 'N/A'}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Imagem da Ordem</CardTitle>
        </CardHeader>
        <CardContent>
          {recoveryOrder.image ? (
            <img src={`http://localhost:3000/media/${recoveryOrder.image.id}`} alt="Imagem da Ordem" className="max-w-full h-auto rounded-lg" />
          ) : (
            <p>Nenhuma imagem associada.</p>
          )}
          <div className="mt-4">
            <input type="file" onChange={handleFileChange} />
            <Button onClick={handleUpload} disabled={!selectedFile || isUploading} className="mt-2">
              {isUploading ? "Enviando..." : "Enviar Imagem"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Matérias-Primas Utilizadas</CardTitle>
          <Button onClick={() => setIsModalOpen(true)}>Adicionar Matéria-Prima</Button>
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

      <AddRawMaterialModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        recoveryOrderId={id as string}
        onRawMaterialAdded={handleRawMaterialAdded}
      />
    </div>
  );
}
