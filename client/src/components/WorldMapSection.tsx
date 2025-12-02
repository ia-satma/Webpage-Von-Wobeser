import { motion } from "framer-motion";

interface WorldMapSectionProps {
  language: "es" | "en";
}

export default function WorldMapSection({ language }: WorldMapSectionProps) {
  const content = {
    en: {
      title: "Global Reach",
      subtitle: "Von Wobeser y Sierra's German Desk provides specialized legal services for German-speaking clients investing in Mexico and Latin America.",
      label: "GERMAN DESK",
      mexicoLabel: "MEXICO CITY",
      germanyLabel: "GERMANY",
    },
    es: {
      title: "Alcance Global",
      subtitle: "El German Desk de Von Wobeser y Sierra proporciona servicios legales especializados para clientes de habla alemana que invierten en México y América Latina.",
      label: "GERMAN DESK",
      mexicoLabel: "CIUDAD DE MÉXICO",
      germanyLabel: "ALEMANIA",
    },
  };

  const t = content[language];

  return (
    <section
      id="german-desk"
      className="py-20 lg:py-28 bg-gray-50 dark:bg-gray-800"
      data-testid="section-world-map"
    >
      <div className="max-w-6xl mx-auto px-6 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 
            className="text-3xl md:text-4xl font-heading font-light text-gray-800 dark:text-white mb-4"
            data-testid="text-global-reach-title"
          >
            {t.title}
          </h2>
          <p 
            className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto"
            data-testid="text-global-reach-subtitle"
          >
            {t.subtitle}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative bg-white dark:bg-gray-900 rounded-md p-8 shadow-sm"
        >
          <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="text-center"
            >
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="w-10 h-10 text-primary" fill="currentColor">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                </svg>
              </div>
              <h3 
                className="text-lg font-semibold text-gray-800 dark:text-white mb-1"
                data-testid="text-mexico-label"
              >
                {t.mexicoLabel}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Torre SOMA Chapultepec
              </p>
            </motion.div>

            <motion.div
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="hidden md:block"
            >
              <div className="flex items-center gap-2">
                <div className="w-24 h-0.5 bg-gradient-to-r from-primary to-primary/50" />
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-3 h-3 rounded-full bg-primary"
                />
                <div className="w-24 h-0.5 bg-gradient-to-l from-primary to-primary/50" />
              </div>
              <p 
                className="text-xs text-primary font-semibold tracking-wider mt-2 text-center"
                data-testid="text-german-desk-label"
              >
                {t.label}
              </p>
            </motion.div>

            <div className="md:hidden flex flex-col items-center">
              <div className="w-0.5 h-12 bg-gradient-to-b from-primary to-primary/50" />
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-3 h-3 rounded-full bg-primary my-2"
              />
              <div className="w-0.5 h-12 bg-gradient-to-t from-primary to-primary/50" />
              <p 
                className="text-xs text-primary font-semibold tracking-wider mt-2"
              >
                {t.label}
              </p>
            </div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.8 }}
              className="text-center"
            >
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="w-10 h-10 text-primary" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                </svg>
              </div>
              <h3 
                className="text-lg font-semibold text-gray-800 dark:text-white mb-1"
                data-testid="text-germany-label"
              >
                {t.germanyLabel}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                German Desk
              </p>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 1 }}
            className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div>
                <p className="text-2xl font-semibold text-primary mb-1">25+</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {language === "es" ? "Años de experiencia" : "Years of Experience"}
                </p>
              </div>
              <div>
                <p className="text-2xl font-semibold text-primary mb-1">100+</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {language === "es" ? "Clientes alemanes" : "German Clients"}
                </p>
              </div>
              <div>
                <p className="text-2xl font-semibold text-primary mb-1">3</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {language === "es" ? "Idiomas (ES/EN/DE)" : "Languages (ES/EN/DE)"}
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
