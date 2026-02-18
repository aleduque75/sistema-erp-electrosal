"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, FileText } from "lucide-react";
import { IconPicker } from "@/components/landing-page-editor/IconPicker"; // Importe o seu componente aqui
import * as LucideIcons from "lucide-react"; // Importe para renderizar o ícone selecionado

export function FeaturesSectionEditor({ config, onChange }: any) {
  const items = Array.isArray(config?.items) ? config.items : [];

  const updateItem = (idx: number, field: string, value: any) => {
    const newItems = [...items];
    newItems[idx] = { ...newItems[idx], [field]: value };
    onChange({ ...config, items: newItems });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b border-white/10 pb-4">
        <h3 className="text-sm font-black text-green-400 uppercase italic">
          Diferenciais e Serviços
        </h3>
        <Button
          onClick={() =>
            onChange({
              ...config,
              items: [
                ...items,
                {
                  title: "Novo Serviço",
                  description: "Resumo",
                  ctaText: "Saiba Mais",
                  icon: "CheckCircle2",
                },
              ],
            })
          }
          className="bg-green-600 font-bold rounded-full"
        >
          <Plus className="w-4 h-4 mr-1" /> ADICIONAR SERVIÇO
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {items.map((item: any, idx: number) => {
          // Renderiza o ícone atual para o preview no editor
          const SelectedIcon = (LucideIcons as any)[
            item.icon || "CheckCircle2"
          ];

          return (
            <div
              key={idx}
              className="p-6 bg-slate-950/60 border border-white/10 rounded-[2rem] relative group shadow-xl"
            >
              <Button
                variant="destructive"
                size="icon"
                className="absolute -top-2 -right-2 h-7 w-7 rounded-full opacity-0 group-hover:opacity-100 transition-all z-50"
                onClick={() =>
                  onChange({
                    ...config,
                    items: items.filter((_: any, i: number) => i !== idx),
                  })
                }
              >
                <Trash2 className="h-4 w-4" />
              </Button>

              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  {/* ICON PICKER INTEGRADO AQUI */}
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold opacity-40 uppercase italic">
                      Ícone
                    </Label>
                    <IconPicker
                      value={item.icon || "CheckCircle2"}
                      onChange={(newIcon) => updateItem(idx, "icon", newIcon)}
                    />
                  </div>

                  <div className="flex-1 space-y-1">
                    <Label className="text-[10px] font-bold opacity-40 uppercase italic">
                      Título do Serviço
                    </Label>
                    <Input
                      className="bg-slate-900 border-white/10 font-bold"
                      value={item.title}
                      onChange={(e) => updateItem(idx, "title", e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-[10px] font-bold opacity-40 uppercase italic">
                    Resumo (Home)
                  </Label>
                  <Input
                    className="bg-slate-900 border-white/10"
                    value={item.description}
                    onChange={(e) =>
                      updateItem(idx, "description", e.target.value)
                    }
                  />
                </div>

                {/* Campos do Modal (Dialog) */}
                <div className="pt-4 border-t border-white/5 space-y-4">
                  <div className="flex items-center gap-2 text-blue-400">
                    <FileText className="w-3 h-3" />
                    <span className="text-[9px] font-black uppercase italic tracking-widest">
                      Página de Detalhes
                    </span>
                  </div>

                  <Input
                    className="bg-slate-900 border-white/10 text-xs"
                    placeholder="Texto do Botão"
                    value={item.ctaText}
                    onChange={(e) => updateItem(idx, "ctaText", e.target.value)}
                  />

                  <Textarea
                    className="bg-slate-900 border-white/10 min-h-[80px] text-xs"
                    placeholder="Conteúdo detalhado da assessoria..."
                    value={item.modalContent}
                    onChange={(e) =>
                      updateItem(idx, "modalContent", e.target.value)
                    }
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
