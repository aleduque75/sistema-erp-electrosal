// apps/frontend/src/components/shared/ImageGallery.tsx
"use client";

import { useState, useEffect } from "react";

import Image from "next/image";

import { Media } from "@/types/media";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";

import { Trash, ChevronLeft, ChevronRight } from "lucide-react";

import { toast } from "sonner";

import { deleteMedia } from "@/services/mediaApi";

import { API_BASE_URL } from "@/lib/api";



interface ImageGalleryProps {

  media: Media[];

  onDeleteSuccess: () => void;

  initialIndex?: number;

}



export function ImageGallery({ media, onDeleteSuccess, initialIndex = 0 }: ImageGalleryProps) {

  const [isGalleryOpen, setIsGalleryOpen] = useState(false);

  const [currentIndex, setCurrentIndex] = useState(initialIndex);



  const openGallery = (index: number) => {

    setCurrentIndex(index);

    setIsGalleryOpen(true);

  };



  const closeGallery = () => {

    setIsGalleryOpen(false);

  }



  const goToPrevious = () => {

    setCurrentIndex((prevIndex) => (prevIndex === 0 ? media.length - 1 : prevIndex - 1));

  };



  const goToNext = () => {

    setCurrentIndex((prevIndex) => (prevIndex === media.length - 1 ? 0 : prevIndex + 1));

  };



  const handleDelete = async (mediaId: string) => {

    if (!confirm("Tem certeza que deseja excluir esta imagem?")) return;

    try {

      await deleteMedia(mediaId);

      toast.success("Imagem excluída com sucesso!");

      onDeleteSuccess();

      if (media.length === 1) {

        closeGallery();

      } else {

        // Ajusta o índice se a imagem excluída for a última

        setCurrentIndex(prev => Math.max(0, prev - 1));

      }

    } catch (error) {

      toast.error("Erro ao excluir imagem.");

      console.error("Erro ao excluir imagem:", error);

    }

  };



  const currentMedia = media[currentIndex];



  return (

    <div>

      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">

        {media.map((item, index) => (

          <div key={item.id} className="relative group aspect-square">

            <Image
              src={item.url || `/api/media/public-media/${item.id}`}
              alt={item.filename || 'Imagem da transação'}
              layout="fill"
              objectFit="cover"
              className="cursor-pointer rounded-md"
              onClick={() => openGallery(index)}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = "/images/placeholder.png";
              }}
            />

            <Button

              variant="destructive"

              size="icon"

              className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"

              onClick={(e) => {

                e.stopPropagation();

                handleDelete(item.id);

              }}

            >

              <Trash className="h-3 w-3" />

            </Button>

          </div>

        ))}

      </div>



      <Dialog open={isGalleryOpen} onOpenChange={setIsGalleryOpen}>

        <DialogContent className="max-w-4xl w-full h-5/6 p-0">

          <div className="relative w-full h-full flex justify-center items-center">

            {currentMedia && (

              <Image
                src={currentMedia.url || `/api/media/public-media/${currentMedia.id}`}
                alt={currentMedia.filename || 'Imagem da transação'}
                layout="fill"
                objectFit="contain"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = "/images/placeholder.png";
                }}
              />

            )}

            <Button

              variant="outline"

              size="icon"

              className="absolute top-1/2 -translate-y-1/2 left-2 z-50"

              onClick={goToPrevious}

            >

              <ChevronLeft className="h-6 w-6" />

            </Button>

            <Button

              variant="outline"

              size="icon"

              className="absolute top-1/2 -translate-y-1/2 right-2 z-50"

              onClick={goToNext}

            >

              <ChevronRight className="h-6 w-6" />

            </Button>

          </div>

        </DialogContent>

      </Dialog>

    </div>

  );

}
