"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, LayoutGrid, GripVertical } from "lucide-react";
import { MediaSelector } from "./MediaSelector";

// ✅ Usando named export para evitar o erro de 'undefined'
export function ProcessGalleryEditor({ config, onChange }: any) {
  const processes = Array.isArray(config?.processes) ? config.processes : [];

  const updateProcess = (idx: number, field: string, value: string) => {
    const updated = [...processes];
    updated[idx] = { ...updated[idx], [field]: value };
    onChange({ ...config, processes: updated });
  };

  const addProcess = () => {
    const newProcess = { title: "Nova Etapa", description: "", imageUrl: "" };
    onChange({ ...config, processes: [...processes, newProcess] });
  };

  const removeProcess = (idx: number) => {
    onChange({ ...config, processes: processes.filter((_, i) => i !== idx) });
  };

  return (
    <div className="space-y-8">
      <div className="bg-slate-900/40 p-6 rounded-3xl border border-white/10 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <LayoutGrid className="w-5 h-5 text-blue-400" />
          <h3 className="text-sm font-black uppercase tracking-widest text-white">
            Configuração da Galeria/Processos
          </h3>
        </div>
        <Input
          className="bg-slate-950 border-white/10 h-12 text-lg font-bold"
          placeholder="Título da Seção"
          value={config.title || ""}
          onChange={(e) => onChange({ ...config, title: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-1 gap-6">
        {processes.map((proc: any, idx: number) => (
          <div
            key={idx}
            className="p-6 border border-white/10 rounded-[2rem] bg-slate-900/20 relative group hover:border-blue-500/30 transition-all shadow-xl"
          >
            <Button
              variant="destructive"
              size="icon"
              className="absolute -top-3 -right-3 h-9 w-9 rounded-full opacity-0 group-hover:opacity-100 transition-all"
              onClick={() => removeProcess(idx)}
            >
              <Trash2 className="h-5 w-5" />
            </Button>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <MediaSelector
                label="Escolher Foto"
                value={proc.imageUrl}
                onChange={(url: string) => updateProcess(idx, "imageUrl", url)}
              />
              <div className="md:col-span-2 space-y-4">
                <Input
                  placeholder="Título"
                  className="bg-slate-950 border-white/10"
                  value={proc.title}
                  onChange={(e) => updateProcess(idx, "title", e.target.value)}
                />
                <Textarea
                  placeholder="Descrição"
                  className="bg-slate-950 border-white/10 min-h-[80px]"
                  value={proc.description}
                  onChange={(e) =>
                    updateProcess(idx, "description", e.target.value)
                  }
                />
              </div>
            </div>
          </div>
        ))}
        <Button
          variant="outline"
          className="w-full border-2 border-dashed py-12 rounded-[2rem]"
          onClick={addProcess}
        >
          <Plus className="w-6 h-6 mr-2" /> Adicionar Etapa
        </Button>
      </div>
    </div>
  );
}
