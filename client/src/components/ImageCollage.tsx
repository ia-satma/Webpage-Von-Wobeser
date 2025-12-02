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
  { id: "1", imageUrl: "https://vonwobeser.com/img/Collage/collage_01.jpg", alt: "Von Wobeser new office space", altEs: "Nuevo espacio de oficinas Von Wobeser", order: 1 },
  { id: "2", imageUrl: "https://vonwobeser.com/img/Collage/collage_02.jpg", alt: "Modern collaborative workspace", altEs: "Espacio de trabajo colaborativo moderno", order: 2 },
  { id: "3", imageUrl: "https://vonwobeser.com/img/Collage/collage_05.jpg", alt: "Office interior design", altEs: "Diseño interior de oficinas", order: 3 },
  { id: "4", imageUrl: "https://vonwobeser.com/img/Collage/collage_04.jpg", alt: "Meeting room with city views", altEs: "Sala de juntas con vistas a la ciudad", order: 4 },
  { id: "5", imageUrl: "https://vonwobeser.com/img/Collage/collage_07.jpg", alt: "Executive work areas", altEs: "Áreas de trabajo ejecutivas", order: 5 },
  { id: "6", imageUrl: "https://vonwobeser.com/img/Collage/05.jpg", alt: "Panoramic terrace view", altEs: "Vista de terraza panorámica", order: 6 },
  { id: "7", imageUrl: "https://vonwobeser.com/img/Collage/collage_09.jpg", alt: "Contemporary lounge area", altEs: "Área de descanso contemporánea", order: 7 },
  { id: "8", imageUrl: "https://vonwobeser.com/img/Collage/collage_08.jpg", alt: "Conference facilities", altEs: "Instalaciones de conferencias", order: 8 },
  { id: "9", imageUrl: "https://vonwobeser.com/img/Collage/collage_03.jpg", alt: "Modern workspace design", altEs: "Diseño moderno del espacio de trabajo", order: 9 },
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

  const errorMessage = language === "es" ? "Error al cargar galería" : "Failed to load gallery";

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
