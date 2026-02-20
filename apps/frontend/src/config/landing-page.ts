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
  const [isUploading, setIsUploading] = useState(false);

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
      // O backend retorna um array de objetos de domínio
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

  /**
   * CORREÇÃO CRÍTICA: 
   * Remove o localhost e usa a URL injetada pelo backend ou monta 
   * baseada no filename armazenado.
   */
  const getMediaUrl = (media: any) => {
    // 1. Prioridade: URL já processada pelo backend
    if (media.url) return media.url;

    // 2. Fallback: Extrair filename do objeto de domínio ou props
    const filename = media?.props?.filename || media?.filename;

    if (filename) {
      // Usamos caminhos relativos para aproveitar os rewrites do next.config.mjs
      // Isso funciona tanto em dev quanto em prod
      return `/api/media/public-media/${filename}`;
    }

    return "https://placehold.co/400?text=Sem+Arquivo";
  };

  const handleUpload = async () => {
    if (!file) return;
    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      await api.post("/media/upload", formData);
      toast.success("Mídia enviada com sucesso!");
      setFile(null);
      fetchMedia(); // Recarrega a lista
    } catch (err) {
      console.error(err);
      toast.error("Falha no upload. Verifique o tamanho do arquivo.");
    } finally {
      setIsUploading(false);
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
    <Dialog open= { isDialogOpen } onOpenChange = { setIsDialogOpen } >
      <DialogTrigger asChild >
      <Button variant="outline" className = "w-full" >
        { selectedMediaId? "Alterar Imagem": "Selecionar Mídia" }
        </Button>
        </DialogTrigger>
        < DialogContent className = "sm:max-w-[900px] h-[85vh] flex flex-col border-none shadow-2xl bg-white" >
          <DialogHeader className="border-b pb-4" >
            <DialogTitle className="text-2xl font-bold text-gray-800" >
              Biblioteca de Mídias
                </DialogTitle>
                </DialogHeader>

                < div className = "flex gap-4 flex-grow overflow-hidden p-4" >
                  {/* Coluna de Upload */ }
                  < Card className = "w-1/3 p-6 flex flex-col gap-4 bg-slate-50/50 border-dashed border-2" >
                    <div className="space-y-2" >
                      <Label className="text-sm font-bold text-gray-700 uppercase tracking-wider" >
                        Novo Upload
                          </Label>
                          < div className = "border-2 border-dashed border-gray-300 rounded-lg p-4 bg-white hover:bg-gray-50 transition-colors" >
                            <Input
                  type="file"
  onChange = {(e) => setFile(e.target.files?.[0] || null)
}
className = "cursor-pointer border-none shadow-none focus-visible:ring-0"
accept = "image/*"
  />
  </div>
  </div>

  < Button
className = "w-full shadow-md py-6 text-lg"
onClick = { handleUpload }
disabled = {!file || isUploading}
            >
  {
    isUploading?(
                <Loader2 className = "animate-spin h-5 w-5 mr-2" />
              ): (
        <UploadCloud className = "mr-2 h-5 w-5" />
              )}
{ isUploading ? "Enviando..." : "Enviar Agora" }
</Button>

  < div className = "mt-auto p-4 bg-blue-50 rounded-lg border border-blue-100" >
    <p className="text-[11px] text-blue-700 leading-relaxed" >
      <strong>Atenção: </strong> Se as imagens não aparecerem, limpe o cache do navegador (Ctrl+F5) após o upload.
        </p>
        </div>
        </Card>

{/* Galeria */ }
<ScrollArea className="flex-grow rounded-lg border bg-white shadow-inner" >
{
  loading?(
              <div className = "flex h-64 items-center justify-center" >
      <div className="text-center space-y-2">
  <Loader2 className="animate-spin h-10 w-10 text-blue-600 mx-auto" />
    <p className="text-sm text-gray-500 font-medium" > Carregando galeria...</p>
      </div>
      </div>
            ) : (
  <div className= "grid grid-cols-3 gap-4 p-4" >
  {
    mediaFiles.map((media, index) => {
      // O ID no seu padrão DDD/Prisma costuma vir dentro de _id.value ou id
      const mediaId = media?.id || media?._id?.value;
      const isSelected = localSelectedId === mediaId;

      return (
        <div
                      key= {`${mediaId}-${index}`
    }
                      onClick = {() => mediaId && setLocalSelectedId(mediaId)}
className = {`group relative aspect-square rounded-xl overflow-hidden transition-all duration-200 border-2 ${isSelected
  ? "border-blue-600 ring-4 ring-blue-100 shadow-lg"
  : "border-gray-100 hover:border-blue-300 shadow-sm"
  } cursor-pointer`}
                    >
  {/* Botão Excluir */ }
  < button
onClick = {(e) => handleDelete(mediaId, e)}
className = "absolute top-2 right-2 z-20 p-1.5 bg-white/90 text-red-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50"
  >
  <Trash2 className="h-4 w-4" />
    </button>

    < Image
src = { getMediaUrl(media) }
alt = "media asset"
fill
unoptimized
className = "object-cover transition-transform duration-300 group-hover:scale-105"
onError = {(e) => {
  (e.target as any).src = "https://placehold.co/400?text=Erro+no+Link";
}}
                      />

{
  isSelected && (
    <div className="absolute inset-0 bg-blue-600/10 flex items-center justify-center backdrop-blur-[1px] z-10" >
      <CheckCircle2 className="text-blue-600 bg-white rounded-full h-10 w-10 shadow-xl" />
        </div>
                      )
}

<div className="absolute inset-x-0 bottom-0 bg-black/60 p-2 opacity-0 group-hover:opacity-100 transition-opacity z-10" >
  <p className="text-[10px] text-white truncate text-center font-mono" >
    { media?.props?.filename || media?.filename || "arquivo"}
</p>
  </div>
  </div>
                  );
                })}

{
  mediaFiles.length === 0 && (
    <div className="col-span-3 py-20 text-center text-gray-400" >
      Nenhuma mídia encontrada.Comece fazendo um upload.
                  </div>
                )
}
</div>
            )}
</ScrollArea>
  </div>

  < DialogFooter className = "border-t p-4 bg-gray-50/50 rounded-b-2xl" >
    <Button variant="ghost" onClick = {() => setIsDialogOpen(false)}>
      Cancelar
      </Button>
      < Button
onClick = { handleConfirm }
disabled = {!localSelectedId}
className = "px-8 bg-blue-600 hover:bg-blue-700 text-white"
  >
  Confirmar Seleção
    </Button>
    </DialogFooter>
    </DialogContent>
    </Dialog>
  );
}