"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import api from "@/lib/api";
import {
  Loader2,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Zap,
  Mail,
  Phone,
  User,
  MessageSquare,
  Send,
} from "lucide-react";
import * as LucideIcons from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import CookieConsent from "./CookieConsent";

// Animações para o Título Staggered
const titleContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 },
  },
};
const titleWord = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: [0.215, 0.61, 0.355, 1] },
  },
};

export default function HomePage() {
  const [data, setData] = useState<any>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [activeDialogContent, setActiveDialogContent] = useState<any>(null);
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [sentName, setSentName] = useState("");
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const getImageUrl = (path: any) => {
    const DEFAULT =
      "https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?q=80&w=1470&auto=format&fit=crop";
    if (!path || path === "" || path === "undefined") return DEFAULT;
    if (path.startsWith("http") || path.startsWith("/")) return path;

    // Usa o host dinâmico do ambiente ou relativo se no navegador
    const baseUrl = typeof window !== "undefined" ? "" : (process.env.NEXT_PUBLIC_API_URL || "https://api.electrosal.com.br");
    return `${baseUrl}/api/media/public-media/${path}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "");
    const match = value.match(/^(\d{0,2})(\d{0,5})(\d{0,4})$/);
    if (match) {
      const maskedValue = !match[2]
        ? match[1]
        : `(${match[1]}) ${match[2]}${match[3] ? "-" + match[3] : ""}`;
      setPhone(maskedValue.substring(0, 15));
    } else {
      setPhone(value.substring(0, 15));
    }
  };

  const handleContactSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const nome = formData.get("nome") as string;

    const data = {
      nome: nome,
      name: nome,
      whatsapp: phone,
      phone: phone,
      number: phone,
      mensagem: formData.get("mensagem"),
      timestamp: new Date().toISOString(),
      origem: "Landing Page Electrosal",
    };

    const payload = {
      ...data,
      body: data
    };

    try {
      const webhookUrl = process.env.NEXT_PUBLIC_WEBHOOK_URL || "https://n8n.electrosal.com.br/webhook/contato-lp";
      await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      setSentName(nome);
      setIsContactOpen(false);
      setIsSuccessOpen(true);
      setPhone("");
      (e.target as HTMLFormElement).reset();
    } catch (error) {
      alert("Erro ao enviar. Verifique sua conexão e tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    api
      .get(`/landing-page/public?t=${Date.now()}`, {
        headers: { skipAuth: true },
      })
      .then((res) => setData(res.data))
      .catch((err) => {
        console.error("Erro ao carregar dados", err);
        // Define um estado padrão mínimo para evitar loop infinito de loading
        setData({ sections: [], logoImageId: null });
      });
  }, []);

  const nextSlide = useCallback(() => {
    const hero = data?.sections?.find((s: any) => s.type === "hero-new");
    const total = hero?.content?.slides?.length || 0;
    if (total > 0)
      setCurrentSlide((prev) => (prev === total - 1 ? 0 : prev + 1));
  }, [data]);

  useEffect(() => {
    const hero = data?.sections?.find((s: any) => s.type === "hero-new");
    if (hero?.content?.slides?.length > 1) {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(nextSlide, 7000);
      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    }
  }, [data, nextSlide]);

  if (!data)
    return (
      <div className="h-screen bg-zinc-950 flex flex-col items-center justify-center text-amber-500 font-black italic uppercase tracking-[0.5em]">
        <Loader2 className="animate-spin mb-4 w-12 h-12" /> ELECTROSAL
      </div>
    );

  return (
    <main className="bg-zinc-50 min-h-screen text-zinc-900 overflow-x-hidden selection:bg-amber-500 selection:text-white">
      {/* DIALOG DE SUCESSO (LOGO EMPRESA) */}
      <Dialog open={isSuccessOpen} onOpenChange={setIsSuccessOpen}>
        <DialogContent className="max-w-[500px] w-[90vw] rounded-[3rem] border-none bg-white p-12 shadow-2xl text-center">
          <div className="flex flex-col items-center space-y-6">
            <div className="bg-zinc-100 p-6 rounded-full shrink-0">
              <img
                src={getImageUrl(data?.logoImageId)}
                className="h-12 md:h-16 object-contain"
                alt="Logo Electrosal"
              />
            </div>
            <div className="bg-green-100 text-green-600 w-16 h-16 rounded-full flex items-center justify-center">
              <CheckCircle2 size={32} />
            </div>
            <DialogTitle className="text-3xl font-black italic uppercase tracking-tighter text-zinc-900 leading-none">
              SOLICITAÇÃO <span className="text-amber-600">ENVIADA!</span>
            </DialogTitle>
            <p className="text-zinc-500 font-bold italic leading-relaxed">
              Olá, <span className="text-zinc-900 uppercase">{sentName}</span>.
              Recebemos sua mensagem. A equipe Electrosal entrará em contato via
              WhatsApp em breve.
            </p>
            <button
              onClick={() => setIsSuccessOpen(false)}
              className="w-full bg-zinc-900 text-white py-5 rounded-2xl font-black italic uppercase tracking-widest text-xs hover:bg-amber-600 transition-colors"
            >
              ENTENDIDO
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* DIALOG DE CONTATO */}
      <Dialog open={isContactOpen} onOpenChange={setIsContactOpen}>
        <DialogContent className="max-w-[600px] w-[95vw] rounded-[3.5rem] border-none bg-zinc-950 p-12 md:p-16 shadow-2xl">
          <header className="text-center space-y-4">
            <div className="w-16 h-16 bg-amber-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-amber-600/20">
              <Mail className="text-white w-8 h-8" />
            </div>
            <DialogTitle className="text-4xl md:text-5xl font-black italic uppercase text-white tracking-tighter leading-none">
              SOLICITAR <span className="text-amber-500">CONSULTORIA</span>
            </DialogTitle>
          </header>

          <form className="space-y-4 mt-10" onSubmit={handleContactSubmit}>
            <div className="relative group">
              <User className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-amber-500 w-5 h-5 transition-colors" />
              <input
                name="nome"
                required
                placeholder="SEU NOME COMPLETO"
                className="w-full bg-zinc-900 border border-white/5 rounded-2xl py-5 pl-16 pr-6 text-white font-bold italic focus:border-amber-500/50 outline-none transition-all"
              />
            </div>
            <div className="relative group">
              <Phone className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-amber-500 w-5 h-5 transition-colors" />
              <input
                required
                value={phone}
                onChange={handlePhoneChange}
                placeholder="(11) 99999-9999"
                className="w-full bg-zinc-900 border border-white/5 rounded-2xl py-5 pl-16 pr-6 text-white font-bold italic focus:border-amber-500/50 outline-none transition-all"
              />
            </div>
            <div className="relative group">
              <MessageSquare className="absolute left-6 top-8 text-zinc-600 group-focus-within:text-amber-500 w-5 h-5 transition-colors" />
              <textarea
                name="mensagem"
                required
                rows={4}
                placeholder="DESCREVA SUA NECESSIDADE..."
                className="w-full bg-zinc-900 border border-white/5 rounded-3xl py-7 pl-16 pr-6 text-white font-bold italic focus:border-amber-500/50 outline-none transition-all resize-none"
              />
            </div>
            <button
              disabled={loading}
              className="w-full bg-amber-600 hover:bg-white hover:text-amber-700 text-white py-6 rounded-2xl font-black italic uppercase text-xs tracking-[0.3em] transition-all flex items-center justify-center gap-4"
            >
              {loading ? "PROCESSANDO..." : "ENVIAR SOLICITAÇÃO"}{" "}
              <Send className="w-4 h-4" />
            </button>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIALOG DE DETALHES */}
      <Dialog
        open={!!activeDialogContent}
        onOpenChange={(open) => !open && setActiveDialogContent(null)}
      >
        <DialogContent className="max-w-[1100px] w-[95vw] h-[90vh] flex flex-col rounded-[3.5rem] border-none bg-zinc-50 p-0 shadow-2xl overflow-hidden">
          <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-amber-600">
            <div className="relative h-[350px] md:h-[500px] w-full">
              <img
                src={getImageUrl(activeDialogContent?.imageUrl)}
                className="w-full h-full object-cover"
                alt="Detail"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-50 via-zinc-950/20 to-transparent" />
            </div>
            <div className="p-8 md:p-20 space-y-12 text-left">
              <header>
                <div className="flex items-center gap-2 mb-4 italic text-amber-600 font-black tracking-widest text-[10px]">
                  <Sparkles className="w-4 h-4" /> TECNOLOGIA ELECTROSAL
                </div>
                <DialogTitle className="text-5xl md:text-8xl font-black italic uppercase tracking-tighter text-zinc-950 leading-[0.85]">
                  {activeDialogContent?.title}
                </DialogTitle>
              </header>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-16 pb-12">
                <div className="md:col-span-2 text-zinc-700 text-xl md:text-3xl leading-snug font-medium italic tracking-tight">
                  {activeDialogContent?.modalContent
                    ?.split("\n")
                    .map((p: any, i: any) => (
                      <p key={i} className="mb-8">
                        {p}
                      </p>
                    )) || activeDialogContent?.description}
                </div>
                <aside className="sticky top-0 h-fit bg-zinc-900 p-12 rounded-[3.5rem] text-white shadow-2xl border border-amber-500/10">
                  <h4 className="font-black italic uppercase text-amber-500 text-xs mb-10 tracking-widest text-center">
                    Destaques
                  </h4>
                  <ul className="space-y-6">
                    {[
                      "Suporte 35 Anos",
                      "Zinco de Alta Performance",
                      "Processos Otimizados",
                    ].map((i) => (
                      <li
                        key={i}
                        className="flex items-center gap-4 text-sm font-bold italic"
                      >
                        <CheckCircle2 className="w-5 h-5 text-amber-500 shrink-0" />{" "}
                        {i}
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => {
                      setActiveDialogContent(null);
                      setTimeout(() => setIsContactOpen(true), 300);
                    }}
                    className="w-full mt-10 bg-amber-600 py-6 rounded-2xl font-black italic uppercase text-[11px] tracking-widest hover:bg-white hover:text-amber-600 transition-all"
                  >
                    FALAR COM EQUIPE
                  </button>
                </aside>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* SECTIONS */}
      {data.sections?.map((section: any) => {
        if (section.type === "hero-new") {
          const slide = section.content?.slides?.[currentSlide];
          if (!slide) return null;
          return (
            <section
              key={section.id}
              className="relative h-screen w-full bg-zinc-950 overflow-hidden"
            >
              <div className="absolute top-10 w-full z-40 flex justify-center">
                <div className="bg-zinc-900/60 backdrop-blur-xl px-10 py-5 rounded-full border border-white/10 flex items-center gap-4">
                  {data.logoImageId && (
                    <img
                      src={getImageUrl(data.logoImageId)}
                      className="h-10 md:h-16 object-contain"
                      alt="Logo"
                    />
                  )}
                  {data.logoText && (
                    <span className="text-white font-black italic uppercase tracking-widest text-sm md:text-xl border-l border-white/20 pl-4 whitespace-nowrap">
                      {data.logoText}
                    </span>
                  )}
                </div>
              </div>
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentSlide}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 flex items-center"
                >
                  <motion.img
                    initial={{ scale: 1.2 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 10 }}
                    src={getImageUrl(slide?.imageUrl)}
                    className="absolute inset-0 w-full h-full object-cover opacity-60"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/70 to-transparent" />
                  <div className="relative z-20 px-6 md:px-24 text-left">
                    <motion.div
                      variants={titleContainer}
                      initial="hidden"
                      animate="visible"
                      className="flex flex-col max-w-6xl"
                    >
                      <div className="flex flex-wrap gap-x-[0.3em] mb-4">
                        {slide?.title?.split(" ").map((word: any, i: any) => (
                          <motion.span
                            key={i}
                            variants={titleWord}
                            className={cn(
                              "text-6xl md:text-[8.5rem] font-black italic tracking-tighter leading-[0.8] uppercase",
                              i === 1 ? "text-amber-500" : "text-white"
                            )}
                          >
                            {word}
                          </motion.span>
                        ))}
                      </div>

                      {slide?.subtitle && (
                        <motion.span
                          variants={titleWord}
                          className="text-amber-500 font-black italic uppercase tracking-widest text-sm md:text-2xl mb-6"
                        >
                          {slide.subtitle}
                        </motion.span>
                      )}

                      {slide?.description && (
                        <motion.p
                          variants={titleWord}
                          className="text-zinc-300 font-bold italic text-lg md:text-2xl max-w-2xl leading-relaxed mb-4"
                        >
                          {slide.description}
                        </motion.p>
                      )}
                    </motion.div>

                    <button
                      onClick={() => setActiveDialogContent(slide)}
                      className="mt-8 bg-amber-600 text-white px-14 py-6 rounded-full font-black italic uppercase flex items-center gap-4 hover:bg-white hover:text-amber-600 transition-all shadow-xl shadow-amber-600/20"
                    >
                      {slide.ctaText || "CONSULTORIA"} <ArrowRight />
                    </button>
                  </div>
                </motion.div>
              </AnimatePresence>
            </section>
          );
        }

        if (section.type === "process-gallery") {
          return (
            <section
              key={section.id}
              className="py-32 bg-zinc-100 px-6 md:px-24 text-left"
            >
              <div className="max-w-[1400px] mx-auto">
                <h2 className="text-5xl md:text-8xl font-black italic uppercase tracking-tighter text-zinc-900 mb-20 border-l-[12px] border-amber-600 pl-8">
                  WORKFLOW
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                  {section.content?.processes?.map((proc: any, i: any) => (
                    <div
                      key={i}
                      className="group cursor-pointer"
                      onClick={() => setActiveDialogContent(proc)}
                    >
                      <div className="aspect-[4/5] rounded-[3rem] overflow-hidden relative shadow-2xl bg-white border border-zinc-200">
                        <img
                          src={getImageUrl(proc.imageUrl)}
                          className="w-full h-full object-cover transition-all duration-1000 group-hover:scale-110 grayscale group-hover:grayscale-0"
                          alt={proc.title}
                        />
                        <div className="absolute inset-0 bg-amber-600/30 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center backdrop-blur-sm">
                          <span className="bg-zinc-900 text-amber-500 px-8 py-3 rounded-full font-black italic text-xs">
                            DETALHES +
                          </span>
                        </div>
                      </div>
                      <h3 className="mt-8 text-3xl font-black italic uppercase text-zinc-900 leading-none">
                        {proc.title}
                      </h3>
                      <p className="mt-2 text-zinc-500 font-bold italic line-clamp-2">
                        {proc.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          );
        }

        if (section.type === "features") {
          return (
            <section
              key={section.id}
              className="py-32 bg-zinc-950 px-6 md:px-24 relative overflow-hidden text-left"
            >
              <div className="max-w-[1400px] mx-auto relative z-10">
                <h2 className="text-5xl md:text-[8rem] font-black italic uppercase tracking-tighter text-white mb-24">
                  SOLUÇÕES
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                  {section.content?.items?.map((feat: any, i: any) => {
                    const IconComp = (LucideIcons as any)[feat.icon] || Zap;
                    return (
                      <motion.div
                        key={i}
                        whileHover={{ y: -10 }}
                        onClick={() => setActiveDialogContent(feat)}
                        className={cn(
                          "group cursor-pointer p-12 rounded-[4rem] transition-all duration-500 border border-white/5 bg-zinc-900/40 backdrop-blur-sm hover:border-amber-500/30",
                          i === 0 || i === 3
                            ? "md:col-span-7"
                            : "md:col-span-5",
                        )}
                      >
                        <div className="relative z-20 h-full flex flex-col justify-between">
                          <div>
                            <div className="w-16 h-16 bg-amber-600 text-white rounded-2xl flex items-center justify-center mb-10 shadow-xl group-hover:rotate-6 transition-transform">
                              <IconComp className="w-8 h-8" />
                            </div>
                            <h3 className="text-3xl md:text-5xl font-black italic uppercase text-white mb-4 tracking-tighter leading-none">
                              {feat.title}
                            </h3>
                            <p className="text-zinc-400 font-bold text-lg leading-relaxed italic mb-10 line-clamp-3">
                              {feat.description}
                            </p>
                          </div>
                          <div className="flex items-center gap-3 text-amber-500 font-black italic text-[10px] tracking-[0.2em]">
                            SAIBA MAIS{" "}
                            <div className="p-2 bg-amber-600 text-white rounded-full">
                              <ArrowRight className="w-4 h-4" />
                            </div>
                          </div>
                        </div>
                        <div className="absolute -bottom-10 -right-10 text-amber-500 opacity-0 group-hover:opacity-10 transition-all duration-700 rotate-[20deg] group-hover:rotate-[-10deg]">
                          <IconComp size={300} strokeWidth={1} />
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </section>
          );
        }
        return null;
      })}
      <CookieConsent />
    </main>
  );
}
