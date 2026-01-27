// apps/frontend/src/components/landing-page-editor/MediaSelector.tsx

"use client";

import React from "react";
import { MediaLibrary } from "@/components/media/MediaLibrary";
import Image from "next/image";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { X, Info } from "lucide-react"; // Import Info icon
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"; // Import Popover components

interface MediaSelectorProps {
  value?: string | string[]; // ID único ou array de IDs
  onChange: (value: string | string[]) => void;
  multiple?: boolean;
  label?: string;
  sizeRecommendations?: string; // New prop for size recommendations
}

export const MediaSelector: React.FC<MediaSelectorProps> = ({
  value,
  onChange,
  multiple = false,
  label = "Selecionar Mídia",
  sizeRecommendations, // Destructure new prop
}) => {
  const handleSelect = (mediaId: string) => {
    if (multiple) {
      const currentIds = Array.isArray(value) ? value : [];
      if (!currentIds.includes(mediaId)) {
        onChange([...currentIds, mediaId]);
      }
    } else {
      onChange(mediaId);
    }
  };

  const handleRemove = (idToRemove: string) => {
    if (multiple && Array.isArray(value)) {
      onChange(value.filter((id) => id !== idToRemove));
    } else {
      onChange("");
    }
  };

  const renderPreview = () => {
    if (multiple && Array.isArray(value)) {
      return (
        <div className="flex flex-wrap gap-2 mt-2">
          {value.map((id) => (
            <div key={id} className="relative w-24 h-24 rounded-md overflow-hidden">
              <Image
                src={`/api/public-media/${id}`}
                alt="Preview"
                layout="fill"
                objectFit="cover"
              />
              <button
                type="button"
                onClick={() => handleRemove(id)}
                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 text-xs"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      );
    } else if (typeof value === "string" && value) {
      return (
        <div className="relative w-32 h-32 rounded-md overflow-hidden mt-2">
          <Image
                src={`/api/public-media/${value}`}
                alt="Preview"
                layout="fill"
                objectFit="cover"
          />
          <button
            type="button"
            onClick={() => handleRemove(value)}
            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 text-xs"
          >
            <X size={12} />
          </button>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <p className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          {label}
        </p>
        {sizeRecommendations && (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="h-5 w-5">
                <Info className="h-4 w-4 text-muted-foreground" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 text-sm">
              {sizeRecommendations}
            </PopoverContent>
          </Popover>
        )}
      </div>
      <MediaLibrary onSelect={handleSelect} selectedMediaId={typeof value === "string" ? value : undefined} />
      {renderPreview()}
    </div>
  );
};
