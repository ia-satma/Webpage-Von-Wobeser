import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import NewsSection from "@/components/NewsSection";
import VisionSection from "@/components/VisionSection";
import MapSection from "@/components/MapSection";
import StatsSection from "@/components/StatsSection";
import ImageCollage from "@/components/ImageCollage";
import WorldMapSection from "@/components/WorldMapSection";
import QuoteSection from "@/components/QuoteSection";
import RankingsSection from "@/components/RankingsSection";
import Footer from "@/components/Footer";
import NewOfficesPopup from "@/components/NewOfficesPopup";
import JsonLdSchema from "@/components/JsonLdSchema";
import CookieBanner from "@/components/CookieBanner";
import SEOHead from "@/components/SEOHead";
import { useLanguage } from "@/contexts/LanguageContext";

export default function Home() {
  const { language } = useLanguage();

  return (
    <div className="min-h-screen bg-white" data-testid="page-home">
      <SEOHead page="home" language={language} />
      <JsonLdSchema language={language} />
      <Header />
      <main id="main-content">
        <HeroSection language={language} />
        <RankingsSection language={language} />
        <NewsSection language={language} />
        <VisionSection language={language} />
        <StatsSection language={language} />
        <ImageCollage language={language} />
        <WorldMapSection language={language} />
        <QuoteSection language={language} />
        <MapSection language={language} />
      </main>
      <Footer />
      <NewOfficesPopup language={language} />
      <CookieBanner language={language} />
    </div>
  );
}
