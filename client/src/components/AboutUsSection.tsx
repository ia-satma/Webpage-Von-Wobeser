import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";

const values = [
  { en: "Integrity", es: "Integridad" },
  { en: "Excellence", es: "Excelencia" },
  { en: "Commitment", es: "Compromiso" },
  { en: "Agility", es: "Agilidad" },
  { en: "Diversity", es: "Diversidad" },
];

export default function AboutUsSection() {
  const { language } = useLanguage();

  const content = {
    en: {
      sectionTitle: "ABOUT US",
      visionTitle: "Vision",
      visionText: "To be the leading law firm in Mexico, recognized for delivering exceptional legal services, fostering talent, and making a positive impact in our community.",
      missionTitle: "Mission",
      missionText: "To provide our clients with the highest quality legal counsel, combining deep expertise with innovative solutions and an unwavering commitment to their success.",
      valuesTitle: "Values",
    },
    es: {
      sectionTitle: "ACERCA DE NOSOTROS",
      visionTitle: "Visión",
      visionText: "Ser la firma de abogados líder en México, reconocida por brindar servicios legales excepcionales, fomentar el talento y generar un impacto positivo en nuestra comunidad.",
      missionTitle: "Misión",
      missionText: "Proporcionar a nuestros clientes asesoría legal de la más alta calidad, combinando profunda experiencia con soluciones innovadoras y un compromiso inquebrantable con su éxito.",
      valuesTitle: "Valores",
    },
  };

  const t = content[language];

  return (
    <section
      id="about-us"
      className="py-20 lg:py-32 bg-white dark:bg-gray-900"
      data-testid="section-about-us"
    >
      <div className="max-w-6xl mx-auto px-6 lg:px-12">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-sm md:text-base font-heading uppercase tracking-widest text-gray-800 dark:text-white text-center mb-16"
          data-testid="text-about-us-title"
        >
          {t.sectionTitle}
        </motion.h2>

        <div className="grid md:grid-cols-2 gap-12 lg:gap-16 mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            data-testid="subsection-vision"
          >
            <h3
              className="text-2xl md:text-3xl font-heading font-light text-gray-800 dark:text-white mb-6"
              data-testid="text-vision-title"
            >
              {t.visionTitle}
            </h3>
            <p
              className="text-lg font-serif text-gray-600 dark:text-gray-300 leading-relaxed"
              data-testid="text-vision-content"
            >
              {t.visionText}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            data-testid="subsection-mission"
          >
            <h3
              className="text-2xl md:text-3xl font-heading font-light text-gray-800 dark:text-white mb-6"
              data-testid="text-mission-title"
            >
              {t.missionTitle}
            </h3>
            <p
              className="text-lg font-serif text-gray-600 dark:text-gray-300 leading-relaxed"
              data-testid="text-mission-content"
            >
              {t.missionText}
            </p>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="w-24 h-px bg-primary mx-auto mb-12"
          data-testid="divider-about-us"
        />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center"
          data-testid="subsection-values"
        >
          <h3
            className="text-2xl md:text-3xl font-heading font-light text-gray-800 dark:text-white mb-10"
            data-testid="text-values-title"
          >
            {t.valuesTitle}
          </h3>

          <div
            className="flex flex-wrap justify-center gap-4 md:gap-6 lg:gap-8"
            data-testid="values-grid"
          >
            {values.map((value, index) => (
              <motion.div
                key={value.en}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.5 + index * 0.1 }}
                className="px-6 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                data-testid={`value-item-${index}`}
              >
                <span
                  className="text-base md:text-lg font-heading text-gray-700 dark:text-gray-200"
                  data-testid={`text-value-${index}`}
                >
                  {language === "en" ? value.en : value.es}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
