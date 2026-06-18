import { type ReactNode } from "react";
import SiteHeader from "./SiteHeader";
import SiteFooter from "./SiteFooter";

/**
 * Layout — envoltura del shell público de Von Wobeser (look viejo).
 *
 * Compone SiteHeader + contenido + SiteFooter. El header es sticky y el
 * contenido vive dentro de la página (las propias páginas usan `.vw-wrap`
 * para el contenedor de 1340px; aquí garantizamos el flujo vertical y el
 * landmark <main> para accesibilidad).
 *
 * NOTA: este Layout es SOLO para rutas públicas. Las rutas /admin/* NO
 * deben envolverse con él (conservan su propio layout).
 */
export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-white text-vw-gray font-sans">
      <SiteHeader />
      <main id="main-content" className="flex-1" tabIndex={-1}>
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
