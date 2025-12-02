import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";
import type { Stat } from "@shared/schema";

interface StatsSectionProps {
  language: "es" | "en";
}

export default function StatsSection({ language }: StatsSectionProps) {
  const { data: stats, isLoading, error } = useQuery<Stat[]>({
    queryKey: ["/api/stats"],
  });

  const content = {
    en: {
      title: "Collaboration, technology and well-being",
      subtitle: "Designed by Gensler, one of the most influential architecture and design firms worldwide, the new offices cover more than 5,300 square meters distributed over six levels.",
      description: "The design is conceived to maximize collaboration among our 18 legal practice groups and 7 industry groups.",
      capacity: "In its initial stage, the facilities offer capacity for more than 300 workstations, 16 meeting rooms, flexible spaces for social and academic activities with capacity for 250 people, and a panoramic terrace with privileged views of iconic Mexico City landmarks such as Chapultepec Forest and Campo Militar Marte.",
      errorMessage: "Failed to load statistics",
    },
    es: {
      title: "Colaboraci\u00f3n, tecnolog\u00eda y bienestar",
      subtitle: "Dise\u00f1adas por Gensler, una de las firmas de arquitectura y dise\u00f1o m\u00e1s influyentes del mundo, las nuevas oficinas abarcan m\u00e1s de 5,300 metros cuadrados distribuidos en seis niveles.",
      description: "El dise\u00f1o est\u00e1 concebido para maximizar la colaboraci\u00f3n entre nuestros 18 grupos de pr\u00e1ctica legal y 7 grupos industriales.",
      capacity: "En su etapa inicial, las instalaciones ofrecen capacidad para m\u00e1s de 300 estaciones de trabajo, 16 salas de juntas, espacios flexibles para actividades sociales y acad\u00e9micas con capacidad para 250 personas, y una terraza panor\u00e1mica con vistas privilegiadas de lugares emblem\u00e1ticos de la Ciudad de M\u00e9xico como el Bosque de Chapultepec y el Campo Militar Marte.",
      errorMessage: "Error al cargar estad\u00edsticas",
    },
  };

  const t = content[language];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  };

  if (error) {
    return (
      <section id="stats" className="py-20 lg:py-28 bg-white dark:bg-gray-900" data-testid="section-stats">
        <div className="max-w-6xl mx-auto px-6 lg:px-12">
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400" data-testid="text-stats-error">{t.errorMessage}</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      id="stats"
      className="py-20 lg:py-28 bg-white dark:bg-gray-900"
      data-testid="section-stats"
    >
      <div className="max-w-6xl mx-auto px-6 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2
            className="text-3xl md:text-4xl lg:text-5xl font-heading font-light text-gray-800 dark:text-white leading-tight mb-8"
            data-testid="text-stats-title"
          >
            {t.title}
          </h2>
          <p 
            className="text-lg md:text-xl font-serif text-gray-600 dark:text-gray-300 leading-relaxed max-w-3xl mx-auto mb-6"
            data-testid="text-stats-subtitle"
          >
            {t.subtitle}
          </p>
          <p 
            className="text-lg font-serif text-gray-600 dark:text-gray-300 leading-relaxed max-w-3xl mx-auto"
            data-testid="text-stats-description"
          >
            {t.description}
          </p>
        </motion.div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12 mb-16">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="text-center" data-testid={`skeleton-stat-${i}`}>
                <Skeleton className="h-16 w-24 mx-auto mb-3" />
                <Skeleton className="h-4 w-20 mx-auto" />
              </div>
            ))}
          </div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12 mb-16"
          >
            {stats?.map((stat, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                className="text-center"
                data-testid={`stat-item-${index}`}
              >
                <div 
                  className="text-4xl md:text-5xl lg:text-6xl font-heading font-light text-primary mb-3"
                  data-testid={`text-stat-value-${index}`}
                >
                  {stat.value}
                </div>
                <div 
                  className="text-sm md:text-base text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                  data-testid={`text-stat-label-${index}`}
                >
                  {language === "es" ? stat.labelEs : stat.label}
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center text-lg font-serif text-gray-600 dark:text-gray-300 leading-relaxed max-w-4xl mx-auto"
          data-testid="text-stats-capacity"
        >
          {t.capacity}
        </motion.p>
      </div>
    </section>
  );
}
