import { useFadeOnScroll } from "@/hooks/useFadeOnScroll";

/**
 * CapabilityProse — cuerpo descriptivo de una práctica/industria en el look
 * viejo. Replica `.single__content--intro` (primer párrafo destacado) +
 * `.single__content--txt` (párrafos en OptimaLT ~19px, interlineado holgado)
 * de la página de detalle del mirror Joomla.
 *
 * Recibe el texto completo y lo parte por dobles saltos de línea. El primer
 * párrafo se renderiza como intro destacado; el resto como cuerpo.
 */

interface CapabilityProseProps {
  eyebrow?: string;
  text: string;
  testId?: string;
}

export default function CapabilityProse({ eyebrow, text, testId }: CapabilityProseProps) {
  const ref = useFadeOnScroll<HTMLDivElement>();

  const paragraphs = text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  const [intro, ...rest] = paragraphs.length ? paragraphs : [text];

  return (
    <section className="bg-white py-16 lg:py-20" data-testid={testId}>
      <div className="vw-wrap max-w-4xl">
        <div ref={ref} className="vw-fade">
          {eyebrow && (
            <p className="vw-label mb-5 text-xs text-vw-red">{eyebrow}</p>
          )}
          <p className="border-l-2 border-l-vw-red pl-6 font-serif text-xl font-light leading-relaxed text-vw-black md:text-2xl">
            {intro}
          </p>
          {rest.map((p, i) => (
            <p
              key={i}
              className="mt-6 font-sans text-lg leading-relaxed text-vw-gray"
            >
              {p}
            </p>
          ))}
        </div>
      </div>
    </section>
  );
}
