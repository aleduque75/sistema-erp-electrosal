"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Zap, FileText } from "lucide-react";
import { MediaSelector } from "./MediaSelector";

export function ProcessGalleryEditor({ config, onChange }: any) {
  const processes = Array.isArray(config?.processes) ? config.processes : [];

  const updateProcess = (idx: number, field: string, value: any) => {
    const newProcesses = [...processes];
    newProcesses[idx] = { ...newProcesses[idx], [field]: value };
    onChange({ ...config, processes: newProcesses });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b border-white/10 pb-4">
        <div className="space-y-1">
          <h3 className="text-sm font-black text-orange-400 uppercase italic">
            Fluxo de Processos
          </h3>
          <Input
            className="bg-transparent border-none text-2xl font-black uppercase italic p-0 h-auto focus-visible:ring-0"
            value={config.title || "Workflow"}
            onChange={(e) => onChange({ ...config, title: e.target.value })}
          />
        </div>
        <Button
          onClick={() =>
            onChange({
              ...config,
              processes: [
                ...processes,
                {
                  title: "Nova Etapa",
                  description: "Resumo da etapa",
                  ctaText: "Ver Detalhes",
                  modalContent: "",
                },
              ],
            })
          }
          className="bg-orange-500 font-bold rounded-full"
        >
          <Plus className="w-4 h-4 mr-1" /> ADICIONAR ETAPA
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {processes.map((proc: any, idx: number) => (
          <div
            key={idx}
            className="p-6 bg-slate-950/60 border border-white/10 rounded-[2rem] relative group shadow-xl"
          >
            <Button
              variant="destructive"
              size="icon"
              className="absolute -top-3 -right-3 h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-all z-50"
              onClick={() =>
                onChange({
                  ...config,
                  processes: processes.filter((_: any, i: number) => i !== idx),
                })
              }
            >
              <Trash2 className="h-4 w-4" />
            </Button>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <MediaSelector
                label="Foto da Etapa"
                value={proc.imageUrl}
                onChange={(url: string) => updateProcess(idx, "imageUrl", url)}
              />

              <div className="md:col-span-3 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-[10px] font-bold opacity-40 uppercase italic">
                      Nome da Etapa (Home)
                    </Label>
                    <Input
                      className="bg-slate-900 border-white/10 font-bold"
                      value={proc.title}
                      onChange={(e) =>
                        updateProcess(idx, "title", e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] font-bold opacity-40 uppercase italic text-orange-400">
                      Texto do Botão
                    </Label>
                    <Input
                      className="bg-slate-900 border-white/10 text-orange-400 font-bold"
                      value={proc.ctaText}
                      onChange={(e) =>
                        updateProcess(idx, "ctaText", e.target.value)
                      }
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-[10px] font-bold opacity-40 uppercase italic">
                    Resumo Rápido
                  </Label>
                  <Input
                    className="bg-slate-900 border-white/10"
                    value={proc.description}
                    onChange={(e) =>
                      updateProcess(idx, "description", e.target.value)
                    }
                  />
                </div>

                <div className="pt-4 border-t border-white/5">
                  <div className="flex items-center gap-2 mb-2 text-blue-400">
                    <FileText className="w-3 h-3" />
                    <span className="text-[9px] font-black uppercase italic tracking-widest">
                      Conteúdo Detalhado do Modal (Scroll)
                    </span>
                  </div>
                  <Textarea
                    className="bg-slate-900 border-white/10 min-h-[100px] text-sm"
                    placeholder="Descreva aqui todo o conhecimento técnico do Eládio para esta etapa..."
                    value={proc.modalContent}
                    onChange={(e) =>
                      updateProcess(idx, "modalContent", e.target.value)
                    }
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
