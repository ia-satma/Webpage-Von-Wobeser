import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Switch } from '@/components/ui/switch';
import { X, Shield, BarChart3, Settings2, Megaphone } from 'lucide-react';

interface CookieBannerProps {
  language: "es" | "en";
}

interface CookiePreferences {
  essential: boolean;
  analytics: boolean;
  functionality: boolean;
  marketing: boolean;
}

const STORAGE_KEY = 'vwb_cookie_preferences';

export default function CookieBanner({ language }: CookieBannerProps) {
  const [visible, setVisible] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    essential: true,
    analytics: false,
    functionality: false,
    marketing: false,
  });

  useEffect(() => {
    const savedPreferences = localStorage.getItem(STORAGE_KEY);
    if (!savedPreferences) {
      const timer = setTimeout(() => setVisible(true), 2000);
      return () => clearTimeout(timer);
    } else {
      try {
        const parsed = JSON.parse(savedPreferences);
        setPreferences({ ...parsed, essential: true });
      } catch {
        setVisible(true);
      }
    }
  }, []);

  const savePreferences = (prefs: CookiePreferences) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    setVisible(false);
    setShowPreferences(false);
  };

  const acceptAll = () => {
    const allAccepted: CookiePreferences = {
      essential: true,
      analytics: true,
      functionality: true,
      marketing: true,
    };
    savePreferences(allAccepted);
  };

  const saveCustomPreferences = () => {
    savePreferences(preferences);
  };

  const openPreferences = () => {
    setShowPreferences(true);
  };

  const closePreferences = () => {
    setShowPreferences(false);
  };

  const togglePreference = (key: keyof CookiePreferences) => {
    if (key === 'essential') return;
    setPreferences(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const content = {
    en: {
      message: "We use our own and third-party cookies to improve our services and show you advertising related to your preferences by analyzing your browsing habits.",
      privacy: "View Privacy Policy",
      configure: "Configure",
      accept: "Accept all",
      preferencesTitle: "Cookie Preferences",
      preferencesDescription: "Manage your cookie preferences below. You can enable or disable different types of cookies. Essential cookies are always active as they are necessary for the website to function properly.",
      savePreferences: "Save Preferences",
      acceptAllButton: "Accept All",
      categories: {
        essential: {
          title: "Essential Cookies",
          description: "These cookies are strictly necessary for the website to function properly. They enable basic functions like page navigation, secure access, and session management. The website cannot function properly without these cookies.",
          alwaysOn: "Always active",
        },
        analytics: {
          title: "Analytics Cookies",
          description: "These cookies help us understand how visitors interact with our website by collecting and reporting information anonymously. They help us measure traffic, identify popular pages, and improve user experience.",
        },
        functionality: {
          title: "Functionality Cookies",
          description: "These cookies enable enhanced functionality and personalization, such as remembering your language preferences, region settings, and customized layouts. Without these cookies, some features may not be available.",
        },
        marketing: {
          title: "Marketing Cookies",
          description: "These cookies are used to deliver advertisements more relevant to you and your interests. They may be used to limit the number of times you see an advertisement and help measure the effectiveness of advertising campaigns.",
        },
      },
    },
    es: {
      message: "Utilizamos cookies propias y de terceros para mejorar nuestros servicios y mostrarle publicidad relacionada con sus preferencias mediante el análisis de sus hábitos de navegación.",
      privacy: "Ver Política de Privacidad",
      configure: "Configurar",
      accept: "Aceptar todas",
      preferencesTitle: "Preferencias de Cookies",
      preferencesDescription: "Gestione sus preferencias de cookies a continuación. Puede habilitar o deshabilitar diferentes tipos de cookies. Las cookies esenciales siempre están activas ya que son necesarias para el correcto funcionamiento del sitio web.",
      savePreferences: "Guardar Preferencias",
      acceptAllButton: "Aceptar Todas",
      categories: {
        essential: {
          title: "Cookies Esenciales",
          description: "Estas cookies son estrictamente necesarias para el funcionamiento del sitio web. Permiten funciones básicas como la navegación de páginas, acceso seguro y gestión de sesiones. El sitio web no puede funcionar correctamente sin estas cookies.",
          alwaysOn: "Siempre activas",
        },
        analytics: {
          title: "Cookies de Análisis",
          description: "Estas cookies nos ayudan a entender cómo los visitantes interactúan con nuestro sitio web recopilando información de forma anónima. Nos ayudan a medir el tráfico, identificar páginas populares y mejorar la experiencia del usuario.",
        },
        functionality: {
          title: "Cookies de Funcionalidad",
          description: "Estas cookies permiten funcionalidades mejoradas y personalización, como recordar sus preferencias de idioma, configuración regional y diseños personalizados. Sin estas cookies, algunas funciones pueden no estar disponibles.",
        },
        marketing: {
          title: "Cookies de Marketing",
          description: "Estas cookies se utilizan para mostrar anuncios más relevantes para usted y sus intereses. Pueden usarse para limitar el número de veces que ve un anuncio y ayudar a medir la efectividad de las campañas publicitarias.",
        },
      },
    },
  };

  const t = content[language];

  const categoryConfig = [
    { key: 'essential' as const, icon: Shield, disabled: true },
    { key: 'analytics' as const, icon: BarChart3, disabled: false },
    { key: 'functionality' as const, icon: Settings2, disabled: false },
    { key: 'marketing' as const, icon: Megaphone, disabled: false },
  ];

  return (
    <AnimatePresence>
      {visible && !showPreferences && (
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
                onClick={openPreferences}
                className="px-4 py-2 text-sm border border-white/20 hover:bg-white/10 transition-colors"
                data-testid="button-cookie-configure"
              >
                {t.configure}
              </button>
              <button 
                onClick={acceptAll}
                className="px-6 py-2 text-sm bg-[#AC162C] text-white font-medium hover:bg-[#841A1A] transition-colors"
                data-testid="button-cookie-accept"
              >
                {t.accept}
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {showPreferences && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          data-testid="modal-cookie-preferences-overlay"
          onClick={closePreferences}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="bg-[#1a1a1a] text-white w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-[#AC162C]/30"
            data-testid="modal-cookie-preferences"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <h2 className="text-xl font-semibold" data-testid="text-preferences-title">
                {t.preferencesTitle}
              </h2>
              <button
                onClick={closePreferences}
                className="p-2 hover:bg-white/10 transition-colors"
                data-testid="button-close-preferences"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <p className="text-sm text-gray-400 mb-6" data-testid="text-preferences-description">
                {t.preferencesDescription}
              </p>

              <div className="space-y-4">
                {categoryConfig.map(({ key, icon: Icon, disabled }) => {
                  const category = t.categories[key];
                  return (
                    <div
                      key={key}
                      className="border border-white/10 p-4 hover:border-white/20 transition-colors"
                      data-testid={`card-cookie-${key}`}
                    >
                      <div className="flex items-start gap-4">
                        <div className="shrink-0 w-10 h-10 flex items-center justify-center bg-[#AC162C]/20 text-[#AC162C]">
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-4 mb-2">
                            <h3 className="font-medium text-white" data-testid={`text-cookie-title-${key}`}>
                              {category.title}
                            </h3>
                            <div className="shrink-0 flex items-center gap-2">
                              {disabled ? (
                                <span 
                                  className="text-xs text-[#AC162C] font-medium"
                                  data-testid={`text-cookie-always-on-${key}`}
                                >
                                  {(category as typeof t.categories.essential).alwaysOn}
                                </span>
                              ) : (
                                <Switch
                                  checked={preferences[key]}
                                  onCheckedChange={() => togglePreference(key)}
                                  disabled={disabled}
                                  data-testid={`switch-cookie-${key}`}
                                  className="data-[state=checked]:bg-[#AC162C]"
                                />
                              )}
                            </div>
                          </div>
                          <p 
                            className="text-sm text-gray-400 leading-relaxed"
                            data-testid={`text-cookie-description-${key}`}
                          >
                            {category.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 p-6 border-t border-white/10">
              <button
                onClick={saveCustomPreferences}
                className="flex-1 px-6 py-3 text-sm border border-white/20 hover:bg-white/10 transition-colors font-medium"
                data-testid="button-save-preferences"
              >
                {t.savePreferences}
              </button>
              <button
                onClick={acceptAll}
                className="flex-1 px-6 py-3 text-sm bg-[#AC162C] text-white font-medium hover:bg-[#841A1A] transition-colors"
                data-testid="button-accept-all-preferences"
              >
                {t.acceptAllButton}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
