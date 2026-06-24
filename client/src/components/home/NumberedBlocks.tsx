import { Link } from "wouter";
import { useFadeOnScroll } from "@/hooks/useFadeOnScroll";
import { useLanguage } from "@/contexts/LanguageContext";

/**
 * NumberedBlocks — bloques numerados del home viejo (`.home__rec` boxes:
 * DIVERSITY & INCLUSION / PRO BONO). Cada bloque: número rojo gigante + título
 * con borde inferior rojo + copy + enlace SEE MORE.
 *
 * Recognitions NO va aquí: el original lo presenta como la sección de logos
 * (ver RecommendedSlider). Mantenerlo también como bloque de texto duplicaba
 * el tema, así que solo quedan Diversity y Pro Bono.
 *
 * Contenido estático de marca; cada bloque enlaza a su sección.
 */

type Block = {
  num: string;
  title: { en: string; es: string };
  body: { en: string; es: string };
  href: string;
};

const blocks: Block[] = [
  {
    num: "01",
    title: { en: "Diversity & Inclusion", es: "Diversidad e Inclusión" },
    body: {
      en: "Since its founding in 1986, our partners set out to create an inclusive firm committed to the promotion of diversity.",
      es: "Desde su fundación en 1986, nuestros socios se propusieron crear una firma incluyente y comprometida con la promoción de la diversidad.",
    },
    href: "/about",
  },
  {
    num: "02",
    title: { en: "Pro Bono", es: "Pro Bono" },
    body: {
      en: "For more than 35 years, our firm has actively supported the Pro Bono cause across Mexico.",
      es: "Por más de 35 años, nuestra firma ha apoyado activamente la causa Pro Bono en todo México.",
    },
    href: "/about",
  },
];

const seeMore: Record<string, string> = { en: "SEE MORE", es: "VER MÁS" };

function NumberedBlock({ block, language }: { block: Block; language: string }) {
  const ref = useFadeOnScroll<HTMLDivElement>();
  const title = language === "es" ? block.title.es : block.title.en;
  const body = language === "es" ? block.body.es : block.body.en;
  const more = seeMore[language] || seeMore.en;

  return (
    <div ref={ref} className="vw-fade flex flex-col" data-testid={`block-${block.num}`}>
      <span className="font-serif text-[80px] leading-none text-vw-red md:text-[96px]">
        {block.num}
      </span>
      <h3 className="vw-section-title mt-4 pb-3 font-serif text-[30px] text-vw-gray">
        {title}
      </h3>
      <p className="mt-2 flex-1 font-sans text-[16px] leading-relaxed text-vw-gray">
        {body}
      </p>
      <Link
        href={block.href}
        className="vw-label mt-6 inline-block text-[12px] font-bold text-vw-red no-underline hover:underline"
        data-testid={`link-block-${block.num}`}
      >
        {more}
      </Link>
    </div>
  );
}

export default function NumberedBlocks() {
  const { language } = useLanguage();

  return (
    <section className="bg-white py-24 md:py-28" data-testid="section-numbered-blocks">
      <div className="vw-wrap">
        <div className="mx-auto grid max-w-[820px] grid-cols-1 gap-14 md:grid-cols-2 md:gap-16">
          {blocks.map((b) => (
            <NumberedBlock key={b.num} block={b} language={language} />
          ))}
        </div>
      </div>
    </section>
  );
}
