"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardTitle } from "@/components/ui/card"; // Importação corrigida
import { toast } from "sonner";
import api, { API_BASE_URL } from "@/lib/api";
import Image from "next/image";
import { Loader2, UploadCloud, XCircle } from "lucide-react";

interface Media {
  id: string;
  filename: string;
  mimetype: string;
  size: number;
  path: string; // Ex: /uploads/nome-do-arquivo.jpg
  createdAt: string;
  recoveryOrderId?: string;
  analiseQuimicaId?: string;
  transacaoId?: string;
  chemicalReactionId?: string;
}

interface MediaLibraryProps {
  onSelect: (mediaId: string) => void;
  selectedMediaId?: string;
}

export function MediaLibrary({ onSelect, selectedMediaId }: MediaLibraryProps) {
  const [mediaFiles, setMediaFiles] = useState<Media[]>([]);
  const [loading, setIsPageLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const fetchMedia = async () => {
    setIsPageLoading(true);
    try {
      const response = await api.get("/media");
      setMediaFiles(response.data);
    } catch (err) {
      toast.error("Falha ao carregar mídias.");
      console.error("Failed to fetch media:", err);
    } finally {
      setIsPageLoading(false);
    }
  };

  useEffect(() => {
    fetchMedia();
  }, []);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setFile(event.target.files[0]);
    } else {
      setFile(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.info("Selecione um arquivo para upload.");
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      await api.post("/media/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      toast.success("Upload realizado com sucesso!");
      setFile(null); // Limpa o arquivo selecionado
      fetchMedia(); // Recarrega a lista de mídias
    } catch (err) {
      toast.error("Falha no upload.");
      console.error("Upload failed:", err);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Selecionar Mídia</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px] h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Biblioteca de Mídias</DialogTitle>
        </DialogHeader>
        <div className="flex-grow flex flex-col md:flex-row gap-4 overflow-hidden">
          {/* Área de Upload */}
          <Card className="w-full md:w-1/3 flex flex-col p-4">
            <CardTitle className="mb-4">Upload de Arquivo</CardTitle>
            <div className="grid w-full items-center gap-1.5 mb-4">
              <Label htmlFor="picture">Arquivo</Label>
              <Input id="picture" type="file" onChange={handleFileChange} />
              {file && <p className="text-sm text-muted-foreground">{file.name}</p>}
            </div>
            <Button onClick={handleUpload} disabled={isUploading || !file}>
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enviando...
                </>
              ) : (
                <>
                  <UploadCloud className="mr-2 h-4 w-4" /> Fazer Upload
                </>
              )}
            </Button>
          </Card>

          {/* Galeria de Mídias */}
          <Card className="w-full md:w-2/3 flex flex-col p-4">
            <CardTitle className="mb-4">Mídias Existentes</CardTitle>
            {loading ? (
              <p className="text-center text-muted-foreground">Carregando mídias...</p>
            ) : (
              <ScrollArea className="flex-grow h-full">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
                  {mediaFiles.length === 0 ? (
                    <p className="col-span-full text-center text-muted-foreground">Nenhuma mídia encontrada.</p>
                  ) : (
                    mediaFiles
                      .filter(media => 
                        !media.recoveryOrderId && 
                        !media.analiseQuimicaId && 
                        !media.transacaoId && 
                        !media.chemicalReactionId
                      )
                      .map((media) => (
                      <div
                        key={media.id}
                        className={`relative group cursor-pointer rounded-lg overflow-hidden border-2 ${
                          selectedMediaId === media.id ? "border-primary" : "border-transparent"
                        } hover:border-primary transition-all duration-200`}
                        onClick={() => onSelect(media.id)}
                      >
                        <Image
                          src={`${API_BASE_URL}/public-media/${media.id}`}
                          alt={media.filename}
                          width={200}
                          height={200}
                          objectFit="cover"
                          className="w-full h-32 object-cover"
                        />
                        {selectedMediaId === media.id && (
                          <div className="absolute inset-0 bg-primary/50 flex items-center justify-center">
                            <XCircle className="h-8 w-8 text-primary-foreground" />
                          </div>
                        )}
                        <p className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1 truncate">
                          {media.filename}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            )}
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
