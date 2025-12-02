import { motion } from "framer-motion";
import { Quote, AlertCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import type { SiteContent } from "@shared/schema";

interface QuoteSectionProps {
  language: "es" | "en";
}

export default function QuoteSection({ language }: QuoteSectionProps) {
  const { data: siteContent, isLoading, error } = useQuery<SiteContent>({
    queryKey: ["/api/site-content"],
  });

  const content = {
    en: {
      quote: siteContent?.quoteText || "The relocation of our offices responds to two inseparable goals: first, being closer to our clients; and second, offering our team a space designed to foster collaboration and productivity that translates into excellent service.",
      author: siteContent?.quoteAuthor || "Fernando Carre\u00f1o",
      role: siteContent?.quoteRole || "Partner and member of the Executive Committee",
      errorMessage: "Failed to load quote",
    },
    es: {
      quote: "La reubicaci\u00f3n de nuestras oficinas responde a dos objetivos inseparables: primero, estar m\u00e1s cerca de nuestros clientes; y segundo, ofrecer a nuestro equipo un espacio dise\u00f1ado para fomentar la colaboraci\u00f3n y productividad que se traduce en un excelente servicio.",
      author: "Fernando Carre\u00f1o",
      role: "Socio y miembro del Comit\u00e9 Ejecutivo",
      errorMessage: "Error al cargar cita",
    },
  };

  const t = content[language];

  if (error) {
    return (
      <section id="quote" className="py-20 lg:py-28 bg-gray-100 dark:bg-gray-800" data-testid="section-quote">
        <div className="max-w-4xl mx-auto px-6 lg:px-12 text-center">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400" data-testid="text-quote-error">{t.errorMessage}</p>
        </div>
      </section>
    );
  }

  if (isLoading) {
    return (
      <section id="quote" className="py-20 lg:py-28 bg-gray-100 dark:bg-gray-800" data-testid="section-quote">
        <div className="max-w-4xl mx-auto px-6 lg:px-12 text-center">
          <Skeleton className="w-12 h-12 mx-auto mb-8 rounded-full" data-testid="skeleton-quote-icon" />
          <Skeleton className="h-8 w-full mb-3" />
          <Skeleton className="h-8 w-full mb-3" />
          <Skeleton className="h-8 w-3/4 mx-auto mb-10" />
          <Skeleton className="w-16 h-px mx-auto mb-6" />
          <Skeleton className="h-6 w-40 mx-auto mb-2" />
          <Skeleton className="h-4 w-60 mx-auto" />
        </div>
      </section>
    );
  }

  return (
    <section
      id="quote"
      className="py-20 lg:py-28 bg-gray-100 dark:bg-gray-800"
      data-testid="section-quote"
    >
      <div className="max-w-4xl mx-auto px-6 lg:px-12 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <Quote className="w-12 h-12 text-primary/30 mx-auto mb-8" data-testid="icon-quote" />
          
          <blockquote
            className="text-xl md:text-2xl lg:text-3xl font-heading font-light text-gray-700 dark:text-gray-200 leading-relaxed mb-10"
            data-testid="text-quote"
          >
            "{t.quote}"
          </blockquote>

          <div className="flex flex-col items-center">
            <div className="w-16 h-px bg-primary mb-6" data-testid="divider-quote" />
            <p
              className="text-lg font-medium text-gray-800 dark:text-white"
              data-testid="text-quote-author"
            >
              {t.author}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1" data-testid="text-quote-role">
              {t.role}
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
