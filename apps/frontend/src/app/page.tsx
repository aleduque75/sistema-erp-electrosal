"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import api from "@/lib/api";
import { Loader2, Sparkles, CheckCircle2, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export default function HomePage() {
  const [data, setData] = useState<any>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const getImageUrl = (path: any) => {
    if (!path || path === "") return "/images/placeholder.png";
    if (path.startsWith("http") || path.startsWith("/")) return path;
    return `http://localhost:3001/api/public-media/${path}`;
  };

  useEffect(() => {
    api
      .get(`/landing-page/public?t=${Date.now()}`, {
        headers: { skipAuth: true },
      })
      .then((res) => setData(res.data))
      .catch((err) => console.error("Erro ao carregar:", err));
  }, []);

  const nextSlide = useCallback(() => {
    const hero = data?.sections?.find((s: any) => s.type === "hero-new");
    const total = hero?.content?.slides?.length || 0;
    if (total > 0)
      setCurrentSlide((prev) => (prev === total - 1 ? 0 : prev + 1));
  }, [data]);

  // ✅ AUTOPLAY CONTÍNUO (Sem pausa no hover)
  useEffect(() => {
    const hero = data?.sections?.find((s: any) => s.type === "hero-new");
    const total = hero?.content?.slides?.length || 0;

    if (total <= 1) return;

    timerRef.current = setInterval(nextSlide, 6000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [data, nextSlide, currentSlide]);

  if (!data)
    return (
      <div className="h-screen bg-[#020617] flex items-center justify-center text-blue-500">
        <Loader2 className="animate-spin w-12 h-12" />
      </div>
    );

  return (
    <main className="dark bg-[#020617] min-h-screen text-slate-100 selection:bg-blue-500/30 font-sans">
      {data.sections?.map((section: any) => {
        // --- 1. SEÇÃO: HERO CARROSSEL ---
        if (section.type === "hero-new") {
          const slides = section.content?.slides || [];
          const slide = slides[currentSlide];
          return (
            <section
              key={section.id}
              className="relative h-[85vh] md:h-screen w-full overflow-hidden border-b border-white/5"
            >
              {/* LOGOTIPO ABSOLUTO (Rola com a página) */}
              <div className="absolute top-8 md:top-12 left-0 w-full z-[100] flex justify-center pointer-events-none px-6">
                <motion.div
                  initial={{ y: -50, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="pointer-events-auto"
                >
                  {data.logoImageId ? (
                    <img
                      src={getImageUrl(data.logoImageId)}
                      className="h-10 md:h-18 w-auto drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]"
                      alt="Logo"
                    />
                  ) : (
                    <span className="text-xl font-black italic tracking-tighter text-white bg-slate-900/50 px-6 py-2 rounded-full border border-white/10 backdrop-blur-md uppercase">
                      {data.logoText || "ELECTROSAL"}
                    </span>
                  )}
                </motion.div>
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={currentSlide}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1.2 }}
                  className="absolute inset-0 flex items-center"
                >
                  <div className="absolute inset-0">
                    <motion.img
                      initial={{ scale: 1.15 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 6, ease: "linear" }}
                      src={getImageUrl(slide?.imageUrl)}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-slate-950/20 via-slate-950/80 to-slate-950" />
                  </div>

                  <div className="w-full px-6 md:px-12 lg:px-24 relative z-20 pt-24 text-center md:text-left">
                    <div className="max-w-[1400px] mx-auto md:mx-0 space-y-4">
                      <motion.h1
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                        className="text-4xl sm:text-7xl md:text-8xl lg:text-[9rem] font-black italic uppercase tracking-tighter leading-[0.85] text-white"
                      >
                        {slide?.title}
                      </motion.h1>

                      {slide?.subtitle && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.5 }}
                          className="flex items-center justify-center md:justify-start gap-3 text-white/80 font-bold uppercase tracking-[0.4em] text-[10px] md:text-xs italic"
                        >
                          <Sparkles className="w-4 h-4" />{" "}
                          <span>{slide.subtitle}</span>
                        </motion.div>
                      )}

                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.6 }}
                        transition={{ delay: 0.7 }}
                        className="text-base md:text-xl lg:text-2xl max-w-2xl font-light leading-relaxed pt-4 text-slate-300 mx-auto md:mx-0"
                      >
                        {slide?.description}
                      </motion.p>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* DASHES INDICADORES BRANCOS */}
              <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-40 flex items-end gap-4 md:gap-8">
                {slides.map((_: any, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentSlide(idx)}
                    className="group flex flex-col items-center gap-2"
                  >
                    <span
                      className={cn(
                        "text-[10px] font-black italic",
                        idx === currentSlide ? "text-white" : "text-white/20",
                      )}
                    >
                      0{idx + 1}
                    </span>
                    <div
                      className={cn(
                        "h-[3px] rounded-full transition-all duration-700 relative overflow-hidden bg-white/10",
                        idx === currentSlide
                          ? "w-16 md:w-32"
                          : "w-8 md:w-12 group-hover:w-16",
                      )}
                    >
                      {idx === currentSlide && (
                        <motion.div
                          key={`timer-${currentSlide}`}
                          initial={{ x: "-100%" }}
                          animate={{ x: 0 }}
                          transition={{ duration: 6, ease: "linear" }}
                          className="absolute inset-0 bg-white/60"
                        />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </section>
          );
        }

        // --- 2. SEÇÃO: PROCESSOS (2 cols no tablet / 3 cols no largo) ---
        if (section.type === "process-gallery") {
          const processes = section.content?.processes || [];
          return (
            <section
              key={section.id}
              className="py-24 md:py-32 bg-slate-950 relative overflow-hidden"
            >
              <div className="w-full px-6 md:px-12 lg:px-24">
                <div className="max-w-[1400px] mx-auto">
                  <div className="mb-16 border-l-8 border-white/20 pl-6 md:pl-10 text-white">
                    <h2 className="text-4xl md:text-7xl lg:text-9xl font-black uppercase italic tracking-tighter">
                      {section.content?.title || "Processos"}
                    </h2>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8 md:gap-12 lg:gap-16">
                    {processes.map((item: any, i: number) => (
                      <motion.div
                        key={i}
                        whileInView={{ opacity: 1, y: 0 }}
                        initial={{ opacity: 0, y: 40 }}
                        viewport={{ once: true }}
                        className="group"
                      >
                        <div className="relative aspect-[3/4] sm:aspect-[4/5] rounded-[2rem] md:rounded-[3.5rem] overflow-hidden border border-white/5 bg-slate-900 shadow-3xl mb-8">
                          <img
                            src={getImageUrl(item.imageUrl)}
                            className="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-1000"
                            alt=""
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent opacity-60" />
                          <div className="absolute bottom-6 left-6 right-6 p-6 rounded-[2rem] bg-slate-900/60 backdrop-blur-xl border border-white/10">
                            <div className="text-white/40 font-black italic text-[10px] mb-1 uppercase tracking-widest">
                              Fase 0{i + 1}
                            </div>
                            <h3 className="text-lg md:text-2xl font-black uppercase italic text-white tracking-tighter leading-none">
                              {item.title}
                            </h3>
                          </div>
                        </div>
                        <p className="text-slate-500 font-medium px-4 text-sm md:text-base leading-relaxed">
                          {item.description}
                        </p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          );
        }

        // --- 3. SEÇÃO: DIFERENCIAIS / FEATURES ---
        if (section.type === "features") {
          const items = section.content?.items || [];
          return (
            <section key={section.id} className="py-24 bg-[#020617]">
              <div className="w-full px-6 md:px-12 lg:px-24">
                <div className="max-w-[1400px] mx-auto">
                  {section.content?.title && (
                    <div className="mb-16 border-l-8 border-blue-600/30 pl-6 md:pl-10 text-white">
                      <h2 className="text-4xl md:text-7xl font-black uppercase italic tracking-tighter">
                        {section.content.title}
                      </h2>
                    </div>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-10">
                    {items.map((feat: any, i: number) => (
                      <motion.div
                        key={i}
                        whileHover={{ y: -10 }}
                        className="p-8 md:p-12 rounded-[2.5rem] md:rounded-[4rem] border border-white/5 bg-slate-900/20 backdrop-blur-3xl group transition-all duration-500"
                      >
                        <div className="w-12 h-12 md:w-16 h-16 bg-blue-600 text-white rounded-2xl flex items-center justify-center mb-8 shadow-2xl shadow-blue-600/30 group-hover:rotate-6 transition-transform">
                          <CheckCircle2 className="w-6 h-6 md:w-8 h-8" />
                        </div>
                        <h3 className="text-xl md:text-3xl font-black uppercase italic mb-4 tracking-tighter text-white">
                          {feat.title}
                        </h3>
                        <p className="text-slate-400 text-sm md:text-lg leading-relaxed font-light">
                          {feat.description}
                        </p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          );
        }

        return null;
      })}
    </main>
  );
}
