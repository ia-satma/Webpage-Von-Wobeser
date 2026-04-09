import { motion } from "framer-motion";
import { useState } from "react";
import { X, AlertCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/contexts/LanguageContext";
import type { OfficeImage, LanguageCode } from "@shared/schema";

const fallbackImages: OfficeImage[] = [
  { id: "1", imageUrl: "https://vonwobeser.com/img/Collage/collage_01.jpg", alt: "Von Wobeser new office space with modern open floor plan", altEs: "Nuevo espacio de oficinas Von Wobeser con planta abierta moderna", order: 1 },
  { id: "2", imageUrl: "https://vonwobeser.com/img/Collage/collage_02.jpg", alt: "Modern collaborative workspace with natural lighting", altEs: "Espacio de trabajo colaborativo moderno con iluminación natural", order: 2 },
  { id: "3", imageUrl: "https://vonwobeser.com/img/Collage/collage_05.jpg", alt: "Professional office interior design with contemporary furniture", altEs: "Diseño interior de oficinas profesional con mobiliario contemporáneo", order: 3 },
  { id: "4", imageUrl: "https://vonwobeser.com/img/Collage/collage_04.jpg", alt: "Executive meeting room with panoramic city views", altEs: "Sala de juntas ejecutiva con vistas panorámicas a la ciudad", order: 4 },
  { id: "5", imageUrl: "https://vonwobeser.com/img/Collage/collage_07.jpg", alt: "Executive work areas with ergonomic design", altEs: "Áreas de trabajo ejecutivas con diseño ergonómico", order: 5 },
  { id: "6", imageUrl: "https://vonwobeser.com/img/Collage/05.jpg", alt: "Panoramic terrace view overlooking Mexico City skyline", altEs: "Vista de terraza panorámica con horizonte de Ciudad de México", order: 6 },
  { id: "7", imageUrl: "https://vonwobeser.com/img/Collage/collage_09.jpg", alt: "Contemporary lounge area for informal meetings", altEs: "Área de descanso contemporánea para reuniones informales", order: 7 },
  { id: "8", imageUrl: "https://vonwobeser.com/img/Collage/collage_08.jpg", alt: "State-of-the-art conference facilities", altEs: "Instalaciones de conferencias de última generación", order: 8 },
  { id: "9", imageUrl: "https://vonwobeser.com/img/Collage/collage_03.jpg", alt: "Modern workspace design promoting productivity", altEs: "Diseño moderno del espacio de trabajo que promueve la productividad", order: 9 },
];

const getSpanClass = (index: number): string => {
  if (index === 0 || index === 5 || index === 6) return "row-span-2";
  return "";
};

const generateSrcSet = (imageUrl: string): string => {
  const baseWidth = 400;
  const sizes = [baseWidth, baseWidth * 1.5, baseWidth * 2];
  
  if (imageUrl.includes('vonwobeser.com')) {
    return sizes
      .map(size => `${imageUrl} ${size}w`)
      .join(', ');
  }
  
  return "";
};

const getSizes = (index: number): string => {
  const isSpanning = index === 0 || index === 5 || index === 6;
  if (isSpanning) {
    return "(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 300px";
  }
  return "(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 250px";
};

type LabelContent = {
  errorMessage: string;
  galleryLabel: string;
  viewFullSize: string;
  closeModal: string;
  loadingGallery: string;
  selectedImage: string;
};

const labels: Record<LanguageCode, LabelContent> = {
  en: {
    errorMessage: "Failed to load gallery",
    galleryLabel: "Office image gallery showcasing Von Wobeser y Sierra facilities",
    viewFullSize: "View full size image",
    closeModal: "Close image viewer",
    loadingGallery: "Loading gallery",
    selectedImage: "Selected gallery image",
  },
  es: {
    errorMessage: "Error al cargar galería",
    galleryLabel: "Galería de imágenes de las instalaciones de Von Wobeser y Sierra",
    viewFullSize: "Ver imagen en tamaño completo",
    closeModal: "Cerrar visor de imágenes",
    loadingGallery: "Cargando galería",
    selectedImage: "Imagen seleccionada de la galería",
  },
  de: {
    errorMessage: "Galerie konnte nicht geladen werden",
    galleryLabel: "Bildergalerie der Einrichtungen von Von Wobeser y Sierra",
    viewFullSize: "Bild in voller Größe anzeigen",
    closeModal: "Bildansicht schließen",
    loadingGallery: "Galerie wird geladen",
    selectedImage: "Ausgewähltes Galeriebild",
  },
  zh: {
    errorMessage: "无法加载图库",
    galleryLabel: "Von Wobeser y Sierra 办公设施图库",
    viewFullSize: "查看完整尺寸图片",
    closeModal: "关闭图片查看器",
    loadingGallery: "正在加载图库",
    selectedImage: "选中的图库图片",
  },
  ko: {
    errorMessage: "갤러리를 불러올 수 없습니다",
    galleryLabel: "Von Wobeser y Sierra 시설 이미지 갤러리",
    viewFullSize: "전체 크기 이미지 보기",
    closeModal: "이미지 뷰어 닫기",
    loadingGallery: "갤러리 로딩 중",
    selectedImage: "선택된 갤러리 이미지",
  },
  ja: {
    errorMessage: "ギャラリーを読み込めませんでした",
    galleryLabel: "Von Wobeser y Sierra 施設のイメージギャラリー",
    viewFullSize: "フルサイズの画像を表示",
    closeModal: "画像ビューアを閉じる",
    loadingGallery: "ギャラリーを読み込み中",
    selectedImage: "選択されたギャラリー画像",
  },
  ar: {
    errorMessage: "فشل في تحميل المعرض",
    galleryLabel: "معرض صور مرافق Von Wobeser y Sierra",
    viewFullSize: "عرض الصورة بالحجم الكامل",
    closeModal: "إغلاق عارض الصور",
    loadingGallery: "جاري تحميل المعرض",
    selectedImage: "صورة المعرض المحددة",
  },
  ru: {
    errorMessage: "Не удалось загрузить галерею",
    galleryLabel: "Фотогалерея офисных помещений Von Wobeser y Sierra",
    viewFullSize: "Просмотреть изображение в полном размере",
    closeModal: "Закрыть просмотр изображения",
    loadingGallery: "Загрузка галереи",
    selectedImage: "Выбранное изображение галереи",
  },
  fr: {
    errorMessage: "Échec du chargement de la galerie",
    galleryLabel: "Galerie d'images des installations de Von Wobeser y Sierra",
    viewFullSize: "Voir l'image en taille réelle",
    closeModal: "Fermer la visionneuse d'images",
    loadingGallery: "Chargement de la galerie",
    selectedImage: "Image de galerie sélectionnée",
  },
  it: {
    errorMessage: "Impossibile caricare la galleria",
    galleryLabel: "Galleria immagini delle strutture Von Wobeser y Sierra",
    viewFullSize: "Visualizza immagine a dimensione intera",
    closeModal: "Chiudi visualizzatore immagini",
    loadingGallery: "Caricamento galleria",
    selectedImage: "Immagine della galleria selezionata",
  },
};

export default function ImageCollage() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const { language } = useLanguage();
  
  const { data: images, isLoading, error } = useQuery<OfficeImage[]>({
    queryKey: ["/api/office-images"],
  });

  const displayImages = images && images.length >= 9 ? images : fallbackImages;

  const t = labels[language] || labels.en;

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

  const getAltText = (image: OfficeImage): string => {
    if (language === "es") return image.altEs;
    return image.alt;
  };

  if (error) {
    return (
      <section 
        id="gallery" 
        className="py-20 lg:py-28 bg-muted" 
        data-testid="section-gallery"
        aria-label={t.galleryLabel}
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-12 text-center">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" aria-hidden="true" />
          <p className="text-muted-foreground" data-testid="text-gallery-error" role="alert">{t.errorMessage}</p>
        </div>
      </section>
    );
  }

  return (
    <>
      <section
        id="gallery"
        className="py-20 lg:py-28 bg-muted"
        data-testid="section-gallery"
        aria-label={t.galleryLabel}
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          {isLoading ? (
            <div 
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4"
              role="status"
              aria-label={t.loadingGallery}
            >
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
              role="list"
            >
              {displayImages.map((image, index) => {
                const altText = getAltText(image);
                const srcSet = generateSrcSet(image.imageUrl);
                const sizes = getSizes(index);
                
                return (
                  <motion.button
                    key={image.id}
                    variants={itemVariants}
                    className={`relative overflow-hidden group cursor-pointer ${getSpanClass(index)}`}
                    onClick={() => setSelectedImage(image.imageUrl)}
                    data-testid={`button-gallery-image-${image.id}`}
                    aria-label={`${t.viewFullSize}: ${altText}`}
                    role="listitem"
                  >
                    <div className={`img-fallback aspect-square ${getSpanClass(index) ? "h-full" : ""}`}>
                      <img
                        src={image.imageUrl}
                        alt={altText}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        loading="lazy"
                        decoding="async"
                        srcSet={srcSet || undefined}
                        sizes={srcSet ? sizes : undefined}
                        width={400}
                        height={getSpanClass(index) ? 800 : 400}
                        data-testid={`img-gallery-${image.id}`}
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300" aria-hidden="true" />
                    </div>
                  </motion.button>
                );
              })}
            </motion.div>
          )}
        </div>
      </section>

      {selectedImage && (
        <div
          className="fixed inset-0 z-[70] bg-black/90 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
          data-testid="modal-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={t.viewFullSize}
        >
          <button
            className="absolute top-6 right-6 text-white/90 hover:text-white transition-colors"
            onClick={() => setSelectedImage(null)}
            data-testid="button-close-lightbox"
            aria-label={t.closeModal}
          >
            <X className="w-8 h-8" aria-hidden="true" />
          </button>
          <motion.img
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            src={selectedImage}
            alt={t.selectedImage}
            className="max-w-full max-h-[90vh] object-contain"
            onClick={(e) => e.stopPropagation()}
            data-testid="img-lightbox"
            loading="eager"
          />
        </div>
      )}
    </>
  );
}
