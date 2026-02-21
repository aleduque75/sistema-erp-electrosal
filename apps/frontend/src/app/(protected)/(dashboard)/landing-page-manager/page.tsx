"use client";

import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { Save, Loader2, ArrowUp, ArrowDown, Trash2, Plus, LayoutPanelTop } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MediaSelector } from "@/components/landing-page-editor/MediaSelector";
import { HeroNewEditor } from "@/components/landing-page-editor/HeroNewEditor";
import { ProcessGalleryEditor } from "@/components/landing-page-editor/ProcessGalleryEditor";
import { FeaturesSectionEditor } from "@/components/landing-page-editor/FeaturesSectionEditor";

export default function LandingPageManagerPage() {
  const [data, setData] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    try {
      const res = await api.get("/landing-page/editor");
      const sections = res.data?.sections || [];
      const sortedSections = [...sections].sort((a: any, b: any) => a.order - b.order);
      setData({ ...res.data, sections: sortedSections });
    } catch (error) {
      console.error("Erro ao carregar:", error);
      // Fallback para evitar tela de loading infinita
      setData({
        logoText: "Minha Empresa",
        sections: [],
        logoImageId: null
      });
    }
  };

  useEffect(() => { loadData(); }, []);

  // Função para ADICIONAR novas seções manualmente
  const addSection = (type: "hero-new" | "process-gallery" | "features") => {
    const newSection = {
      type,
      order: data.sections.length,
      content: getInitialContent(type),
    };
    setData({ ...data, sections: [...data.sections, newSection] });
  };

  // Conteúdo inicial padrão para cada tipo para não vir em branco
  const getInitialContent = (type: string) => {
    if (type === "hero-new") return { title: "Novo Título", subtitle: "Subtítulo aqui", description: "Descrição...", ctaButtonText: "Começar" };
    if (type === "features") return { title: "Nossos Diferenciais", items: [] };
    if (type === "process-gallery") return { title: "Galeria", processes: [] };
    return {};
  };

  const removeSection = (index: number) => {
    if (!confirm("Excluir esta seção?")) return;
    const newSections = data.sections.filter((_: any, i: number) => i !== index);
    const reordered = newSections.map((sec: any, i: number) => ({ ...sec, order: i }));
    setData({ ...data, sections: reordered });
  };

  const moveSection = (index: number, direction: "up" | "down") => {
    const newSections = [...data.sections];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newSections.length) return;
    [newSections[index], newSections[targetIndex]] = [newSections[targetIndex], newSections[index]];
    const reordered = newSections.map((sec, i) => ({ ...sec, order: i }));
    setData({ ...data, sections: reordered });
  };

  const updateSectionContent = (index: number, newContent: any) => {
    const updatedSections = [...data.sections];
    updatedSections[index].content = newContent;
    setData({ ...data, sections: updatedSections });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.patch("/landing-page", {
        sections: data.sections,
        logoText: data.logoText,
        logoImageId: data.logoImageId,
        highlights: data.highlights,
      });
      alert("✅ Salvo com sucesso!");
    } catch (e) {
      alert("❌ Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  };

  if (!data) return (
    <div className="h-screen bg-[#020617] flex items-center justify-center">
      <Loader2 className="animate-spin text-blue-500 w-10 h-10" />
    </div>
  );

  return (
    <div className="dark bg-[#020617] min-h-screen text-slate-100 p-8 pb-40">
      <div className="max-w-6xl mx-auto space-y-10">

        {/* IDENTIDADE VISUAL */}
        <section className="bg-slate-900 border border-white/10 p-8 rounded-[3rem] flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl">
          <div className="space-y-2">
            <h2 className="text-blue-500 font-black uppercase italic tracking-widest text-xs">Identidade Visual</h2>
            <input
              className="bg-transparent border-b border-white/10 text-xl font-bold outline-none focus:border-blue-500 transition-all w-full"
              value={data.logoText || ""}
              onChange={(e) => setData({ ...data, logoText: e.target.value })}
              placeholder="Nome da Marca"
            />
          </div>
          <MediaSelector label="Logo da Empresa" value={data.logoImageId} onChange={(id) => setData({ ...data, logoImageId: id })} />
        </section>

        {/* DESTAQUES GLOBAIS */}
        <section className="bg-slate-900 border border-white/10 p-8 rounded-[3rem] space-y-6 shadow-2xl">
          <div className="flex items-center justify-between">
            <h2 className="text-blue-500 font-black uppercase italic tracking-widest text-xs">Destaques do Modal (Sidebar)</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const highlights = Array.isArray(data.highlights) ? data.highlights : [];
                setData({ ...data, highlights: [...highlights, "Novo Destaque"] });
              }}
              className="border-white/10 hover:bg-blue-600/20 text-[10px] font-bold"
            >
              <Plus size={14} className="mr-1" /> ADICIONAR ITEM
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.isArray(data.highlights) && data.highlights.map((item: string, idx: number) => (
              <div key={idx} className="flex gap-2 items-center bg-slate-950/50 p-3 rounded-2xl border border-white/5 group">
                <input
                  className="bg-transparent border-none text-sm outline-none focus:text-blue-400 transition-all w-full font-medium"
                  value={item}
                  onChange={(e) => {
                    const newHighlights = [...data.highlights];
                    newHighlights[idx] = e.target.value;
                    setData({ ...data, highlights: newHighlights });
                  }}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="opacity-0 group-hover:opacity-100 text-red-500 hover:bg-red-500/10 h-8 w-8 rounded-full transition-opacity"
                  onClick={() => {
                    const newHighlights = data.highlights.filter((_: any, i: number) => i !== idx);
                    setData({ ...data, highlights: newHighlights });
                  }}
                >
                  <Trash2 size={14} />
                </Button>
              </div>
            ))}
            {(!data.highlights || data.highlights.length === 0) && (
              <p className="text-slate-500 text-xs italic col-span-2 text-center py-4">Nenhum destaque configurado.</p>
            )}
          </div>
        </section>

        {/* LISTAGEM DE MÓDULOS */}
        <div className="space-y-8">
          <AnimatePresence mode="popLayout">
            {data.sections.map((section: any, idx: number) => (
              <motion.div key={idx} layout className="bg-slate-900/40 border border-white/10 p-8 rounded-[3.5rem] flex flex-col md:flex-row gap-8 relative">
                <div className="flex md:flex-col gap-2 bg-slate-950 p-2 rounded-2xl h-fit border border-white/5 self-center">
                  <Button variant="ghost" size="icon" onClick={() => moveSection(idx, "up")} disabled={idx === 0}><ArrowUp size={18} /></Button>
                  <Button variant="ghost" size="icon" onClick={() => moveSection(idx, "down")} disabled={idx === data.sections.length - 1}><ArrowDown size={18} /></Button>
                  <Button variant="ghost" size="icon" onClick={() => removeSection(idx)} className="text-red-500 hover:bg-red-500/20"><Trash2 size={18} /></Button>
                </div>
                <div className="flex-1">
                  <h3 className="text-[10px] font-black uppercase text-blue-400 italic mb-6 tracking-widest">Módulo: {section.type}</h3>
                  {section.type === "hero-new" && <HeroNewEditor config={section.content} onChange={(c: any) => updateSectionContent(idx, c)} />}
                  {section.type === "process-gallery" && <ProcessGalleryEditor config={section.content} onChange={(c: any) => updateSectionContent(idx, c)} />}
                  {section.type === "features" && <FeaturesSectionEditor config={section.content} onChange={(c: any) => updateSectionContent(idx, c)} />}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* BOTÕES PARA ADICIONAR */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-8 border-2 border-dashed border-white/5 rounded-[3rem] bg-slate-900/20">
            <Button onClick={() => addSection("hero-new")} variant="ghost" className="h-20 border border-white/5 hover:bg-blue-600/20 rounded-[2rem]">
              <Plus className="mr-2 text-blue-500" /> Adicionar Hero New
            </Button>
            <Button onClick={() => addSection("features")} variant="ghost" className="h-20 border border-white/5 hover:bg-purple-600/20 rounded-[2rem]">
              <Plus className="mr-2 text-purple-500" /> Adicionar Features
            </Button>
            <Button onClick={() => addSection("process-gallery")} variant="ghost" className="h-20 border border-white/5 hover:bg-emerald-600/20 rounded-[2rem]">
              <Plus className="mr-2 text-emerald-500" /> Adicionar Galeria
            </Button>
          </div>
        </div>
      </div>

      {/* SALVAR */}
      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100]">
        <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700 h-16 px-16 rounded-full font-black italic shadow-2xl">
          {saving ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2" />} SALVAR CONFIGURAÇÕES
        </Button>
      </div>
    </div>
  );
}