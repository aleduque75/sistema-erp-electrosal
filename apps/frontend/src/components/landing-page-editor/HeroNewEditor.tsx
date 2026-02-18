"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, LayoutPanelLeft, FileText } from "lucide-react";
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
        <Button 
          onClick={() => onChange({ ...config, slides: [...slides, { 
            title: "Novo Título", 
            subtitle: "Subtítulo", 
            description: "Descrição",
            ctaText: "Saiba Mais",
            detailTitle: "",
            modalContent: "" 
          }] })} 
          className="bg-blue-600 font-bold rounded-full"
        >
          <Plus className="w-4 h-4 mr-1" /> ADICIONAR SLIDE
        </Button>
      </div>

      {slides.map((slide: any, idx: number) => (
        <div key={idx} className="p-8 bg-slate-950/60 border border-white/10 rounded-[2.5rem] relative group shadow-2xl mb-8">
          <Button 
            variant="destructive" 
            size="icon" 
            className="absolute -top-3 -right-3 h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-all z-50" 
            onClick={() => onChange({ ...config, slides: slides.filter((_: any, i: number) => i !== idx) })}
          >
            <Trash2 className="h-4 w-4" />
          </Button>

          {/* PARTE 1: CONTEÚDO DA HOME (O que aparece no carrossel) */}
          <div className="flex items-center gap-2 mb-6 opacity-60">
            <LayoutPanelLeft className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase italic tracking-widest">Visual da Home</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <MediaSelector label="Imagem do Banner" value={slide.imageUrl} onChange={(url: string) => updateSlide(idx, "imageUrl", url)} />
            
            <div className="md:col-span-2 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold opacity-40 uppercase italic">Título Principal</Label>
                  <Input className="bg-slate-900 border-white/10 font-bold" value={slide.title} onChange={(e) => updateSlide(idx, "title", e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold opacity-40 uppercase italic text-blue-400">Label de Destaque</Label>
                  <Input className="bg-slate-900 border-white/10 text-blue-400 font-bold" value={slide.subtitle} onChange={(e) => updateSlide(idx, "subtitle", e.target.value)} />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-bold opacity-40 uppercase italic">Resumo (Home)</Label>
                <Textarea className="bg-slate-900 border-white/10 min-h-[60px]" value={slide.description} onChange={(e) => updateSlide(idx, "description", e.target.value)} />
              </div>
            </div>
          </div>

          {/* PARTE 2: CONTEÚDO DO DIALOG (O que abre ao clicar) */}
          <div className="mt-8 pt-8 border-t border-white/5 space-y-6">
            <div className="flex items-center gap-2 mb-2 text-blue-400">
              <FileText className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase italic tracking-widest">Conteúdo Detalhado (Página do Modal)</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold opacity-40 uppercase italic">Texto do Botão (CTA)</Label>
                  <Input 
                    className="bg-slate-900 border-blue-500/20 text-white font-bold" 
                    placeholder="Ex: Saiba Mais, Ver Processo..."
                    value={slide.ctaText} 
                    onChange={(e) => updateSlide(idx, "ctaText", e.target.value)} 
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold opacity-40 uppercase italic">Título Dentro do Modal</Label>
                  <Input 
                    className="bg-slate-900 border-white/10" 
                    placeholder="Título completo da explicação"
                    value={slide.detailTitle} 
                    onChange={(e) => updateSlide(idx, "detailTitle", e.target.value)} 
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-[10px] font-bold opacity-40 uppercase italic">Texto Longo do Detalhe</Label>
                <Textarea 
                  className="bg-slate-900 border-white/10 min-h-[120px] scrollbar-thin scrollbar-thumb-blue-600" 
                  placeholder="Insira aqui o texto completo. Se for muito longo, uma barra de rolagem aparecerá automaticamente no site."
                  value={slide.modalContent} 
                  onChange={(e) => updateSlide(idx, "modalContent", e.target.value)} 
                />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}