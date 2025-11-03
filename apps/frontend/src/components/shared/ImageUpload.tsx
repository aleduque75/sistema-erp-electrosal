// apps/frontend/src/components/shared/ImageUpload.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UploadCloud } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { uploadMediaForAnaliseQuimica, uploadMediaForRecoveryOrder, uploadMediaForTransacao } from "@/services/mediaApi";
import { Media } from "@prisma/client"; // Importar Media

interface ImageUploadProps {
  entity: {
    type: 'analiseQuimica' | 'recoveryOrder' | 'transacao'; // Adicionar 'transacao'
    id: string;
  };
  onMediaUploadSuccess: (media: Media) => void; // Renomear e adicionar parâmetro
}

export function ImageUpload({ entity, onMediaUploadSuccess }: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) {
      return;
    }

    const file = files[0];
    setIsUploading(true);

    try {
      let newMedia: Media;
      if (entity.type === 'analiseQuimica') {
        newMedia = await uploadMediaForAnaliseQuimica(file, entity.id);
      } else if (entity.type === 'recoveryOrder') {
        newMedia = await uploadMediaForRecoveryOrder(file, entity.id);
      } else if (entity.type === 'transacao') {
        newMedia = await uploadMediaForTransacao(file, entity.id);
      } else {
        throw new Error("Tipo de entidade inválido para upload de imagem.");
      }
      toast.success("Imagem enviada com sucesso!");
      onMediaUploadSuccess(newMedia); // Passar a nova mídia
    } catch (error) {
      toast.error("Erro ao enviar imagem.");
      console.error("Erro ao fazer upload da imagem:", error);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = ""; // Limpa o input para permitir upload do mesmo arquivo novamente
      }
    }
  };

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => { // Adicionar evento
    e.stopPropagation(); // Impedir a propagação do evento
    fileInputRef.current?.click();
  };

  return (
    <div>
      <Input
        id="file-upload"
        type="file"
        accept="image/*"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        disabled={isUploading}
      />
      <Button type="button" onClick={handleClick} disabled={isUploading}>
        <UploadCloud className="mr-2 h-4 w-4" />
        {isUploading ? "Enviando..." : "Enviar Imagem"}
      </Button>
    </div>
  );
}