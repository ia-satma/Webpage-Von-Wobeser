import { Link } from "wouter";
import { ChevronRight } from "lucide-react";
import { useFadeOnScroll } from "@/hooks/useFadeOnScroll";
import SectionTitle from "./SectionTitle";
import type { TeamMember } from "@shared/schema";

/**
 * RelatedAttorneys — abogados relacionados con la práctica, agrupados por
 * Partners / Of Counsel / Associates. Replica las listas "Partners in the
 * Practice / Counsel / Associates" de la página de detalle del mirror Joomla,
 * donde cada nombre era un enlace al perfil del abogado.
 *
 * Aquí cada grupo lleva su contador (label Geomanist) y los nombres son filas
 * enlazadas en Publico-Roman, con el acento rojo corporativo.
 */

interface GroupedMembers {
  partners: TeamMember[];
  ofCounsel: TeamMember[];
  associates: TeamMember[];
}

interface AttorneysStrings {
  ourTeam: string;
  partners: string;
  ofCounsel: string;
  associates: string;
  viewAll: string;
}

interface RelatedAttorneysProps {
  groups: GroupedMembers;
  language: string;
  t: AttorneysStrings;
  /** Máximo de asociados mostrados antes del enlace "ver todos". */
  maxAssociates?: number;
  /** Slug de la práctica (para el enlace "ver todos los asociados"). */
  practiceSlug?: string;
}

function MemberRow({ member, language }: { member: TeamMember; language: string }) {
  return (
    <li>
      <Link
        href={`/team/${member.slug}`}
        className="group flex items-center justify-between gap-4 border-l-2 border-l-vw-red/40 bg-white py-3 pl-5 pr-3 transition-colors hover:border-l-vw-red"
        data-testid={`related-attorney-${member.slug}`}
      >
        <div className="min-w-0">
          <p className="truncate font-serif text-base text-vw-black transition-colors group-hover:text-vw-red">
            {member.name}
          </p>
          <p className="truncate font-sans text-sm text-vw-gray">
            {language === "es" ? member.roleEs : member.role}
          </p>
        </div>
        <ChevronRight className="h-4 w-4 shrink-0 text-vw-red transition-transform group-hover:translate-x-1" aria-hidden="true" />
      </Link>
    </li>
  );
}

function MemberGroup({
  label,
  count,
  members,
  language,
  testId,
}: {
  label: string;
  count: number;
  members: TeamMember[];
  language: string;
  testId: string;
}) {
  if (members.length === 0) return null;
  return (
    <div className="mb-8" data-testid={testId}>
      <h3 className="mb-4 flex items-center gap-3 vw-label text-sm text-vw-black">
        <span className="inline-flex h-6 min-w-6 items-center justify-center border border-vw-red px-1.5 text-[11px] text-vw-red">
          {count}
        </span>
        {label}
      </h3>
      <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {members.map((m) => (
          <MemberRow key={m.id} member={m} language={language} />
        ))}
      </ul>
    </div>
  );
}

export default function RelatedAttorneys({
  groups,
  language,
  t,
  maxAssociates = 6,
  practiceSlug,
}: RelatedAttorneysProps) {
  const ref = useFadeOnScroll<HTMLDivElement>();

  const displayedAssociates = groups.associates.slice(0, maxAssociates);
  const hasMoreAssociates = groups.associates.length > maxAssociates;

  return (
    <section className="bg-white py-16 lg:py-20" data-testid="section-team-members">
      <div className="vw-wrap max-w-4xl">
        <div ref={ref} className="vw-fade">
          <SectionTitle className="mb-8" testId="text-our-team-title">
            {t.ourTeam}
          </SectionTitle>

          <MemberGroup
            label={t.partners}
            count={groups.partners.length}
            members={groups.partners}
            language={language}
            testId="section-partners"
          />
          <MemberGroup
            label={t.ofCounsel}
            count={groups.ofCounsel.length}
            members={groups.ofCounsel}
            language={language}
            testId="section-of-counsel"
          />

          {displayedAssociates.length > 0 && (
            <div data-testid="section-associates">
              <h3 className="mb-4 flex items-center gap-3 vw-label text-sm text-vw-black">
                <span className="inline-flex h-6 min-w-6 items-center justify-center border border-vw-graylight px-1.5 text-[11px] text-vw-gray">
                  {groups.associates.length}
                </span>
                {t.associates}
              </h3>
              <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {displayedAssociates.map((m) => (
                  <MemberRow key={m.id} member={m} language={language} />
                ))}
              </ul>
              {hasMoreAssociates && practiceSlug && (
                <div className="mt-6">
                  <Link
                    href={`/team?practice=${practiceSlug}`}
                    className="inline-flex items-center gap-2 vw-label text-xs text-vw-red transition-colors hover:text-vw-black"
                    data-testid="link-view-all-associates"
                  >
                    {t.viewAll} ({groups.associates.length})
                    <ChevronRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
