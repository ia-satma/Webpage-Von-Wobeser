import { useTranslatedContent } from "@/hooks/useTranslatedContent";
import { isNativeLanguage } from "@/lib/translationUtils";
import { useFadeOnScroll } from "@/hooks/useFadeOnScroll";
import SectionTitle from "./SectionTitle";
import type { RepresentativeMatterDb } from "@shared/schema";

/**
 * RepresentativeMatters — listado de asuntos representativos ("Success Cases")
 * en el look viejo: cada asunto es una fila con un acento rojo a la izquierda,
 * el año/destacado como etiqueta Geomanist, el título en Publico-Roman y la
 * descripción en OptimaLT. Replica las listas de la página de detalle de
 * práctica del mirror Joomla.
 *
 * Preserva el data-fetching: recibe los `matters` ya cargados por la página y
 * traduce campo a campo con `useTranslatedContent` (igual que el código previo).
 */

interface MattersStrings {
  title: string;
  subtitle: string;
  featured: string;
  client: string;
}

interface MatterRowProps {
  matter: RepresentativeMatterDb;
  language: string;
  t: MattersStrings;
}

function MatterRow({ matter, language, t }: MatterRowProps) {
  const { translatedFields } = useTranslatedContent({
    contentType: "representative_matter",
    entityId: matter.id.toString(),
    fields: {
      title: matter.title,
      titleEs: matter.titleEs,
      description: matter.description,
      descriptionEs: matter.descriptionEs,
      client: matter.client,
      clientEs: matter.clientEs,
    },
    enabled: !isNativeLanguage(language),
  });

  const displayTitle = translatedFields.title || matter.title;
  const displayDescription = translatedFields.description || matter.description;
  const displayClient = translatedFields.client || matter.client;

  return (
    <li
      className="relative border-l-2 border-l-vw-red bg-white py-5 pl-6 pr-2"
      data-testid={`matter-row-${matter.id}`}
    >
      <div className="mb-2 flex flex-wrap items-center gap-x-4 gap-y-1">
        {matter.isHighlight && (
          <span className="vw-label text-[10px] text-vw-red" data-testid={`matter-featured-${matter.id}`}>
            {t.featured}
          </span>
        )}
        <span className="vw-label text-[10px] text-vw-gray" data-testid={`matter-year-${matter.id}`}>
          {matter.year}
        </span>
      </div>
      <h3
        className="font-serif text-lg leading-snug text-vw-black"
        data-testid={`matter-title-${matter.id}`}
      >
        {displayTitle}
      </h3>
      {displayDescription && (
        <p
          className="mt-2 font-sans text-base leading-relaxed text-vw-gray"
          data-testid={`matter-description-${matter.id}`}
        >
          {displayDescription}
        </p>
      )}
      {displayClient && (
        <p className="mt-3 vw-label text-[10px] text-vw-gray" data-testid={`matter-client-${matter.id}`}>
          {t.client} {displayClient}
        </p>
      )}
    </li>
  );
}

interface RepresentativeMattersProps {
  matters: RepresentativeMatterDb[];
  language: string;
  t: MattersStrings;
}

export default function RepresentativeMatters({
  matters,
  language,
  t,
}: RepresentativeMattersProps) {
  const ref = useFadeOnScroll<HTMLDivElement>();

  const sorted = [...matters].sort((a, b) => {
    if (a.isHighlight && !b.isHighlight) return -1;
    if (!a.isHighlight && b.isHighlight) return 1;
    return b.year - a.year;
  });

  return (
    <section className="bg-vw-graylight/20 py-16 lg:py-20" data-testid="section-representative-matters">
      <div className="vw-wrap max-w-4xl">
        <div ref={ref} className="vw-fade">
          <SectionTitle eyebrow={t.subtitle} testId="text-success-cases-title">
            {t.title}
          </SectionTitle>
          <ul className="mt-8 grid grid-cols-1 gap-4">
            {sorted.map((matter) => (
              <MatterRow key={matter.id} matter={matter} language={language} t={t} />
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
