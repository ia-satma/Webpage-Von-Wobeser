import { useFadeOnScroll } from "@/hooks/useFadeOnScroll";
import AttorneyCard from "./AttorneyCard";
import type { TeamMember, LanguageCode } from "@shared/schema";

/**
 * AttorneyGroup — una categoría del listado (Socios / Of Counsel / Asociados).
 *
 * Encabezado de sección con título serif (Publico) y eyebrow/contador en
 * Geomanist (font-label), seguido de la lista de `AttorneyCard`. Usa
 * `useFadeOnScroll` para reproducir el `.fade_JS` del sitio viejo.
 *
 * `getDisplayTitle` resuelve el cargo a mostrar por miembro según idioma
 * (preserva la lógica de traducción: titleEs en es, title en otros idiomas).
 */
export interface AttorneyGroupProps {
  /** Eyebrow en Geomanist (uppercase), p.ej. "NUESTRO EQUIPO". */
  eyebrow: string;
  /** Título de la categoría en serif, p.ej. "Socios". */
  title: string;
  members: TeamMember[];
  language: LanguageCode;
  viewProfileLabel: string;
  testId?: string;
}

function getDisplayTitle(member: TeamMember, language: LanguageCode): string {
  if (language === "es") return member.titleEs || member.title;
  return member.title || member.titleEs;
}

export default function AttorneyGroup({
  eyebrow,
  title,
  members,
  language,
  viewProfileLabel,
  testId,
}: AttorneyGroupProps) {
  const fadeRef = useFadeOnScroll<HTMLElement>();

  if (members.length === 0) return null;

  return (
    <section
      ref={fadeRef}
      className="vw-fade pt-14 first:pt-0"
      data-testid={testId}
    >
      {/* Encabezado de categoría */}
      <div className="mb-3 flex items-baseline gap-3">
        <span className="font-label text-[11px] uppercase tracking-[0.3em] text-vw-red">
          {eyebrow}
        </span>
        <span className="font-label text-[11px] tracking-[0.2em] text-vw-gray/40">
          — {members.length}
        </span>
      </div>
      <h2 className="vw-section-title text-vw-gray">{title}</h2>

      {/* Lista de tarjetas */}
      <div>
        {members.map((member) => (
          <AttorneyCard
            key={member.id}
            member={member}
            displayTitle={getDisplayTitle(member, language)}
            viewProfileLabel={viewProfileLabel}
          />
        ))}
      </div>
    </section>
  );
}
