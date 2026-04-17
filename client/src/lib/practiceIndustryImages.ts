const UNSPLASH_PARAMS = "w=1200&h=900&fit=crop&q=80&auto=format";

const u = (id: string) => `https://images.unsplash.com/${id}?${UNSPLASH_PARAMS}`;

export const PRACTICE_IMAGES: Record<string, string> = {
  "corporate-ma": u("photo-1486406146926-c627a92ad1ab"),
  "antitrust-competition": u("photo-1521791136064-7986c2920216"),
  "arbitration": u("photo-1589994965851-a8f479c573a9"),
  "litigation": u("photo-1505664194779-8beaceb93744"),
  "investigations-anticorruption": u("photo-1450101499163-c8848c66ca85"),
  "bankruptcy-restructuring": u("photo-1554224155-6726b3ff858f"),
  "banking-finance": u("photo-1554224154-26032ffc0d07"),
  "energy-natural-resources": u("photo-1466611653911-95081537e5b7"),
  "esg": u("photo-1542601906990-b4d3fb778b09"),
  "real-estate": u("photo-1486325212027-8081e485255e"),
  "intellectual-property": u("photo-1532153975070-2e9ab71f1b14"),
  "labor-employment": u("photo-1521737604893-d14cc237f11d"),
  "tax": u("photo-1554224155-8d04cb21cd6c"),
  "international-trade": u("photo-1493946740644-2d8a1f1a6aff"),
  "telecommunications-media-technology": u("photo-1518770660439-4636190af475"),
  "environmental": u("photo-1441829266145-6d4bfb7a3d1e"),
  "administrative-law": u("photo-1505664194779-8beaceb93744"),
  "german-desk": u("photo-1528728329032-2972f65dfb3f"),
};

export const INDUSTRY_IMAGES: Record<string, string> = {
  "automotive-mobility-manufacturing": u("photo-1492144534655-ae79c964c9d7"),
  "consumer-goods": u("photo-1556742049-0cfed4f6a45d"),
  "energy-natural-resources-industry": u("photo-1466611653911-95081537e5b7"),
  "energy-natural-resources": u("photo-1466611653911-95081537e5b7"),
  "pharmaceutical-life-sciences": u("photo-1576091160399-112ba8d25d1d"),
  "financial-services": u("photo-1611974789855-9c2a0a7236a3"),
  "real-estate-industry": u("photo-1486325212027-8081e485255e"),
  "real-estate": u("photo-1486325212027-8081e485255e"),
  "technology-industry": u("photo-1518770660439-4636190af475"),
  "technology": u("photo-1518770660439-4636190af475"),
};

const FALLBACK_IMAGE = u("photo-1450101499163-c8848c66ca85");

export function getPracticeImage(slug: string, override?: string | null): string {
  if (override && override.trim().length > 0) return override;
  return PRACTICE_IMAGES[slug] || FALLBACK_IMAGE;
}

export function getIndustryImage(slug: string, override?: string | null): string {
  if (override && override.trim().length > 0) return override;
  return INDUSTRY_IMAGES[slug] || FALLBACK_IMAGE;
}
