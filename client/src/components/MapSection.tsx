import { motion } from "framer-motion";
import { MapPin, Phone, Mail, ExternalLink, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import type { SiteContent } from "@shared/schema";

interface MapSectionProps {
  language: "es" | "en";
}

export default function MapSection({ language }: MapSectionProps) {
  const { data: siteContent, isLoading, error } = useQuery<SiteContent>({
    queryKey: ["/api/site-content"],
  });

  const content = {
    en: {
      title: siteContent?.locationTitle || "New office address",
      building: "Torre SOMA Chapultepec Floor 18",
      street: "Campos El\u00edseos 204, Polanco",
      access: "Access via Arqu\u00edmedes No. 10",
      city: "C.P. 11560, Mexico City",
      phone: siteContent?.phone || "+52 55 5258 1000",
      email: siteContent?.email || "info@vonwobeser.com",
      directions: "Get Directions",
      viewMap: "View larger map",
      errorMessage: "Failed to load location information",
    },
    es: {
      title: "Direcci\u00f3n de nuevas oficinas",
      building: "Torre SOMA Chapultepec Piso 18",
      street: "Campos El\u00edseos 204, Polanco",
      access: "Acceso por Arqu\u00edmedes N.\u00b0 10",
      city: "C.P. 11560, Ciudad de M\u00e9xico",
      phone: siteContent?.phone || "+52 55 5258 1000",
      email: siteContent?.email || "info@vonwobeser.com",
      directions: "Obtener Direcciones",
      viewMap: "Ver mapa m\u00e1s grande",
      errorMessage: "Error al cargar informaci\u00f3n de ubicaci\u00f3n",
    },
  };

  const t = content[language];

  const googleMapsUrl = "https://www.google.com/maps/dir//Von+Wobeser+y+Sierra,+S.C.+Campos+El%C3%ADseos+204+Polanco,+Miguel+Hidalgo+11560+Ciudad+de+M%C3%A9xico,+CDMX/@19.427554,-99.1927585,16z";
  const embedUrl = "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3762.6792799936887!2d-99.19494!3d19.427554!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x85d200c4e25d79b5%3A0x73edbb0d14f88dde!2sVon%20Wobeser%20y%20Sierra%2C%20S.C.!5e0!3m2!1sen!2smx!4v1700000000000!5m2!1sen!2smx";

  if (error) {
    return (
      <section id="location" className="py-20 lg:py-28 bg-gray-50 dark:bg-gray-800" data-testid="section-location">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 text-center">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400" data-testid="text-location-error">{t.errorMessage}</p>
        </div>
      </section>
    );
  }

  if (isLoading) {
    return (
      <section id="location" className="py-20 lg:py-28 bg-gray-50 dark:bg-gray-800" data-testid="section-location">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <Skeleton className="h-10 w-64 mx-auto mb-12" data-testid="skeleton-location-title" />
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12">
            <Skeleton className="lg:col-span-3 aspect-[16/10] lg:min-h-[400px]" />
            <div className="lg:col-span-2">
              <Skeleton className="h-80 w-full" />
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      id="location"
      className="py-20 lg:py-28 bg-gray-50 dark:bg-gray-800"
      data-testid="section-location"
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-3xl md:text-4xl font-heading font-light text-gray-800 dark:text-white tracking-wide text-center mb-12"
          data-testid="text-location-title"
        >
          {t.title}
        </motion.h2>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-3 aspect-[16/10] lg:aspect-auto lg:min-h-[400px] rounded-none overflow-hidden shadow-lg"
          >
            <iframe
              src={embedUrl}
              width="100%"
              height="100%"
              style={{ border: 0, minHeight: "400px" }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Von Wobeser y Sierra Location"
              data-testid="iframe-map"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="lg:col-span-2 flex flex-col justify-center"
          >
            <div className="bg-white dark:bg-gray-900 p-8 lg:p-10 shadow-sm" data-testid="card-contact-info">
              <div className="flex items-start gap-4 mb-8">
                <MapPin className="w-6 h-6 text-primary flex-shrink-0 mt-1" data-testid="icon-location" />
                <div data-testid="text-address">
                  <p className="font-medium text-gray-800 dark:text-white mb-1">{t.building}</p>
                  <p className="text-gray-600 dark:text-gray-300">{t.street}</p>
                  <p className="text-gray-600 dark:text-gray-300">{t.access}</p>
                  <p className="text-gray-600 dark:text-gray-300">{t.city}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 mb-6">
                <Phone className="w-5 h-5 text-primary flex-shrink-0" data-testid="icon-phone" />
                <a
                  href={`tel:${t.phone.replace(/\s/g, "")}`}
                  className="text-gray-600 dark:text-gray-300 hover:text-primary transition-colors"
                  data-testid="link-phone"
                >
                  {t.phone}
                </a>
              </div>

              <div className="flex items-center gap-4 mb-10">
                <Mail className="w-5 h-5 text-primary flex-shrink-0" data-testid="icon-email" />
                <a
                  href={`mailto:${t.email}`}
                  className="text-gray-600 dark:text-gray-300 hover:text-primary transition-colors"
                  data-testid="link-email"
                >
                  {t.email}
                </a>
              </div>

              <div className="flex flex-col gap-3">
                <Button
                  asChild
                  className="w-full rounded-none bg-primary hover:bg-primary/90 text-white"
                  data-testid="button-directions"
                >
                  <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer">
                    <MapPin className="w-4 h-4 mr-2" />
                    {t.directions}
                  </a>
                </Button>

                <Button
                  asChild
                  variant="outline"
                  className="w-full rounded-none border-gray-300 dark:border-gray-600"
                  data-testid="button-view-map"
                >
                  <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    {t.viewMap}
                  </a>
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
