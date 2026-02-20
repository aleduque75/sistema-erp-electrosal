"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import api from "@/lib/api";
import Image from "next/image";
import { Loader2, UploadCloud, CheckCircle2, Trash2 } from "lucide-react";

export function MediaLibrary({ onSelect, selectedMediaId }: any) {
  const [mediaFiles, setMediaFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [file, setFile] = useState<File | null>(null);

  const [localSelectedId, setLocalSelectedId] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    if (isDialogOpen) {
      setLocalSelectedId(selectedMediaId);
      fetchMedia();
    }
  }, [isDialogOpen, selectedMediaId]);

  const fetchMedia = async () => {
    setLoading(true);
    try {
      const response = await api.get("/media");
      const data = Array.isArray(response.data)
        ? response.data
        : response.data.medias || [];
      setMediaFiles(data);
    } catch (err) {
      toast.error("Erro ao carregar mídias.");
    } finally {
      setLoading(false);
    }
  };

  const getMediaUrl = (media: any) => {
    // Tenta usar a URL direta do backend primeiro
    if (media?.url) return media.url;

    // Fallback construindo a URL
    const mediaId = media?.id || media?._id?.value;
    if (mediaId) {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://api.electrosal.com.br";
      return `${baseUrl}/api/public-media/${mediaId}`;
    }
    return "";
  };

  const handleUpload = async () => {
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    try {
      await api.post("/media/upload", formData);
      toast.success("Mídia enviada com sucesso!");
      setFile(null);
      fetchMedia();
    } catch (err) {
      toast.error("Falha no upload");
    }
  };

  const handleConfirm = () => {
    if (localSelectedId) {
      onSelect(localSelectedId);
    }
    setIsDialogOpen(false);
  };

  const handleDelete = async (mediaIdToDelete: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (
      window.confirm(
        "Tem certeza que deseja excluir esta mídia? Esta ação não pode ser desfeita."
      )
    ) {
      try {
        await api.delete(`/media/${mediaIdToDelete}`);
        toast.success("Mídia excluída com sucesso!");
        if (localSelectedId === mediaIdToDelete) {
          setLocalSelectedId(null);
        }
        fetchMedia();
      } catch (err) {
        toast.error("Falha ao excluir a mídia.");
      }
    }
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          {selectedMediaId ? "Alterar Imagem" : "Selecionar Mídia"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[900px] h-[85vh] flex flex-col border-none shadow-2xl">
        <DialogHeader className="border-b pb-4">
          <DialogTitle className="text-2xl font-bold text-gray-800">
            Biblioteca de Mídias
          </DialogTitle>
        </DialogHeader>

        <div className="flex gap-4 flex-grow overflow-hidden p-4">
          <Card className="w-1/3 p-6 flex flex-col gap-4 bg-slate-50/50 border-dashed border-2">
            <div className="space-y-2">
              <Label className="text-sm font-bold text-gray-700 uppercase tracking-wider">
                Novo Upload
              </Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 bg-white hover:bg-gray-50 transition-colors">
                <Input
                  type="file"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="cursor-pointer border-none shadow-none focus-visible:ring-0"
                  accept="image/*"
                />
              </div>
            </div>

            <Button
              className="w-full shadow-md py-6 text-lg"
              onClick={handleUpload}
              disabled={!file}
            >
              <UploadCloud className="mr-2 h-5 w-5" /> Enviar Agora
            </Button>
            <p className="text-xs text-gray-500 text-center italic">
              Dica: Se a imagem não aparecer, verifique se a pasta 'uploads' no
              backend contém o arquivo físico.
            </p>
          </Card>

          <ScrollArea className="flex-grow rounded-lg border bg-white shadow-inner">
            {loading ? (
              <div className="flex h-64 items-center justify-center">
                <div className="text-center space-y-2">
                  <Loader2 className="animate-spin h-10 w-10 text-blue-600 mx-auto" />
                  <p className="text-sm text-gray-500 font-medium">
                    Carregando galeria...
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-4 p-4">
                {mediaFiles.map((media, index) => {
                  const mediaId = media?.id || media?._id?.value || null;
                  const isSelected = localSelectedId === mediaId;

                  return (
                    <div
                      key={`${mediaId}-${index}`}
                      onClick={() => mediaId && setLocalSelectedId(mediaId)}
                      className={`group relative aspect-square rounded-xl overflow-hidden transition-all duration-200 ${mediaId ? 'cursor-pointer' : 'cursor-not-allowed'
                        } ${isSelected
                          ? "border-blue-600 ring-4 ring-blue-100 shadow-lg"
                          : "border-gray-100 hover:border-blue-300 shadow-sm"
                        }`}
                    >
                      <button
                        onClick={(e) => handleDelete(mediaId!, e)}
                        className="absolute top-2 right-2 z-10 p-1.5 bg-white/80 text-red-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white hover:scale-110"
                        aria-label="Excluir mídia"
                        disabled={!mediaId}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                      <Image
                        src={getMediaUrl(media)}
                        alt="media asset"
                        fill
                        unoptimized
                        className="object-cover transition-transform duration-300 group-hover:scale-110"
                        onError={(e) => {
                          (e.target as any).src =
                            "https://placehold.co/400?text=Erro+no+Link";
                        }}
                      />
                      {isSelected && (
                        <div className="absolute inset-0 bg-blue-600/10 flex items-center justify-center backdrop-blur-[1px]">
                          <CheckCircle2 className="text-blue-600 bg-white rounded-full h-10 w-10 shadow-xl" />
                        </div>
                      )}
                      <div className="absolute inset-x-0 bottom-0 bg-black/60 p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <p className="text-[10px] text-white truncate text-center font-mono">
                          {media?.props?.filename || "file"}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </div>
        <DialogFooter className="border-t pt-4">
          <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={!localSelectedId}>
            Confirmar Seleção
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}