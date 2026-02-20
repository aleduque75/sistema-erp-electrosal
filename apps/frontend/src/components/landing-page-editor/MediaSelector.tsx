"use client";

import React from "react";
import { MediaLibrary } from "@/components/media/MediaLibrary";
import Image from "next/image";
import { API_BASE_URL } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { X, ImageIcon } from "lucide-react";
import { Label } from "@/components/ui/label";

interface MediaSelectorProps {
  value?: string | null;
  onChange: (value: string) => void;
  label: string;
}

export function MediaSelector({ value, onChange, label }: MediaSelectorProps) {
  // Função que resolve a URL para o Next.js conseguir mostrar o preview
  const getPreviewUrl = (id: string | null | undefined) => {
    if (!id) return "";
    if (id.startsWith("http") || id.startsWith("/")) return id;
    // Constrói URL completa usando NEXT_PUBLIC_API_URL para garantir preview correto
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://api.electrosal.com.br";
    return `${baseUrl}/api/media/public-media/${id}`;
  };

  return (
    <div className="space-y-2 border p-4 rounded-lg bg-slate-50">
      <Label className="text-sm font-bold text-slate-700">{label}</Label>

      <div className="flex items-start gap-4">
        {/* Biblioteca de Mídia */}
        <MediaLibrary
          onSelect={(media: any) => {
            // Garante que estamos salvando apenas o ID (UUID) no banco
            const mediaId = typeof media === 'string' ? media : media.id;
            console.log('MediaSelector: Selecionando imagem com ID:', mediaId);
            onChange(mediaId);
          }}
          selectedMediaId={value || undefined}
        />

        {/* Área de Preview */}
        {value ? (
          <div className="relative w-32 h-32 border-2 border-blue-200 rounded-md overflow-hidden shadow-inner bg-white">
            <Image
              src={getPreviewUrl(value)}
              alt="Preview"
              fill
              className="object-cover"
              unoptimized // Útil se o Next.js reclamar de domínios externos no Docker
            />
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute top-1 right-1 h-6 w-6 rounded-full"
              onClick={() => onChange("")}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        ) : (
          <div className="w-32 h-32 border-2 border-dashed border-slate-300 rounded-md flex flex-col items-center justify-center text-slate-400 bg-slate-100">
            <ImageIcon className="w-8 h-8 mb-1" />
            <span className="text-[10px]">Sem imagem</span>
          </div>
        )}
      </div>
    </div>
  );
}
