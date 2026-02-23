"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import api from "@/lib/api";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AddRawMaterialModal } from "./add-raw-material-modal";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ImageUpload } from "@/components/shared/ImageUpload";
import { ImageGallery } from "@/components/shared/ImageGallery";
import { getMediaForChemicalReaction } from "@/services/mediaApi";
import { Media } from "@/types/media";
import { Separator } from "@/components/ui/separator";

interface RawMaterialUsed {
  id: string;
  rawMaterial: {
    id: string;
    name: string;
    unit: string;
  };
  quantity: number;
  cost: number;
}

interface ChemicalReaction {
  id: string;
  notes: string | null;
  status: string;
  auUsedGrams: number;
  outputProductGrams: number;
  rawMaterialsUsed: RawMaterialUsed[];
}

export default function ChemicalReactionDetailsPage() {
  const params = useParams();
  const { id } = params;
  const [chemicalReaction, setChemicalReaction] = useState<ChemicalReaction | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [media, setMedia] = useState<Media[]>([]);
  const [isLoadingMedia, setIsLoadingMedia] = useState(false);

  const fetchChemicalReaction = async () => {
    try {
      const response = await api.get(`/chemical-reactions/${id}`);
      setChemicalReaction(response.data);
    } catch (error) {
      toast.error("Falha ao buscar detalhes da reação química.");
    }
  };

  const fetchMedia = async () => {
    if (!id) return;
    setIsLoadingMedia(true);
    try {
      const fetchedMedia = await getMediaForChemicalReaction(id as string);
      setMedia(fetchedMedia);
    } catch (error) {
      toast.error("Erro ao carregar imagens da reação.");
    } finally {
      setIsLoadingMedia(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchChemicalReaction();
      fetchMedia();
    }
  }, [id]);

  const handleRawMaterialAdded = () => {
    fetchChemicalReaction();
  };

  if (!chemicalReaction) {
    return <p>Carregando...</p>;
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Detalhes da Reação Química</CardTitle>
        </CardHeader>
        <CardContent>
          <p>ID: {chemicalReaction.id}</p>
          <p>Notas: {chemicalReaction.notes}</p>
          <p>Status: {chemicalReaction.status}</p>
          <p>Ouro Utilizado (g): {chemicalReaction.auUsedGrams}</p>
          <p>Produto Gerado (g): {chemicalReaction.outputProductGrams}</p>
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
              {chemicalReaction.rawMaterialsUsed.map((rm) => (
                <TableRow key={rm.id}>
                  <TableCell>{rm.rawMaterial.name}</TableCell>
                  <TableCell>{rm.quantity} {rm.rawMaterial.unit}</TableCell>
                  <TableCell>{new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(rm.cost)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AddRawMaterialModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        chemicalReactionId={id as string}
        onRawMaterialAdded={handleRawMaterialAdded}
      />

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle>Imagens</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ImageUpload
            entity={{ type: 'chemicalReaction', id: id as string }}
            onMediaUploadSuccess={fetchMedia}
          />
          {isLoadingMedia ? (
            <p className="text-sm text-muted-foreground animate-pulse italic">Carregando imagens...</p>
          ) : media.length > 0 ? (
            <ImageGallery media={media} onDeleteSuccess={fetchMedia} />
          ) : (
            <p className="text-sm text-muted-foreground italic text-center py-4">Nenhuma imagem associada a esta reação.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}