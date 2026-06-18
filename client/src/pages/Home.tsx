import { useLanguage } from "@/contexts/LanguageContext";
import SEOHead from "@/components/SEOHead";
import JsonLdSchema from "@/components/JsonLdSchema";
import NewOfficesPopup from "@/components/NewOfficesPopup";
import CookieBanner from "@/components/CookieBanner";

import HeroSection from "@/components/home/HeroSection";
import IntroSection from "@/components/home/IntroSection";
import RedSection from "@/components/home/RedSection";
import PracticesSlider from "@/components/home/PracticesSlider";
import GraySection from "@/components/home/GraySection";
import IndustriesSlider from "@/components/home/IndustriesSlider";
import NumberedBlocks from "@/components/home/NumberedBlocks";
import EventsBand from "@/components/home/EventsBand";
import RecommendedSlider from "@/components/home/RecommendedSlider";

/**
 * Home — recreación del home viejo de Von Wobeser (mirror Joomla/beez3).
 *
 * El shell público (header + footer) lo provee <Layout> en App.tsx, por lo que
 * esta página NO renderiza header/footer propios ni un <main> adicional.
 *
 * Orden de secciones (fiel al viejo):
 *   1. Hero a pantalla completa (video) con panel de noticias + scroll.
 *   2. Intro centrado (citas de rankings, Publico grande).
 *   3. Banda roja corporativa (mensaje de marca / nuevas oficinas).
 *   4. Carrusel de 18 áreas de práctica (numerado).
 *   5. Banda gris (frase de trayectoria / equipo).
 *   6. Carrusel de 7 grupos de industria (numerado).
 *   7. Bloques numerados (Recognitions / Diversity / Pro Bono).
 *   8. Próximos eventos.
 *   9. Carrusel de reconocimientos (sellos / logos).
 *
 * Data preservada de la versión anterior (sin cambios en la capa de datos):
 *   - /api/site-content  (IntroSection, GraySection)
 *   - /api/news          (HeroSection — panel de noticias)
 *   - /api/stats         (GraySection — conteo de equipo)
 *   - /api/events/upcoming (EventsBand)
 */
export default function Home() {
  const { language } = useLanguage();

  return (
    <div data-testid="page-home">
      <SEOHead page="home" language={language} />
      <JsonLdSchema language={language} />

      <HeroSection />
      <IntroSection />
      <RedSection />
      <PracticesSlider />
      <GraySection />
      <IndustriesSlider />
      <NumberedBlocks />
      <EventsBand />
      <RecommendedSlider />

      <NewOfficesPopup language={language} />
      <CookieBanner language={language} />
    </div>
  );
}
