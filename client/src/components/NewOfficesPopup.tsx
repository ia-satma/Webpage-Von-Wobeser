import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Button } from "@/components/ui/button";
import { MapPin, ChevronDown } from "lucide-react";
import { motion } from "framer-motion";

import collage01 from "@assets/collage_01.jpg";
import collage02 from "@assets/collage_02.jpg";
import collage03 from "@assets/collage_03.jpg";
import collage04 from "@assets/collage_04.jpg";
import collage05 from "@assets/collage_05.jpg";
import collage06 from "@assets/collage_06.jpg";
import collage07 from "@assets/collage_07.jpg";
import collage08 from "@assets/collage_08.jpg";
import collage09 from "@assets/collage_09.jpg";
import heroOffice from "@assets/hero_office.jpg";

interface NewOfficesPopupProps {
  language: "es" | "en";
}

const STORAGE_KEY = "newOfficesPopupShown";

const content = {
  en: {
    heroTitle: "WE GO WHERE CLIENTS NEED US",
    heroSubtitle: "New offices of Von Wobeser y Sierra",
    scroll: "scroll",
    visionTitle: "A vision of the future, collaboration, and excellence",
    visionText: "Von Wobeser y Sierra has completed the transition to its new offices in the dynamic Campos Elíseos area in Polanco. This relocation marks a stage of growth, evolution, and consolidation, and represents a key investment in the firm's future. The new facilities are designed to maximize collaboration across all areas for the benefit of clients, ensuring the continued delivery of high-quality and integrated services, reaffirming the firm's commitment and philosophy of being where clients need them.",
    centerTitle: "At the center of business and closer to our clients",
    centerText: "Our new offices are located in Mexico's most dynamic business hub and one of the most important in Latin America. Strategically positioned in the vibrant Polanco district, just steps away from the iconic Paseo de la Reforma, we ensure the proximity our clients need for agile and personalized support.",
    collabTitle: "Collaboration, technology and well-being",
    collabText: "Designed by Gensler, one of the most influential architecture and design firms worldwide, the new offices cover more than 5,300 square meters distributed over six levels.",
    collabText2: "The design is conceived to maximize collaboration among our 18 legal practice groups and 7 industry groups.",
    workplacesNum: "300+",
    workplacesLabel: "workplaces",
    capacityText: "In its initial stage, the facilities offer capacity for more than 300 workstations, 16 meeting rooms, flexible spaces for social and academic activities with capacity for 250 people, and a panoramic terrace with privileged views of iconic Mexico City landmarks such as Chapultepec Forest and Campo Militar Marte.",
    quoteText: "The relocation of our offices responds to two inseparable goals: first, being closer to our clients; and second, offering our team a space designed to foster collaboration and productivity that translates into excellent service.",
    quoteAuthor: "Fernando Carreño",
    quoteRole: "Partner and member of the Executive Committee",
    addressTitle: "New office address",
    addressLine1: "Torre SOMA Chapultepec Piso 18. Campos Elíseos 204, Polanco",
    addressLine2: "Access via Arquímedes N.° 10",
    addressLine3: "C.P. 11560, Ciudad de México.",
    close: "Close",
  },
  es: {
    heroTitle: "VAMOS A DONDE NOS NECESITAN NUESTROS CLIENTES",
    heroSubtitle: "Nuevas oficinas de Von Wobeser y Sierra",
    scroll: "scroll",
    visionTitle: "Una visión del futuro, colaboración y excelencia",
    visionText: "Von Wobeser y Sierra ha completado la transición a sus nuevas oficinas en la dinámica zona de Campos Elíseos en Polanco. Esta reubicación marca una etapa de crecimiento, evolución y consolidación, y representa una inversión clave en el futuro de la firma. Las nuevas instalaciones están diseñadas para maximizar la colaboración en todas las áreas en beneficio de los clientes, asegurando la entrega continua de servicios de alta calidad e integrados, reafirmando el compromiso y filosofía de la firma de estar donde los clientes los necesitan.",
    centerTitle: "En el centro de los negocios y más cerca de nuestros clientes",
    centerText: "Nuestras nuevas oficinas se encuentran en el centro de negocios más dinámico de México y uno de los más importantes de América Latina. Estratégicamente ubicadas en el vibrante distrito de Polanco, a solo pasos de la icónica Avenida Paseo de la Reforma, aseguramos la cercanía que nuestros clientes necesitan para un apoyo ágil y personalizado.",
    collabTitle: "Colaboración, tecnología y bienestar",
    collabText: "Diseñadas por Gensler, una de las firmas de arquitectura y diseño más influyentes del mundo, las nuevas oficinas abarcan más de 5,300 metros cuadrados distribuidos en seis niveles.",
    collabText2: "El diseño está concebido para maximizar la colaboración entre nuestros 18 grupos de práctica legal y 7 grupos industriales.",
    workplacesNum: "300+",
    workplacesLabel: "estaciones de trabajo",
    capacityText: "En su etapa inicial, las instalaciones ofrecen capacidad para más de 300 estaciones de trabajo, 16 salas de juntas, espacios flexibles para actividades sociales y académicas con capacidad para 250 personas, y una terraza panorámica con vistas privilegiadas de lugares emblemáticos de la Ciudad de México como el Bosque de Chapultepec y el Campo Militar Marte.",
    quoteText: "La reubicación de nuestras oficinas responde a dos objetivos inseparables: primero, estar más cerca de nuestros clientes; y segundo, ofrecer a nuestro equipo un espacio diseñado para fomentar la colaboración y productividad que se traduce en un servicio excelente.",
    quoteAuthor: "Fernando Carreño",
    quoteRole: "Socio y miembro del Comité Ejecutivo",
    addressTitle: "Nueva dirección de oficinas",
    addressLine1: "Torre SOMA Chapultepec Piso 18. Campos Elíseos 204, Polanco",
    addressLine2: "Acceso por Arquímedes N.° 10",
    addressLine3: "C.P. 11560, Ciudad de México.",
    close: "Cerrar",
  },
};

const collageImages = [
  { src: collage01, alt: "Office interior 1" },
  { src: collage02, alt: "Office interior 2" },
  { src: collage03, alt: "Office interior 3" },
  { src: collage04, alt: "Office interior 4" },
  { src: collage05, alt: "Office interior 5" },
  { src: collage06, alt: "Office interior 6" },
  { src: collage07, alt: "Office interior 7" },
  { src: collage08, alt: "Office interior 8" },
  { src: collage09, alt: "Office interior 9" },
];

const GOOGLE_MAPS_URL = "https://www.google.com/maps/dir//Von+Wobeser+y+Sierra,+S.C.+Campos+El%C3%ADseos+204+Polanco,+Miguel+Hidalgo+11560+Ciudad+de+M%C3%A9xico,+CDMX/@19.427554,-99.1927585,16z";

export default function NewOfficesPopup({ language }: NewOfficesPopupProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    console.log('[NewOfficesPopup] Component mounted');
    const hasShown = localStorage.getItem(STORAGE_KEY);
    console.log('[NewOfficesPopup] localStorage check:', { hasShown, STORAGE_KEY });
    
    if (!hasShown) {
      console.log('[NewOfficesPopup] Setting timer for 1500ms');
      const timer = setTimeout(() => {
        console.log('[NewOfficesPopup] Timer fired, opening popup');
        setIsOpen(true);
      }, 1500);
      return () => {
        console.log('[NewOfficesPopup] Cleanup - clearing timer');
        clearTimeout(timer);
      };
    } else {
      console.log('[NewOfficesPopup] Already shown before, not displaying');
    }
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    localStorage.setItem(STORAGE_KEY, "true");
  };

  const t = content[language];

  const scrollToContent = () => {
    const contentArea = document.getElementById("popup-content");
    if (contentArea) {
      contentArea.scrollTo({ top: 300, behavior: "smooth" });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent
        className="max-w-4xl w-[95vw] max-h-[95vh] p-0 gap-0 rounded-none overflow-hidden flex flex-col"
        data-testid="dialog-new-offices"
      >
        <VisuallyHidden>
          <DialogTitle>{t.heroTitle}</DialogTitle>
          <DialogDescription>{t.heroSubtitle}</DialogDescription>
        </VisuallyHidden>
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between flex-shrink-0">
          <img
            src="https://vonwobeser.com/images/vonwobeser_2025.png"
            alt="Von Wobeser"
            className="h-6 md:h-8"
            data-testid="img-popup-logo"
          />
          <span className="text-xs text-gray-500 uppercase tracking-wider">
            {language === "es" ? "ESP" : "ENG"}
          </span>
        </div>

        <div
          id="popup-content"
          className="flex-1 overflow-y-auto"
          data-testid="popup-content-area"
        >
          <div
            className="relative min-h-[60vh] flex items-center justify-center"
            style={{
              backgroundImage: `url(${heroOffice})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
            data-testid="popup-hero-section"
          >
            <div className="absolute inset-0 bg-black/40" />
            <div className="relative z-10 text-center px-6 py-12">
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-3xl md:text-4xl lg:text-5xl font-heading font-light text-white leading-tight mb-4"
                data-testid="text-popup-hero-title"
              >
                {t.heroTitle}
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="text-lg md:text-xl text-white/90"
                data-testid="text-popup-hero-subtitle"
              >
                {t.heroSubtitle}
              </motion.p>
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.8 }}
                onClick={scrollToContent}
                className="mt-8 flex flex-col items-center gap-1 text-white/80 hover:text-white transition-colors mx-auto cursor-pointer"
                data-testid="button-popup-scroll"
              >
                <span className="text-xs tracking-widest uppercase">{t.scroll}</span>
                <ChevronDown className="w-5 h-5 animate-bounce" />
              </motion.button>
            </div>
          </div>

          <div className="bg-white px-6 md:px-12 py-12 space-y-12">
            <section className="max-w-3xl mx-auto text-center" data-testid="section-vision">
              <h3 className="text-2xl md:text-3xl font-heading font-light text-gray-800 mb-6">
                {t.visionTitle}
              </h3>
              <p className="text-gray-600 leading-relaxed font-serif">
                {t.visionText}
              </p>
            </section>

            <section className="max-w-3xl mx-auto text-center" data-testid="section-center">
              <h3 className="text-2xl md:text-3xl font-heading font-light text-gray-800 mb-6">
                {t.centerTitle}
              </h3>
              <p className="text-gray-600 leading-relaxed font-serif">
                {t.centerText}
              </p>
            </section>

            <section className="max-w-3xl mx-auto text-center" data-testid="section-collaboration">
              <h3 className="text-2xl md:text-3xl font-heading font-light text-gray-800 mb-6">
                {t.collabTitle}
              </h3>
              <p className="text-gray-600 leading-relaxed font-serif mb-4">
                {t.collabText}
              </p>
              <p className="text-gray-600 leading-relaxed font-serif mb-8">
                {t.collabText2}
              </p>
              <div className="flex flex-col items-center mb-8">
                <span className="text-5xl md:text-6xl font-heading font-light text-[#AC162C]">
                  {t.workplacesNum}
                </span>
                <span className="text-sm text-gray-500 uppercase tracking-wider mt-2">
                  {t.workplacesLabel}
                </span>
              </div>
              <p className="text-gray-600 leading-relaxed font-serif">
                {t.capacityText}
              </p>
            </section>

            <section className="py-8" data-testid="section-collage">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3">
                {collageImages.map((img, index) => (
                  <div
                    key={index}
                    className={`overflow-hidden ${index === 0 || index === 5 ? "row-span-2" : ""}`}
                    data-testid={`img-collage-${index}`}
                  >
                    <img
                      src={img.src}
                      alt={img.alt}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                  </div>
                ))}
              </div>
            </section>

            <section className="max-w-3xl mx-auto text-center py-8 border-t border-b border-gray-200" data-testid="section-quote">
              <div className="text-4xl text-[#AC162C] opacity-30 mb-4">"</div>
              <blockquote className="text-xl md:text-2xl font-serif italic text-gray-700 leading-relaxed mb-6">
                "{t.quoteText}"
              </blockquote>
              <div className="text-sm text-gray-500">
                <p className="font-medium text-gray-700">– {t.quoteAuthor}</p>
                <p>{t.quoteRole}</p>
              </div>
            </section>

            <section className="max-w-3xl mx-auto text-center" data-testid="section-address">
              <h3 className="text-2xl md:text-3xl font-heading font-light text-gray-800 mb-6">
                {t.addressTitle}
              </h3>
              <a
                href={GOOGLE_MAPS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex flex-col items-center gap-2 text-gray-600 hover:text-[#AC162C] transition-colors group"
                data-testid="link-popup-address"
              >
                <MapPin className="w-8 h-8 text-[#AC162C] group-hover:scale-110 transition-transform" />
                <div className="leading-relaxed">
                  <p>{t.addressLine1}</p>
                  <p>{t.addressLine2}</p>
                  <p>{t.addressLine3}</p>
                </div>
              </a>
            </section>
          </div>
        </div>

        <div className="bg-[#AC162C] p-4 flex-shrink-0">
          <Button
            onClick={handleClose}
            variant="ghost"
            className="w-full text-white hover:text-white hover:bg-white/10 text-base font-medium tracking-wider uppercase"
            data-testid="button-close-popup"
          >
            {t.close}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
