import { Link } from "wouter";
import type { TeamMember, PracticeGroup, IndustryGroup, LanguageCode } from "@shared/schema";

/**
 * AttorneySidebar — sidebar gris (#c4c4c4 / vw-graylight) del detalle de
 * abogado (look viejo, `.attorney__meta`).
 *
 * Contiene: foto, nombre en blanco (Publico / font-serif), cargo en mayúsculas
 * (Geomanist / font-label), bloque de contacto (teléfono, email, LinkedIn,
 * descarga vCard) y una lista de prácticas con viñetas. La descarga de vCard
 * se preserva: invoca `onDownloadVCard` (el contenedor mantiene el endpoint
 * `/api/team/:slug/vcard`).
 *
 * Solo tokens establecidos (vw-graylight, vw-red, vw-gray, font-serif,
 * font-label) — sin tocar index.css.
 */
export interface AttorneySidebarLabels {
  role: string; // etiqueta de seniority ya resuelta (Socio / Of Counsel / ...)
  practiceAreas: string;
  industryGroups: string;
  downloadVCard: string;
}

export interface AttorneySidebarProps {
  member: TeamMember;
  /** Cargo/posición ya traducido (opcional, distinto del seniority). */
  displayTitle?: string | null;
  practiceGroups?: PracticeGroup[];
  industryGroups?: IndustryGroup[];
  language: LanguageCode;
  labels: AttorneySidebarLabels;
  onDownloadVCard: () => void;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function AttorneySidebar({
  member,
  displayTitle,
  practiceGroups,
  industryGroups,
  language,
  labels,
  onDownloadVCard,
}: AttorneySidebarProps) {
  const practiceName = (g: PracticeGroup) =>
    language === "es" ? g.nameEs || g.name : g.name || g.nameEs;
  const industryName = (g: IndustryGroup) =>
    language === "es" ? g.nameEs || g.name : g.name || g.nameEs;

  return (
    <aside
      className="bg-vw-graylight"
      data-testid="attorney-sidebar"
    >
      {/* Foto */}
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-vw-gray/20">
        {member.imageUrl ? (
          <img
            src={member.imageUrl}
            alt={member.name}
            className="absolute inset-0 h-full w-full object-cover object-top"
            data-testid="img-sidebar-photo"
          />
        ) : (
          <span
            aria-hidden="true"
            className="absolute inset-0 flex items-center justify-center font-serif text-6xl text-white/70"
          >
            {getInitials(member.name)}
          </span>
        )}
      </div>

      <div className="px-7 py-8">
        {/* Nombre (blanco, Publico) + cargo (uppercase, Geomanist) */}
        <h1
          className="font-serif text-[30px] leading-[1.1] text-white"
          data-testid="text-team-member-name"
        >
          {member.name}
        </h1>
        <p
          className="mt-2 font-label text-[13px] uppercase tracking-[0.22em] text-white/80"
          data-testid="text-team-member-role"
        >
          {labels.role}
        </p>
        {displayTitle && displayTitle !== labels.role && (
          <p className="mt-1 font-label text-[12px] uppercase tracking-[0.18em] text-white/60">
            {displayTitle}
          </p>
        )}

        {/* Contacto + vCard */}
        <div className="mt-6 space-y-1.5 border-t border-white/30 pt-5 text-[14px] text-vw-gray">
          {member.phone && (
            <p>
              <a
                href={`tel:${member.phone}`}
                className="transition-colors hover:text-vw-red"
                data-testid="link-sidebar-phone"
              >
                {member.phone}
              </a>
            </p>
          )}
          {member.email && (
            <p>
              <a
                href={`mailto:${member.email}`}
                className="break-all transition-colors hover:text-vw-red"
                data-testid="link-sidebar-email"
              >
                {member.email}
              </a>
            </p>
          )}
          {member.linkedinUrl && (
            <p>
              <a
                href={member.linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors hover:text-vw-red"
                data-testid="link-sidebar-linkedin"
              >
                LinkedIn
              </a>
            </p>
          )}
          <p className="pt-2">
            <button
              type="button"
              onClick={onDownloadVCard}
              data-testid="button-download-vcard"
              className="font-label text-[12px] uppercase tracking-[0.18em] text-vw-red transition-opacity hover:opacity-70"
            >
              {labels.downloadVCard}
            </button>
          </p>
        </div>

        {/* Prácticas (lista con viñetas) */}
        {practiceGroups && practiceGroups.length > 0 && (
          <div className="mt-7 border-t border-white/30 pt-5" data-testid="sidebar-practices">
            <p className="mb-2 font-label text-[12px] uppercase tracking-[0.2em] text-white">
              {labels.practiceAreas}
            </p>
            <ul className="space-y-1.5">
              {practiceGroups.map((group) => (
                <li key={group.id} className="flex items-baseline gap-2 text-[14px]">
                  <span aria-hidden="true" className="mt-[2px] h-1 w-1 shrink-0 bg-vw-red" />
                  <Link
                    href={`/practice-groups/${group.slug}`}
                    className="text-vw-gray transition-colors hover:text-vw-red"
                    data-testid={`link-sidebar-practice-${group.slug}`}
                  >
                    {practiceName(group)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Grupos industriales (lista con viñetas) */}
        {industryGroups && industryGroups.length > 0 && (
          <div className="mt-7 border-t border-white/30 pt-5" data-testid="sidebar-industries">
            <p className="mb-2 font-label text-[12px] uppercase tracking-[0.2em] text-white">
              {labels.industryGroups}
            </p>
            <ul className="space-y-1.5">
              {industryGroups.map((group) => (
                <li key={group.id} className="flex items-baseline gap-2 text-[14px]">
                  <span aria-hidden="true" className="mt-[2px] h-1 w-1 shrink-0 bg-vw-red" />
                  <Link
                    href={`/industry-groups/${group.slug}`}
                    className="text-vw-gray transition-colors hover:text-vw-red"
                    data-testid={`link-sidebar-industry-${group.slug}`}
                  >
                    {industryName(group)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </aside>
  );
}
