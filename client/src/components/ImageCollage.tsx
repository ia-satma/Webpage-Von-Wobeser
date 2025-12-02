import { motion } from "framer-motion";
import { useState } from "react";
import { X, AlertCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import type { OfficeImage } from "@shared/schema";

interface ImageCollageProps {
  language: "es" | "en";
}

const fallbackImages: OfficeImage[] = [
  { id: "1", imageUrl: "https://images.unsplash.com/photo-1497366216548-37526070297c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80", alt: "Modern office collaborative workspace", altEs: "Espacio de trabajo colaborativo moderno", order: 1 },
  { id: "2", imageUrl: "https://images.unsplash.com/photo-1497366811353-6870744d04b2?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80", alt: "Office meeting room with city views", altEs: "Sala de juntas con vistas a la ciudad", order: 2 },
  { id: "3", imageUrl: "https://images.unsplash.com/photo-1524758631624-e2822e304c36?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80", alt: "Modern reception area", altEs: "\u00c1rea de recepci\u00f3n moderna", order: 3 },
  { id: "4", imageUrl: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80", alt: "Open plan office space", altEs: "Espacio de oficina abierto", order: 4 },
  { id: "5", imageUrl: "https://images.unsplash.com/photo-1604328698692-f76ea9498e76?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80", alt: "Architectural details", altEs: "Detalles arquitect\u00f3nicos", order: 5 },
  { id: "6", imageUrl: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80", alt: "Panoramic terrace view", altEs: "Vista de terraza panor\u00e1mica", order: 6 },
  { id: "7", imageUrl: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80", alt: "Contemporary lounge area", altEs: "\u00c1rea de descanso contempor\u00e1nea", order: 7 },
  { id: "8", imageUrl: "https://images.unsplash.com/photo-1497215842964-222b430dc094?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80", alt: "Executive conference room", altEs: "Sala de conferencias ejecutiva", order: 8 },
  { id: "9", imageUrl: "https://images.unsplash.com/photo-1600566752355-35792bedcfea?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80", alt: "Modern workspace design", altEs: "Dise\u00f1o moderno del espacio de trabajo", order: 9 },
];

const getSpanClass = (index: number): string => {
  if (index === 0 || index === 5 || index === 6) return "row-span-2";
  return "";
};

export default function ImageCollage({ language }: ImageCollageProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  
  const { data: images, isLoading, error } = useQuery<OfficeImage[]>({
    queryKey: ["/api/office-images"],
  });

  const displayImages = images && images.length > 0 ? images : fallbackImages;

  const errorMessage = language === "es" ? "Error al cargar galer\u00eda" : "Failed to load gallery";

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.4 },
    },
  };

  if (error) {
    return (
      <section id="gallery" className="py-20 lg:py-28 bg-gray-50 dark:bg-gray-800" data-testid="section-gallery">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 text-center">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400" data-testid="text-gallery-error">{errorMessage}</p>
        </div>
      </section>
    );
  }

  return (
    <>
      <section
        id="gallery"
        className="py-20 lg:py-28 bg-gray-50 dark:bg-gray-800"
        data-testid="section-gallery"
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
                <Skeleton
                  key={i}
                  className={`aspect-square ${getSpanClass(i - 1) ? "h-full" : ""} ${getSpanClass(i - 1)}`}
                  data-testid={`skeleton-gallery-${i}`}
                />
              ))}
            </div>
          ) : (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4"
            >
              {displayImages.map((image, index) => (
                <motion.button
                  key={image.id}
                  variants={itemVariants}
                  className={`relative overflow-hidden group cursor-pointer ${getSpanClass(index)}`}
                  onClick={() => setSelectedImage(image.imageUrl)}
                  data-testid={`button-gallery-image-${image.id}`}
                >
                  <div className={`aspect-square ${getSpanClass(index) ? "h-full" : ""}`}>
                    <img
                      src={image.imageUrl}
                      alt={language === "es" ? image.altEs : image.alt}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      loading="lazy"
                      data-testid={`img-gallery-${image.id}`}
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300" />
                  </div>
                </motion.button>
              ))}
            </motion.div>
          )}
        </div>
      </section>

      {selectedImage && (
        <div
          className="fixed inset-0 z-[70] bg-black/90 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
          data-testid="modal-lightbox"
        >
          <button
            className="absolute top-6 right-6 text-white/80 hover:text-white transition-colors"
            onClick={() => setSelectedImage(null)}
            data-testid="button-close-lightbox"
          >
            <X className="w-8 h-8" />
          </button>
          <motion.img
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            src={selectedImage}
            alt="Selected image"
            className="max-w-full max-h-[90vh] object-contain"
            onClick={(e) => e.stopPropagation()}
            data-testid="img-lightbox"
          />
        </div>
      )}
    </>
  );
}
