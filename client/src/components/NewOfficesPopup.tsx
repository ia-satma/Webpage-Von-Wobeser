import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MapPin } from "lucide-react";

interface NewOfficesPopupProps {
  language: "es" | "en";
}

const STORAGE_KEY = "newOfficesPopupShown";

const content = {
  es: {
    title: "En el centro de los negocios y más cerca de nuestros clientes",
    description:
      "Nos complace anunciar la apertura de nuestras nuevas oficinas en Campos Elíseos 204, Polanco. Un espacio diseñado para brindarte la mejor atención y servicio, ubicado estratégicamente en el corazón financiero de la Ciudad de México.",
    address: "Von Wobeser y Sierra, S.C.",
    location: "Campos Elíseos 204, Polanco, CDMX",
    close: "Cerrar",
  },
  en: {
    title: "At the center of business and closer to our clients",
    description:
      "We are pleased to announce the opening of our new offices at Campos Elíseos 204, Polanco. A space designed to provide you with the best attention and service, strategically located in the financial heart of Mexico City.",
    address: "Von Wobeser y Sierra, S.C.",
    location: "Campos Elíseos 204, Polanco, CDMX",
    close: "Close",
  },
};

const GOOGLE_MAPS_EMBED_URL =
  "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3762.6792799936887!2d-99.19494!3d19.427554!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x85d200c4e25d79b5%3A0x73edbb0d14f88dde!2sVon%20Wobeser%20y%20Sierra%2C%20S.C.!5e0!3m2!1sen!2smx!4v1700000000000!5m2!1sen!2smx";

export default function NewOfficesPopup({ language }: NewOfficesPopupProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const hasShown = localStorage.getItem(STORAGE_KEY);
    if (!hasShown) {
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    localStorage.setItem(STORAGE_KEY, "true");
  };

  const t = content[language];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent
        className="max-w-2xl p-0 gap-0 rounded-none sm:rounded-none overflow-hidden"
        data-testid="dialog-new-offices"
      >
        <DialogHeader
          className="bg-[#AC162C] text-white p-6 space-y-0"
          data-testid="dialog-header-new-offices"
        >
          <DialogTitle className="text-xl md:text-2xl font-light leading-tight text-white text-center">
            {t.title}
          </DialogTitle>
        </DialogHeader>

        <div className="bg-white p-6 space-y-4">
          <DialogDescription className="text-[#5E5E5E] text-base leading-relaxed text-center">
            {t.description}
          </DialogDescription>

          <div className="w-full aspect-video">
            <iframe
              src={GOOGLE_MAPS_EMBED_URL}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Von Wobeser y Sierra Office Location"
              data-testid="iframe-google-maps"
            />
          </div>

          <div className="flex items-center justify-center gap-2 text-[#5E5E5E]">
            <MapPin className="h-5 w-5 text-[#AC162C]" />
            <div className="text-center">
              <p className="font-medium text-[#1F2937]">{t.address}</p>
              <p className="text-sm">{t.location}</p>
            </div>
          </div>
        </div>

        <DialogFooter className="bg-white px-6 pb-6 pt-0 sm:justify-center">
          <Button
            onClick={handleClose}
            className="bg-[#AC162C] hover:bg-[#841A1A] text-white px-8 py-4 rounded-none min-h-12"
            data-testid="button-close-popup"
          >
            {t.close}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
