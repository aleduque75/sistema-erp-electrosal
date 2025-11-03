// apps/frontend/src/components/shared/ImageGallery.tsx
"use client";

import { useState } from "react";
import Image from "next/image";
import { Media } from "@/types/media";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Button } from "@/components/ui/button";
import { Trash } from "lucide-react";
import { toast } from "sonner";
import { deleteMedia } from "@/services/mediaApi";
import { API_BASE_URL } from "@/lib/api";

interface ImageGalleryProps {
  media: Media[];
  onDeleteSuccess: () => void;
}

export function ImageGallery({ media, onDeleteSuccess }: ImageGalleryProps) {
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const openGallery = (index: number) => {
    setCurrentImageIndex(index);
    setIsGalleryOpen(true);
  };

  const handleDelete = async (mediaId: string) => {
    if (!confirm("Tem certeza que deseja excluir esta imagem?")) return;
    try {
      await deleteMedia(mediaId);
      toast.success("Imagem excluída com sucesso!");
      onDeleteSuccess();
      // Se a imagem atual for excluída e for a única, fechar a galeria
      if (media.length === 1) {
        setIsGalleryOpen(false);
      }
    } catch (error) {
      toast.error("Erro ao excluir imagem.");
      console.error("Erro ao excluir imagem:", error);
    }
  };

  return (
    <div>
      <div className="grid grid-cols-3 gap-2">
        {media.map((item, index) => (
          <div key={item.id} className="relative group">
            <Image
              src={`${API_BASE_URL}${item.path}`}
              alt={item.filename}
              width={100}
              height={100}
              className="cursor-pointer rounded-md object-cover aspect-square"
              onClick={() => openGallery(index)}
            />
            <Button
              variant="destructive"
              size="icon"
              className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => handleDelete(item.id)}
            >
              <Trash className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      <Dialog open={isGalleryOpen} onOpenChange={setIsGalleryOpen}>
        <DialogContent className="max-w-3xl p-0">
          <Carousel className="w-full">
            <CarouselContent>
              {media.map((item, index) => (
                <CarouselItem key={item.id}>
                  <div className="flex justify-center items-center h-[500px]">
                    <Image
                      src={`${API_BASE_URL}${item.path}`}
                      alt={item.filename}
                      layout="fill"
                      objectFit="contain"
                    />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
          </Carousel>
        </DialogContent>
      </Dialog>
    </div>
  );
}