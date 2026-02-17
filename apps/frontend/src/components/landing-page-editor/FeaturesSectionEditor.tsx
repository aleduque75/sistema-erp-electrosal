"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash2, Plus, Star, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  config: any;
  onChange: (config: any) => void;
  theme?: "light" | "dark";
}

export function FeaturesSectionEditor({ config, onChange }: Props) {
  // ✅ DEFESA: Garante que 'items' seja sempre um array
  const items = Array.isArray(config?.items) ? config.items : [];

  const updateItem = (index: number, field: string, value: string) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    onChange({ ...config, items: newItems });
  };

  const addItem = () => {
    const newItem = {
      icon: "CheckCircle2",
      title: "Novo Diferencial",
      description: "Descrição do serviço ou vantagem...",
    };
    onChange({ ...config, items: [...items, newItem] });
  };

  const removeItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    onChange({ ...config, items: newItems });
  };

  return (
    <div className="space-y-8">
      {/* Título da Seção */}
      <div className="grid gap-3 p-6 bg-slate-950/40 rounded-[2rem] border border-white/5">
        <Label className="text-[10px] font-black uppercase opacity-40 tracking-[0.2em] italic">
          Título da Seção de Diferenciais
        </Label>
        <Input
          className="bg-slate-950 border-white/10 h-12 text-lg font-bold italic"
          placeholder="Ex: Por que escolher a Electrosal?"
          value={config.title || ""}
          onChange={(e) => onChange({ ...config, title: e.target.value })}
        />
      </div>

      <div className="space-y-4">
        <Label className="text-[10px] font-black uppercase opacity-40 tracking-[0.2em] italic ml-2">
          Lista de Cards
        </Label>

        <AnimatePresence mode="popLayout">
          {items.map((item: any, idx: number) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="p-6 border border-white/10 rounded-[2.5rem] space-y-4 bg-slate-900/40 relative group shadow-xl"
            >
              <Button
                variant="destructive"
                size="icon"
                className="absolute -top-2 -right-2 h-8 w-8 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all z-10"
                onClick={() => removeItem(idx)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[9px] uppercase font-bold opacity-30">
                    Ícone (Nome Lucide)
                  </Label>
                  <div className="relative">
                    <Input
                      placeholder="Ex: CheckCircle2"
                      className="bg-slate-950 border-white/10 pl-10"
                      value={item.icon || ""}
                      onChange={(e) => updateItem(idx, "icon", e.target.value)}
                    />
                    <CheckCircle2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[9px] uppercase font-bold opacity-30">
                    Título do Card
                  </Label>
                  <Input
                    placeholder="Ex: Alta Tecnologia"
                    className="bg-slate-950 border-white/10 font-bold"
                    value={item.title || ""}
                    onChange={(e) => updateItem(idx, "title", e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[9px] uppercase font-bold opacity-30">
                  Descrição Detalhada
                </Label>
                <Input
                  placeholder="Explique o diferencial..."
                  className="bg-slate-950 border-white/10"
                  value={item.description || ""}
                  onChange={(e) =>
                    updateItem(idx, "description", e.target.value)
                  }
                />
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        <Button
          variant="outline"
          className="w-full border-2 border-dashed border-white/10 py-10 rounded-[2.5rem] hover:bg-blue-600/10 hover:border-blue-500/50 transition-all group"
          onClick={addItem}
        >
          <Plus className="w-5 h-5 mr-2 group-hover:scale-125 transition-transform" />
          <span className="font-black italic uppercase text-xs tracking-widest">
            Adicionar Novo Diferencial
          </span>
        </Button>
      </div>
    </div>
  );
}
