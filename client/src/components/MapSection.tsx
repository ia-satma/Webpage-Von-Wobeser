import { motion } from "framer-motion";
import { MapPin, Phone, Mail, ExternalLink, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import type { SiteContent } from "@shared/schema";

type SupportedLanguage = "en" | "es";

interface MapSectionProps {
  language: string;
}

export default function MapSection({ language }: MapSectionProps) {
  const { data: siteContent, isLoading, error } = useQuery<SiteContent>({
    queryKey: ["/api/site-content"],
  });

  const content: Record<SupportedLanguage, {
    eyebrow: string;
    title: string;
    subtitle: string;
    building: string;
    street: string;
    access: string;
    city: string;
    addressLabel: string;
    phoneLabel: string;
    phone: string;
    emailLabel: string;
    email: string;
    directions: string;
    viewMap: string;
    officeHours: string;
    errorMessage: string;
    mapTitle: string;
  }> = {
    en: {
      eyebrow: "LOCATION",
      title: siteContent?.locationTitle || "Our Location",
      subtitle: "Visit Us",
      building: "Torre SOMA Chapultepec Floor 18",
      street: "Campos Elíseos 204, Polanco",
      access: "Access via Arquímedes No. 10",
      city: "C.P. 11560, Mexico City",
      addressLabel: "Address",
      phoneLabel: "Phone",
      phone: siteContent?.phone || "+52 55 5258 1000",
      emailLabel: "Email",
      email: siteContent?.email || "info@vonwobeser.com",
      directions: "Get Directions",
      viewMap: "View on Map",
      officeHours: "Office Hours",
      errorMessage: "Failed to load location information",
      mapTitle: "Von Wobeser y Sierra Location",
    },
    es: {
      eyebrow: "UBICACIÓN",
      title: "Nuestra Ubicación",
      subtitle: "Visítenos",
      building: "Torre SOMA Chapultepec Piso 18",
      street: "Campos Elíseos 204, Polanco",
      access: "Acceso por Arquímedes N.° 10",
      city: "C.P. 11560, Ciudad de México",
      addressLabel: "Dirección",
      phoneLabel: "Teléfono",
      phone: siteContent?.phone || "+52 55 5258 1000",
      emailLabel: "Correo electrónico",
      email: siteContent?.email || "info@vonwobeser.com",
      directions: "Obtener Direcciones",
      viewMap: "Ver en el mapa",
      officeHours: "Horario de atención",
      errorMessage: "Error al cargar información de ubicación",
      mapTitle: "Ubicación de Von Wobeser y Sierra",
    },
  };

  const currentLang = (language in content ? language : "en") as SupportedLanguage;
  const t = content[currentLang];

  const googleMapsUrl = "https://www.google.com/maps/dir//Von+Wobeser+y+Sierra,+S.C.+Campos+El%C3%ADseos+204+Polanco,+Miguel+Hidalgo+11560+Ciudad+de+M%C3%A9xico,+CDMX/@19.427554,-99.1927585,16z";
  const embedUrl = "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3762.6792799936887!2d-99.19494!3d19.427554!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x85d200c4e25d79b5%3A0x73edbb0d14f88dde!2sVon%20Wobeser%20y%20Sierra%2C%20S.C.!5e0!3m2!1sen!2smx!4v1700000000000!5m2!1sen!2smx";

  if (error) {
    return (
      <section id="location" className="py-20 lg:py-28 bg-muted" data-testid="section-location">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 text-center">
          <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground" data-testid="text-location-error">{t.errorMessage}</p>
        </div>
      </section>
    );
  }

  if (isLoading) {
    return (
      <section id="location" className="py-20 lg:py-28 bg-muted" data-testid="section-location">
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
      className="py-20 lg:py-28 bg-muted"
      data-testid="section-location"
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-12">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="w-12 h-px bg-primary mb-6 mx-auto" />
          <p
            className="text-primary text-[10px] tracking-[0.25em] uppercase mb-4"
            data-testid="text-location-eyebrow"
          >
            {t.eyebrow}
          </p>
          <h2
            className="font-heading font-light text-2xl md:text-3xl lg:text-4xl text-foreground uppercase tracking-[0.12em] leading-tight"
            data-testid="text-location-title"
          >
            {t.title}
          </h2>
        </motion.div>

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
              title={t.mapTitle}
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
            <div className="bg-background p-8 lg:p-10 shadow-sm" data-testid="card-contact-info">
              <div className="flex items-start gap-4 mb-8">
                <MapPin className="w-6 h-6 text-primary flex-shrink-0 mt-1" data-testid="icon-location" />
                <div data-testid="text-address">
                  <p className="text-sm text-foreground font-medium mb-2">{t.addressLabel}</p>
                  <p className="text-sm text-muted-foreground">{t.building}</p>
                  <p className="text-sm text-muted-foreground">{t.street}</p>
                  <p className="text-sm text-muted-foreground">{t.access}</p>
                  <p className="text-sm text-muted-foreground">{t.city}</p>
                </div>
              </div>

              <div className="flex items-start gap-4 mb-6">
                <Phone className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" data-testid="icon-phone" />
                <div>
                  <p className="text-sm text-foreground font-medium mb-1">{t.phoneLabel}</p>
                  <a
                    href={`tel:${t.phone.replace(/\s/g, "")}`}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                    data-testid="link-phone"
                  >
                    {t.phone}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4 mb-10">
                <Mail className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" data-testid="icon-email" />
                <div>
                  <p className="text-sm text-foreground font-medium mb-1">{t.emailLabel}</p>
                  <a
                    href={`mailto:${t.email}`}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                    data-testid="link-email"
                  >
                    {t.email}
                  </a>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <Button
                  asChild
                  variant="default"
                  className="w-full rounded-none"
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
                  className="w-full rounded-none"
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
