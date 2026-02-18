"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, X } from "lucide-react";

export default function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Verifica se o usuário já aceitou os cookies anteriormente
    const consent = localStorage.getItem("electrosal_cookies");
    if (!consent) {
      setIsVisible(true);
    }
  }, []);

  const acceptCookies = () => {
    localStorage.setItem("electrosal_cookies", "true");
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-6 left-6 right-6 z-[100] md:left-auto md:right-10 md:max-w-sm"
        >
          <div className="bg-zinc-950 border border-white/10 p-6 rounded-[2.5rem] shadow-2xl backdrop-blur-xl bg-opacity-95">
            <div className="flex gap-4 items-start">
              <div className="bg-amber-600/20 p-3 rounded-2xl shrink-0">
                <ShieldCheck className="text-amber-500 w-6 h-6" />
              </div>
              <div className="flex-1">
                <h4 className="text-white font-black italic uppercase text-xs tracking-widest mb-2">
                  Privacidade
                </h4>
                <p className="text-zinc-400 text-[13px] font-medium italic leading-relaxed">
                  Este site utiliza cookies para melhorar sua experiência industrial. Ao continuar, você aceita nossos termos.
                </p>
                <div className="mt-5 flex gap-3">
                  <button
                    onClick={acceptCookies}
                    className="flex-1 bg-white text-zinc-950 py-3 rounded-xl font-black italic uppercase text-[10px] tracking-widest hover:bg-amber-500 transition-colors"
                  >
                    ACEITAR
                  </button>
                  <button
                    onClick={() => setIsVisible(false)}
                    className="px-4 py-3 rounded-xl border border-white/5 text-zinc-500 hover:text-white transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}