"use client";

import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { Save, Loader2, ArrowUp, ArrowDown, Trash2 } from "lucide-react"; // ✅ Adicionado Trash2
import { Button } from "@/components/ui/button";
import { MediaSelector } from "@/components/landing-page-editor/MediaSelector";
import { HeroNewEditor } from "@/components/landing-page-editor/HeroNewEditor";
import { ProcessGalleryEditor } from "@/components/landing-page-editor/ProcessGalleryEditor";
import { FeaturesSectionEditor } from "@/components/landing-page-editor/FeaturesSectionEditor";

export default function LandingPageManagerPage() {
  const [data, setData] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get("/landing-page/editor").then((res) => {
      const sortedSections = res.data.sections.sort(
        (a: any, b: any) => a.order - b.order,
      );
      setData({ ...res.data, sections: sortedSections });
    });
  }, []);

  // ✅ NOVA FUNÇÃO: Remover a seção inteira
  const removeSection = (index: number) => {
    if (!confirm("Tem certeza que deseja excluir esta seção inteira do site?"))
      return;
    const newSections = data.sections.filter(
      (_: any, i: number) => i !== index,
    );
    // Reordena para não deixar buracos no 'order'
    const reordered = newSections.map((sec: any, i: number) => ({
      ...sec,
      order: i,
    }));
    setData({ ...data, sections: reordered });
  };

  const moveSection = (index: number, direction: "up" | "down") => {
    const newSections = [...data.sections];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newSections.length) return;
    [newSections[index], newSections[targetIndex]] = [
      newSections[targetIndex],
      newSections[index],
    ];
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
      });
      alert("✅ Alterações salvas com sucesso!");
    } catch (e) {
      alert("❌ Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  };

  if (!data)
    return (
      <div className="h-screen bg-[#020617] flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-500 w-10 h-10" />
      </div>
    );

  return (
    <div className="dark bg-[#020617] min-h-screen text-slate-100 p-8 pb-40">
      <div className="max-w-6xl mx-auto space-y-10">
        {/* IDENTIDADE VISUAL */}
        <section className="bg-slate-900 border border-white/10 p-8 rounded-[3rem] flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl backdrop-blur-xl">
          <div className="space-y-2 text-center md:text-left">
            <h2 className="text-blue-500 font-black uppercase italic tracking-[0.3em] text-xs">
              Identidade Visual
            </h2>
            <p className="text-slate-400 text-sm">Logotipo central superior.</p>
          </div>
          <div className="flex items-center gap-6 bg-slate-950 p-5 rounded-[2rem] border border-white/5">
            <MediaSelector
              value={data.logoImageId}
              onChange={(url) => setData({ ...data, logoImageId: url })}
            />
          </div>
        </section>

        {/* LISTAGEM DE MÓDULOS */}
        <div className="space-y-8">
          <AnimatePresence mode="popLayout">
            {data.sections.map((section: any, idx: number) => (
              <motion.div
                key={section.id || idx}
                layout
                className="bg-slate-900/40 border border-white/10 p-8 rounded-[3.5rem] flex flex-col md:flex-row gap-8 relative group"
              >
                {/* Controles Laterais */}
                <div className="flex md:flex-col gap-2 bg-slate-950 p-2 rounded-2xl h-fit border border-white/5 self-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => moveSection(idx, "up")}
                    disabled={idx === 0}
                  >
                    <ArrowUp size={18} />
                  </Button>
                  <span className="flex items-center justify-center font-black italic text-blue-500 text-xs">
                    0{idx + 1}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => moveSection(idx, "down")}
                    disabled={idx === data.sections.length - 1}
                  >
                    <ArrowDown size={18} />
                  </Button>

                  {/* ✅ BOTÃO PARA EXCLUIR A SEÇÃO INTEIRA */}
                  <div className="h-[1px] bg-white/10 my-1" />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeSection(idx)}
                    className="text-red-500 hover:bg-red-500/20"
                  >
                    <Trash2 size={18} />
                  </Button>
                </div>

                <div className="flex-1">
                  <h3 className="text-[10px] font-black uppercase text-blue-400 italic mb-6 tracking-widest">
                    Módulo: {section.type}
                  </h3>
                  {section.type === "hero-new" && (
                    <HeroNewEditor
                      config={section.content}
                      onChange={(c: any) => updateSectionContent(idx, c)}
                    />
                  )}
                  {section.type === "process-gallery" && (
                    <ProcessGalleryEditor
                      config={section.content}
                      onChange={(c: any) => updateSectionContent(idx, c)}
                    />
                  )}
                  {section.type === "features" && (
                    <FeaturesSectionEditor
                      config={section.content}
                      onChange={(c: any) => updateSectionContent(idx, c)}
                    />
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100]"
      >
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-blue-600 hover:bg-blue-700 h-16 px-16 rounded-full font-black italic shadow-[0_0_50px_rgba(37,99,235,0.4)]"
        >
          {saving ? (
            <Loader2 className="animate-spin mr-2" />
          ) : (
            <Save className="mr-2" />
          )}{" "}
          SALVAR CONFIGURAÇÕES
        </Button>
      </motion.div>
    </div>
  );
}
