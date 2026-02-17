"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2 } from "lucide-react";
import { MediaSelector } from "./MediaSelector";

export function HeroNewEditor({ config, onChange }: any) {
  const slides = Array.isArray(config?.slides) ? config.slides : [];

  const updateSlide = (idx: number, field: string, value: any) => {
    const newSlides = [...slides];
    newSlides[idx] = { ...newSlides[idx], [field]: value };
    onChange({ ...config, slides: newSlides });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b border-white/10 pb-4">
        <h3 className="text-sm font-black text-blue-400 uppercase italic">Editor de Banners</h3>
        <Button onClick={() => onChange({ ...config, slides: [...slides, { title: "Novo Título", subtitle: "Subtítulo", description: "Descrição" }] })} className="bg-blue-600 font-bold rounded-full">
          <Plus className="w-4 h-4 mr-1" /> ADICIONAR SLIDE
        </Button>
      </div>

      {slides.map((slide: any, idx: number) => (
        <div key={idx} className="p-6 bg-slate-950/60 border border-white/10 rounded-[2rem] relative group shadow-2xl mb-4">
          <Button variant="destructive" size="icon" className="absolute -top-3 -right-3 h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-all z-50" 
            onClick={() => onChange({ ...config, slides: slides.filter((_: any, i: number) => i !== idx) })}>
            <Trash2 className="h-4 w-4" />
          </Button>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <MediaSelector label="Imagem" value={slide.imageUrl} onChange={(url: string) => updateSlide(idx, "imageUrl", url)} />
            <div className="md:col-span-2 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold opacity-40 uppercase italic">Título do Banner</Label>
                  <Input className="bg-slate-900 border-white/10 font-bold" value={slide.title} onChange={(e) => updateSlide(idx, "title", e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold opacity-40 uppercase italic text-blue-400">Subtítulo (Label)</Label>
                  <Input className="bg-slate-900 border-white/10 text-blue-400 font-bold" value={slide.subtitle} onChange={(e) => updateSlide(idx, "subtitle", e.target.value)} />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-bold opacity-40 uppercase italic">Descrição Curta</Label>
                <Textarea className="bg-slate-900 border-white/10 min-h-[80px]" value={slide.description} onChange={(e) => updateSlide(idx, "description", e.target.value)} />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}