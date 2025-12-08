import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import SocialProofSection from "@/components/SocialProofSection";
import PracticesSection from "@/components/PracticesSection";
import ExperienceBanner from "@/components/ExperienceBanner";
import IndustryGroupsSection from "@/components/IndustryGroupsSection";
import StatsSection from "@/components/StatsSection";
import WorldMapSection from "@/components/WorldMapSection";
import RankingsSection from "@/components/RankingsSection";
import DiversityInclusionSection from "@/components/DiversityInclusionSection";
import ProBonoSection from "@/components/ProBonoSection";
import AboutUsSection from "@/components/AboutUsSection";
import MapSection from "@/components/MapSection";
import EventsSection from "@/components/EventsSection";
import Footer from "@/components/Footer";
import NewOfficesPopup from "@/components/NewOfficesPopup";
import JsonLdSchema from "@/components/JsonLdSchema";
import CookieBanner from "@/components/CookieBanner";
import SEOHead from "@/components/SEOHead";
import { useLanguage } from "@/contexts/LanguageContext";

export default function Home() {
  const { language, displayLanguage } = useLanguage();

  return (
    <div className="min-h-screen bg-white" data-testid="page-home">
      <SEOHead page="home" language={language} />
      <JsonLdSchema language={language} />
      
      {/* 1. Header/Nav with deep menu */}
      <Header />
      
      <main id="main-content">
        {/* 2. Hero Section with news overlay */}
        <HeroSection language={displayLanguage} />
        
        {/* 3. Social Proof / Testimonials (Chambers, Legal 500, Latin Lawyer) */}
        <SocialProofSection language={displayLanguage} />
        
        {/* 4. 18 Practices (complete list) */}
        <PracticesSection />
        
        {/* 5. Experience Banner */}
        <ExperienceBanner />
        
        {/* 6. 7 Industry Groups (complete list) */}
        <IndustryGroupsSection />
        
        {/* 7. Stats / Team (150 lawyers...) */}
        <StatsSection language={displayLanguage} />
        
        {/* Upcoming Events */}
        <EventsSection language={displayLanguage} />
        
        {/* 8. German Desk (complete section with text + member lists) */}
        <WorldMapSection language={displayLanguage} />
        
        {/* 9. RECOGNITIONS (badges, intro, institutions) */}
        <RankingsSection language={displayLanguage} />
        
        {/* 10. Diversity & Inclusion */}
        <DiversityInclusionSection />
        
        {/* 11. Pro Bono */}
        <ProBonoSection />
        
        {/* 12. About Us (Vision, Mission, Values) */}
        <AboutUsSection />
        
        {/* 13. Map / Location */}
        <MapSection language={displayLanguage} />
      </main>
      
      {/* 14. Footer */}
      <Footer />
      
      {/* Popups and Banners */}
      <NewOfficesPopup language={displayLanguage} />
      <CookieBanner language={displayLanguage} />
    </div>
  );
}
