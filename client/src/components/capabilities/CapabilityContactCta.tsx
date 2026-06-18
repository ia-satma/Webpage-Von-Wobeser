import { Link } from "wouter";
import { Mail, Phone } from "lucide-react";
import { useFadeOnScroll } from "@/hooks/useFadeOnScroll";

/**
 * CapabilityContactCta — bloque de contacto al pie de las páginas de detalle
 * de capacidades, en el look viejo: panel gris claro (#c4c4c4-ish) con título
 * en Publico-Roman, texto OptimaLT y botones (email rojo corporativo / llamar
 * outline). Reusa el teléfono del footer del mirror (+52 55 5258 1000).
 */

interface CapabilityContactCtaProps {
  title: string;
  subtitle: string;
  emailLabel: string;
  callLabel: string;
  /** Si false, el botón "llamar" no navega (paridad con la página vieja sin tel). */
  enableCall?: boolean;
}

export default function CapabilityContactCta({
  title,
  subtitle,
  emailLabel,
  callLabel,
  enableCall = true,
}: CapabilityContactCtaProps) {
  const ref = useFadeOnScroll<HTMLDivElement>();

  return (
    <section className="bg-white py-16 lg:py-20" data-testid="section-contact-cta">
      <div className="vw-wrap max-w-4xl">
        <div
          ref={ref}
          className="vw-fade border-l-2 border-l-vw-red bg-vw-graylight/30 p-8 lg:p-12"
        >
          <h2
            className="font-serif text-2xl text-vw-black"
            data-testid="text-contact-cta-title"
          >
            {title}
          </h2>
          <p
            className="mt-3 max-w-2xl font-sans text-base leading-relaxed text-vw-gray"
            data-testid="text-contact-cta-subtitle"
          >
            {subtitle}
          </p>
          <div className="mt-6 flex flex-col gap-4 sm:flex-row">
            <Link
              href="/contact"
              className="inline-flex items-center justify-center gap-2 bg-vw-red px-6 py-3 vw-label text-xs text-white transition-opacity hover:opacity-90"
              data-testid="button-email-us"
            >
              <Mail className="h-4 w-4" aria-hidden="true" />
              {emailLabel}
            </Link>
            <a
              href={enableCall ? "tel:+525552581000" : undefined}
              className="inline-flex items-center justify-center gap-2 border border-vw-gray px-6 py-3 vw-label text-xs text-vw-gray transition-colors hover:border-vw-red hover:text-vw-red"
              data-testid="button-call-us"
              {...(!enableCall ? { role: "button", "aria-disabled": true } : {})}
            >
              <Phone className="h-4 w-4" aria-hidden="true" />
              {callLabel}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
