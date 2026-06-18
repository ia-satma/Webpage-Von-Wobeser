import { useState } from "react";
import { Link } from "wouter";
import type { TeamMember } from "@shared/schema";

/**
 * AttorneyCard — tarjeta de abogado del listado (look viejo).
 *
 * Recrea `.attorneys__list--item` del mirror Joomla: foto + nombre (Publico,
 * `font-serif`) + cargo (Geomanist uppercase con letter-spacing amplio,
 * `font-label`). En hover el nombre se tiñe de rojo corporativo (vw-red
 * #ac162c), la foto pasa de B/N a color y se revela la meta (teléfono/email)
 * que estaba oculta — replicando el panel que el viejo mostraba al activar la
 * tarjeta. Una línea inferior gris vira a roja en hover.
 *
 * La capa de datos NO cambia: el slug enlaza a `/team/:slug`.
 * Solo se usan tokens Tailwind establecidos (vw-red, vw-gray, vw-graylight,
 * font-serif, font-label) — sin tocar index.css.
 */
export interface AttorneyCardProps {
  member: TeamMember;
  /** Cargo ya traducido al idioma activo. */
  displayTitle: string;
  /** Etiqueta accesible "Ver perfil" (i18n). */
  viewProfileLabel: string;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function getPhotoSrc(member: TeamMember): string {
  return member.imageUrl || `/partner_photos/${member.slug}.jpg`;
}

export default function AttorneyCard({
  member,
  displayTitle,
  viewProfileLabel,
}: AttorneyCardProps) {
  const [imgError, setImgError] = useState(false);

  return (
    <Link
      href={`/team/${member.slug}`}
      aria-label={`${member.name} — ${viewProfileLabel}`}
      data-testid={`card-team-member-${member.slug}`}
      className="group block border-b border-vw-graylight transition-colors duration-300 hover:border-vw-red"
    >
      <div className="flex items-center gap-5 px-2 py-6 sm:px-4 sm:py-7">
        {/* Foto: B/N en reposo, color en hover */}
        <div className="relative h-[78px] w-[78px] shrink-0 overflow-hidden bg-vw-graylight sm:h-[92px] sm:w-[92px]">
          {imgError ? (
            <span
              aria-hidden="true"
              className="absolute inset-0 flex items-center justify-center font-serif text-2xl text-vw-gray/60"
            >
              {getInitials(member.name)}
            </span>
          ) : (
            <img
              src={getPhotoSrc(member)}
              alt=""
              aria-hidden="true"
              loading="lazy"
              onError={() => setImgError(true)}
              className="absolute inset-0 h-full w-full object-cover object-top grayscale transition-[filter,transform] duration-500 group-hover:grayscale-0"
            />
          )}
        </div>

        {/* Nombre + cargo + meta revelada */}
        <div className="min-w-0 flex-1">
          <span className="block truncate font-serif text-[22px] leading-tight text-vw-gray transition-colors duration-300 group-hover:text-vw-red sm:text-[24px]">
            {member.name}
          </span>
          {displayTitle && (
            <span className="mt-1 block truncate font-label text-[13px] uppercase tracking-[0.28em] text-vw-gray/70 sm:text-[14px] lg:hidden">
              {displayTitle}
            </span>
          )}

          {/* Meta (teléfono / email) — oculta en reposo, revelada en hover (desktop) */}
          {(member.phone || member.email) && (
            <span
              aria-hidden="true"
              className="mt-2 hidden max-h-0 flex-col gap-0.5 overflow-hidden text-[12px] text-vw-gray/60 opacity-0 transition-all duration-300 group-hover:max-h-20 group-hover:opacity-100 lg:flex"
            >
              {member.phone && <span className="truncate">{member.phone}</span>}
              {member.email && <span className="truncate">{member.email}</span>}
            </span>
          )}
        </div>

        {/* Cargo a la derecha en desktop (réplica del space-between del viejo) */}
        {displayTitle && (
          <span className="hidden shrink-0 whitespace-nowrap font-label text-[13px] uppercase tracking-[0.3em] text-vw-gray/50 transition-colors duration-300 group-hover:text-vw-red lg:block">
            {displayTitle}
          </span>
        )}
      </div>
    </Link>
  );
}
