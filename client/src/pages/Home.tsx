import { useState } from "react";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import NewsSection from "@/components/NewsSection";
import VisionSection from "@/components/VisionSection";
import MapSection from "@/components/MapSection";
import StatsSection from "@/components/StatsSection";
import ImageCollage from "@/components/ImageCollage";
import QuoteSection from "@/components/QuoteSection";
import Footer from "@/components/Footer";

export default function Home() {
  const [language, setLanguage] = useState<"es" | "en">("es");

  return (
    <div className="min-h-screen bg-white" data-testid="page-home">
      <Header language={language} onLanguageChange={setLanguage} />
      <main>
        <HeroSection language={language} />
        <NewsSection language={language} />
        <VisionSection language={language} />
        <StatsSection language={language} />
        <ImageCollage language={language} />
        <QuoteSection language={language} />
        <MapSection language={language} />
      </main>
      <Footer language={language} />
    </div>
  );
}
