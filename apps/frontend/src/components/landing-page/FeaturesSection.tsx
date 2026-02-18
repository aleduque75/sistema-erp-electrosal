"use client";

import * as LucideIcons from "lucide-react";
import { LucideIcon } from "lucide-react";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";

// Adicionando suporte ao onClick para abrir o Dialog que criamos na Home
interface FeaturesSectionProps {
  config?: any;
  onItemClick?: (item: any) => void;
}

export function FeaturesSection({ config, onItemClick }: FeaturesSectionProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  if (!config || !config.items || config.items.length === 0) {
    return null;
  }

  return (
    <section ref={ref} className="w-full py-24 bg-white px-6 md:px-24">
      <div className="max-w-[1400px] mx-auto">
        {/* Título da Seção Dinâmico */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -30 }}
          transition={{ duration: 0.8 }}
          className="mb-16 border-l-[10px] border-blue-600 pl-6"
        >
          <h2 className="text-4xl md:text-6xl font-black italic uppercase tracking-tighter text-slate-900">
            {config.title || "Assessoria & Gestão"}
          </h2>
          {config.description && (
            <p className="text-slate-500 font-bold mt-2 uppercase tracking-widest text-sm">
              {config.description}
            </p>
          )}
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {config.items.map((item: any, index: number) => {
            // ✅ CORREÇÃO DO ÍCONE: Busca dinâmica na biblioteca Lucide
            const IconName = item.icon || "CheckCircle2";
            const IconComponent = (LucideIcons as any)[IconName] as LucideIcon;

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                onClick={() => onItemClick && onItemClick(item)} // Abre o Dialog
                className="p-10 rounded-[3.5rem] bg-slate-50 border border-slate-100 hover:shadow-2xl transition-all cursor-pointer group relative overflow-hidden"
              >
                {/* Ícone Dinâmico */}
                <div className="w-16 h-16 bg-blue-600 text-white rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-blue-100 transition-transform group-hover:scale-110 group-hover:rotate-3">
                  {IconComponent ? (
                    <IconComponent className="w-8 h-8" />
                  ) : (
                    <LucideIcons.HelpCircle className="w-8 h-8" />
                  )}
                </div>

                <h3 className="text-2xl font-black italic uppercase text-slate-900 mb-2 leading-tight">
                  {item.title}
                </h3>
                
                {/* Descrição Curta (Home) */}
                <p className="text-slate-500 font-bold mb-6 line-clamp-3 leading-relaxed italic">
                  {item.description}
                </p>

                {/* Link Visual para o Modal */}
                <div className="flex items-center gap-2 text-blue-600 font-black italic text-xs uppercase tracking-widest group-hover:gap-4 transition-all">
                  <span>{item.ctaText || "Ver Detalhes Técnicos"}</span>
                  <LucideIcons.ArrowRight className="w-4 h-4" />
                </div>

                {/* Efeito decorativo no fundo do card */}
                <div className="absolute -bottom-4 -right-4 opacity-5 group-hover:opacity-10 transition-opacity">
                   {IconComponent && <IconComponent className="w-24 h-24" />}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}