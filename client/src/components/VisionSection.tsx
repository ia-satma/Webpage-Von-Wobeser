import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";
import type { SiteContent } from "@shared/schema";

interface VisionSectionProps {
  language: "es" | "en";
}

export default function VisionSection({ language }: VisionSectionProps) {
  const { data: siteContent, isLoading, error } = useQuery<SiteContent>({
    queryKey: ["/api/site-content"],
  });

  const content = {
    en: {
      title: siteContent?.visionTitle || "A vision of the future, collaboration, and excellence",
      text: "Von Wobeser y Sierra has completed the transition to its new offices in the dynamic Campos El\u00edseos area in Polanco. This relocation marks a stage of growth, evolution, and consolidation, and represents a key investment in the firm's future. The new facilities are designed to maximize collaboration across all areas for the benefit of clients, ensuring the continued delivery of high-quality and integrated services, reaffirming the firm's commitment and philosophy of being where clients need us.",
      subtitle: "At the center of business and closer to our clients",
      subtext: "Our new offices are located in Mexico's most dynamic business hub and one of the most important in Latin America. Strategically positioned in the vibrant Polanco district, just steps away from the iconic Paseo de la Reforma, we ensure the proximity our clients need for agile and personalized support.",
      errorMessage: "Failed to load content",
    },
    es: {
      title: "Una visi\u00f3n de futuro, colaboraci\u00f3n y excelencia",
      text: "Von Wobeser y Sierra ha completado la transici\u00f3n a sus nuevas oficinas en la din\u00e1mica zona de Campos El\u00edseos en Polanco. Esta reubicaci\u00f3n marca una etapa de crecimiento, evoluci\u00f3n y consolidaci\u00f3n, y representa una inversi\u00f3n clave en el futuro de la firma. Las nuevas instalaciones est\u00e1n dise\u00f1adas para maximizar la colaboraci\u00f3n en todas las \u00e1reas en beneficio de los clientes, asegurando la entrega continua de servicios de alta calidad e integrados, reafirmando el compromiso y la filosof\u00eda de la firma de estar donde los clientes nos necesitan.",
      subtitle: "En el centro de los negocios y m\u00e1s cerca de nuestros clientes",
      subtext: "Nuestras nuevas oficinas est\u00e1n ubicadas en el hub de negocios m\u00e1s din\u00e1mico de M\u00e9xico y uno de los m\u00e1s importantes de Am\u00e9rica Latina. Estrat\u00e9gicamente posicionadas en el vibrante distrito de Polanco, a pasos del ic\u00f3nico Paseo de la Reforma, aseguramos la proximidad que nuestros clientes necesitan para un apoyo \u00e1gil y personalizado.",
      errorMessage: "Error al cargar contenido",
    },
  };

  const t = content[language];

  if (error) {
    return (
      <section id="vision" className="py-20 lg:py-32 bg-white dark:bg-gray-900" data-testid="section-vision">
        <div className="max-w-4xl mx-auto px-6 lg:px-12 text-center">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400" data-testid="text-vision-error">{t.errorMessage}</p>
        </div>
      </section>
    );
  }

  if (isLoading) {
    return (
      <section id="vision" className="py-20 lg:py-32 bg-white dark:bg-gray-900" data-testid="section-vision">
        <div className="max-w-4xl mx-auto px-6 lg:px-12 text-center">
          <Skeleton className="h-12 w-3/4 mx-auto mb-10" data-testid="skeleton-vision-title" />
          <Skeleton className="h-6 w-full mb-3" />
          <Skeleton className="h-6 w-full mb-3" />
          <Skeleton className="h-6 w-2/3 mx-auto mb-16" />
          <Skeleton className="h-8 w-1/2 mx-auto mb-8" />
          <Skeleton className="h-6 w-full mb-3" />
          <Skeleton className="h-6 w-4/5 mx-auto" />
        </div>
      </section>
    );
  }

  return (
    <section
      id="vision"
      className="py-20 lg:py-32 bg-white dark:bg-gray-900"
      data-testid="section-vision"
    >
      <div className="max-w-4xl mx-auto px-6 lg:px-12 text-center">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-3xl md:text-4xl lg:text-5xl font-heading font-light text-gray-800 dark:text-white leading-tight mb-10"
          data-testid="text-vision-title"
        >
          {t.title}
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-lg md:text-xl font-serif text-gray-600 dark:text-gray-300 leading-relaxed mb-16"
          data-testid="text-vision-description"
        >
          {t.text}
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="w-24 h-px bg-primary mx-auto mb-16"
          data-testid="divider-vision"
        />

        <motion.h3
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="text-2xl md:text-3xl font-heading font-light text-gray-800 dark:text-white mb-8"
          data-testid="text-vision-subtitle"
        >
          {t.subtitle}
        </motion.h3>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="text-lg font-serif text-gray-600 dark:text-gray-300 leading-relaxed"
          data-testid="text-vision-subtext"
        >
          {t.subtext}
        </motion.p>
      </div>
    </section>
  );
}
