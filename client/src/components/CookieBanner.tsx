import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface CookieBannerProps {
  language: "es" | "en";
}

export default function CookieBanner({ language }: CookieBannerProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('vwb_cookie_consent');
    if (!consent) {
      const timer = setTimeout(() => setVisible(true), 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const acceptCookies = () => {
    localStorage.setItem('vwb_cookie_consent', 'accepted');
    setVisible(false);
  };

  const declineCookies = () => {
    localStorage.setItem('vwb_cookie_consent', 'declined');
    setVisible(false);
  };

  const content = {
    en: {
      message: "We use our own and third-party cookies to improve our services and show you advertising related to your preferences by analyzing your browsing habits.",
      privacy: "View Privacy Policy",
      configure: "Configure",
      accept: "Accept all",
    },
    es: {
      message: "Utilizamos cookies propias y de terceros para mejorar nuestros servicios y mostrarle publicidad relacionada con sus preferencias mediante el análisis de sus hábitos de navegación.",
      privacy: "Ver Política de Privacidad",
      configure: "Configurar",
      accept: "Aceptar todas",
    },
  };

  const t = content[language];

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="fixed bottom-0 left-0 w-full bg-[#1a1a1a] text-white p-6 z-[60] border-t border-[#AC162C] shadow-2xl"
          data-testid="banner-cookie-consent"
        >
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-sm text-gray-300 flex-1">
              <p>
                {t.message}
                <a 
                  href="/privacy-policy" 
                  className="underline text-[#AC162C] ml-1 hover:text-white transition-colors"
                  data-testid="link-privacy-policy"
                >
                  {t.privacy}
                </a>.
              </p>
            </div>
            <div className="flex gap-3 shrink-0">
              <button 
                onClick={declineCookies}
                className="px-4 py-2 text-sm border border-white/20 hover:bg-white/10 transition-colors"
                data-testid="button-cookie-configure"
              >
                {t.configure}
              </button>
              <button 
                onClick={acceptCookies}
                className="px-6 py-2 text-sm bg-[#AC162C] text-white font-medium hover:bg-[#841A1A] transition-colors"
                data-testid="button-cookie-accept"
              >
                {t.accept}
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
