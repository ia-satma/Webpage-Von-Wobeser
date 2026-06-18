import { useQuery } from "@tanstack/react-query";
import { useFadeOnScroll } from "@/hooks/useFadeOnScroll";
import { useLanguage } from "@/contexts/LanguageContext";
import type { SiteContent } from "@shared/schema";

/**
 * IntroSection — bloque introductorio centrado (`.home__intro`) del home viejo.
 *
 * El sitio viejo mostraba 3 citas de rankings (Latin Lawyer, Legal 500,
 * Chambers & Partners) en grande con tipografía Publico. Aquí mostramos esas
 * citas estáticas y, si `/api/site-content` trae una cita destacada
 * (`quoteText` / `quoteAuthor`), la priorizamos como primera cita.
 *
 * Preserva el data-fetching `/api/site-content`.
 */

type IntroQuote = { text: string; source: string };

const introQuotes: Record<string, IntroQuote[]> = {
  en: [
    {
      text:
        "Von Wobeser y Sierra, S.C. is a full service law firm that has successfully blended elite corporate and disputes work. It is possibly the only firm in this market with a perfectly balanced strength in both areas, making it well served to assist companies with the most challenging legal matters.",
      source: "Latin Lawyer",
    },
    {
      text:
        "With a high-profile client base across Latin America, Europe and the US, Von Wobeser y Sierra, S.C.'s service corresponds to that of a highly qualified, international firm.",
      source: "Legal 500",
    },
    {
      text:
        "This is a firm with the capacity to give comprehensive and practical advice. The lawyers are committed to the client and are always accessible.",
      source: "Chambers & Partners Latin America",
    },
  ],
  es: [
    {
      text:
        "Von Wobeser y Sierra, S.C. es una firma de servicio completo que ha combinado con éxito trabajo corporativo y litigioso de élite. Posiblemente sea la única firma en este mercado con una fortaleza perfectamente equilibrada en ambas áreas, lo que la posiciona para asistir a las empresas en los asuntos legales más complejos.",
      source: "Latin Lawyer",
    },
    {
      text:
        "Con una cartera de clientes de alto perfil en América Latina, Europa y Estados Unidos, el servicio de Von Wobeser y Sierra, S.C. corresponde al de una firma internacional altamente calificada.",
      source: "Legal 500",
    },
    {
      text:
        "Es una firma con la capacidad de brindar asesoría integral y práctica. Los abogados están comprometidos con el cliente y siempre son accesibles.",
      source: "Chambers & Partners Latin America",
    },
  ],
};

export default function IntroSection() {
  const { language } = useLanguage();
  const ref = useFadeOnScroll<HTMLDivElement>();

  const { data: siteContent } = useQuery<SiteContent>({
    queryKey: ["/api/site-content"],
  });

  const quotes = [...(introQuotes[language] || introQuotes.en)];

  // Si el CMS trae una cita destacada (solo en inglés viene del backend),
  // la usamos como primera cita preservando la presentación.
  if (siteContent?.quoteText && language === "en") {
    quotes[0] = {
      text: siteContent.quoteText,
      source: siteContent.quoteAuthor || quotes[0].source,
    };
  }

  return (
    <section
      id="home-intro"
      className="bg-white py-24 md:py-32"
      data-testid="section-home-intro"
    >
      <div className="vw-wrap">
        <div
          ref={ref}
          className="vw-fade mx-auto flex max-w-[900px] flex-col gap-16 text-center"
        >
          {quotes.map((q, i) => (
            <blockquote key={i} className="flex flex-col gap-4" data-testid={`intro-quote-${i}`}>
              <p className="font-serif text-[25px] leading-[1.45] text-vw-gray">
                {q.text}
              </p>
              <cite className="vw-label text-[13px] not-italic text-vw-red">
                — {q.source}
              </cite>
            </blockquote>
          ))}
        </div>
      </div>
    </section>
  );
}
