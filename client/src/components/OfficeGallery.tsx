import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/LanguageContext";
import { ZoomIn, X, ChevronLeft, ChevronRight } from "lucide-react";
import type { OfficeImage } from "@shared/schema";

const content = {
  es: { eyebrow: "NUEVAS OFICINAS", title: "NUESTRA CASA" },
  en: { eyebrow: "NEW OFFICES", title: "OUR HOME" },
  de: { eyebrow: "NEUE BÜROS", title: "UNSER ZUHAUSE" },
  zh: { eyebrow: "新办公室", title: "我们的家园" },
  ko: { eyebrow: "새 사무실", title: "우리의 공간" },
  ja: { eyebrow: "新オフィス", title: "私たちの空間" },
  ar: { eyebrow: "مكاتب جديدة", title: "منزلنا" },
  ru: { eyebrow: "НОВЫЙ ОФИС", title: "НАШ ДОМ" },
  fr: { eyebrow: "NOUVEAUX BUREAUX", title: "NOTRE MAISON" },
  it: { eyebrow: "NUOVI UFFICI", title: "LA NOSTRA SEDE" },
};

export default function OfficeGallery() {
  const { language } = useLanguage();
  const t = content[language as keyof typeof content] || content.es;

  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const { data: images = [], isLoading } = useQuery<OfficeImage[]>({
    queryKey: ["/api/office-images"],
  });

  const openLightbox = (index: number) => setLightboxIndex(index);
  const closeLightbox = () => setLightboxIndex(null);

  const goPrev = useCallback(() => {
    if (lightboxIndex === null) return;
    setLightboxIndex((lightboxIndex - 1 + images.length) % images.length);
  }, [lightboxIndex, images.length]);

  const goNext = useCallback(() => {
    if (lightboxIndex === null) return;
    setLightboxIndex((lightboxIndex + 1) % images.length);
  }, [lightboxIndex, images.length]);

  useEffect(() => {
    if (lightboxIndex === null) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [lightboxIndex, goPrev, goNext]);

  return (
    <section className="bg-background py-20" aria-label={t.title} data-testid="section-office-gallery">
      <div className="max-w-7xl mx-auto px-6">
        {/* Editorial header */}
        <div className="mb-12">
          <div className="w-12 h-px bg-primary mb-4" />
          <p className="text-primary text-[10px] tracking-[0.25em] uppercase mb-3">
            {t.eyebrow}
          </p>
          <h2 className="font-heading font-light text-foreground text-3xl md:text-4xl uppercase tracking-[0.12em]">
            {t.title}
          </h2>
        </div>

        {/* Skeleton */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="h-72 bg-muted animate-pulse"
                data-testid={`skeleton-gallery-${i}`}
              />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && images.length === 0 && (
          <div className="h-64 flex items-center justify-center border border-border" data-testid="gallery-empty">
            <p className="text-muted-foreground text-sm tracking-[0.1em] uppercase">
              {language === "es" ? "Galería próximamente" : "Gallery coming soon"}
            </p>
          </div>
        )}

        {/* Grid */}
        {!isLoading && images.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {images.map((img, idx) => (
              <div
                key={img.id}
                className="relative h-72 overflow-hidden group cursor-pointer"
                onClick={() => openLightbox(idx)}
                data-testid={`gallery-image-${img.id}`}
                role="button"
                tabIndex={0}
                aria-label={img.alt || img.altEs || "Office photo"}
                onKeyDown={(e) => e.key === "Enter" && openLightbox(idx)}
              >
                <img
                  src={img.imageUrl}
                  alt={img.alt || img.altEs || ""}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <ZoomIn className="text-white w-8 h-8" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && images.length > 0 && (
        <div
          className="fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center"
          onClick={closeLightbox}
          data-testid="lightbox-overlay"
          role="dialog"
          aria-modal="true"
        >
          {/* Close button */}
          <button
            className="absolute top-4 right-4 text-white/80 hover:text-white p-2"
            onClick={closeLightbox}
            aria-label="Close"
            data-testid="lightbox-close"
          >
            <X className="w-8 h-8" />
          </button>

          {/* Prev */}
          {images.length > 1 && (
            <button
              className="absolute left-4 text-white/80 hover:text-white p-2"
              onClick={(e) => { e.stopPropagation(); goPrev(); }}
              aria-label="Previous"
              data-testid="lightbox-prev"
            >
              <ChevronLeft className="w-10 h-10 text-primary" />
            </button>
          )}

          {/* Image */}
          <img
            src={images[lightboxIndex].imageUrl}
            alt={images[lightboxIndex].alt || images[lightboxIndex].altEs || ""}
            className="max-h-[85vh] max-w-[90vw] object-contain"
            onClick={(e) => e.stopPropagation()}
            data-testid="lightbox-image"
          />

          {/* Next */}
          {images.length > 1 && (
            <button
              className="absolute right-4 text-white/80 hover:text-white p-2"
              onClick={(e) => { e.stopPropagation(); goNext(); }}
              aria-label="Next"
              data-testid="lightbox-next"
            >
              <ChevronRight className="w-10 h-10 text-primary" />
            </button>
          )}

          {/* Counter */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/60 text-xs tracking-[0.2em] uppercase">
            {lightboxIndex + 1} / {images.length}
          </div>
        </div>
      )}
    </section>
  );
}
