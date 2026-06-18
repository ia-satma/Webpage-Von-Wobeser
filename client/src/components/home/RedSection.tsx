import { Link } from "wouter";
import { useFadeOnScroll } from "@/hooks/useFadeOnScroll";
import { useLanguage } from "@/contexts/LanguageContext";

/**
 * RedSection — banda roja corporativa (`.home__rojo`, fondo #ac162c) del home
 * viejo. Mensaje "WE GO WHERE CLIENTS NEED US" + "New offices of Von Wobeser y
 * Sierra" con enlace SEE MORE alineado a la derecha.
 *
 * Texto estático (mensaje de marca); no requiere data-fetching.
 */

type RedCopy = {
  line1: string;
  line2: string;
  seeMore: string;
};

const redCopy: Record<string, RedCopy> = {
  en: {
    line1: "WE GO WHERE CLIENTS NEED US",
    line2: "New offices of Von Wobeser y Sierra",
    seeMore: "SEE MORE",
  },
  es: {
    line1: "VAMOS A DONDE LOS CLIENTES NOS NECESITAN",
    line2: "Nuevas oficinas de Von Wobeser y Sierra",
    seeMore: "VER MÁS",
  },
};

export default function RedSection() {
  const { language } = useLanguage();
  const ref = useFadeOnScroll<HTMLDivElement>();
  const t = redCopy[language] || redCopy.en;

  return (
    <section
      className="bg-vw-red py-20 md:py-24 text-white"
      data-testid="section-home-red"
    >
      <div className="vw-wrap">
        <div ref={ref} className="vw-fade mx-auto max-w-[940px]">
          <p className="font-serif text-[24px] font-bold leading-tight md:text-[28px]">
            {t.line1}
          </p>
          <p className="mt-3 font-serif text-[22px] leading-tight md:text-[24px]">
            {t.line2}
          </p>
          <p className="mt-6 text-right">
            <Link
              href="/about"
              className="vw-label text-[13px] font-bold text-white no-underline hover:underline"
              data-testid="link-red-seemore"
            >
              {t.seeMore}
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}
