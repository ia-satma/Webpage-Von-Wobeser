import { db } from "../server/db";
import { officeImages } from "../shared/schema";

const stockPhotos = [
  {
    imageUrl: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80",
    alt: "Modern collaborative office space with open floor plan",
    altEs: "Espacio de oficina colaborativo moderno con planta abierta",
    order: 1,
  },
  {
    imageUrl: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=800&q=80",
    alt: "Executive meeting room with panoramic views",
    altEs: "Sala de juntas ejecutiva con vistas panorámicas",
    order: 2,
  },
  {
    imageUrl: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&q=80",
    alt: "Corporate reception and lobby area",
    altEs: "Área de recepción y lobby corporativo",
    order: 3,
  },
  {
    imageUrl: "https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=800&q=80",
    alt: "Open workspace with natural light",
    altEs: "Espacio de trabajo abierto con luz natural",
    order: 4,
  },
  {
    imageUrl: "https://images.unsplash.com/photo-1600508774634-4e11d34730e2?w=800&q=80",
    alt: "Modern office with floor-to-ceiling windows",
    altEs: "Oficina moderna con ventanales del piso al techo",
    order: 5,
  },
  {
    imageUrl: "https://images.unsplash.com/photo-1497366858526-0766cadbe8fa?w=800&q=80",
    alt: "Contemporary office lounge and collaborative area",
    altEs: "Lounge y área colaborativa de oficina contemporánea",
    order: 6,
  },
  {
    imageUrl: "https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=800&q=80",
    alt: "Elegant interior design with modern furniture",
    altEs: "Diseño de interiores elegante con mobiliario moderno",
    order: 7,
  },
  {
    imageUrl: "https://images.unsplash.com/photo-1556761175-b413da4baf72?w=800&q=80",
    alt: "Team collaboration space with flexible seating",
    altEs: "Espacio de colaboración en equipo con asientos flexibles",
    order: 8,
  },
  {
    imageUrl: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=800&q=80",
    alt: "Modern law office corridor with glass partitions",
    altEs: "Pasillo de oficina de derecho moderno con divisiones de vidrio",
    order: 9,
  },
  {
    imageUrl: "https://images.unsplash.com/photo-1497215842964-222b430dc094?w=800&q=80",
    alt: "Executive boardroom with city skyline views",
    altEs: "Sala de consejo ejecutivo con vistas al horizonte de la ciudad",
    order: 10,
  },
];

async function main() {
  console.log("Clearing existing office images...");
  await db.delete(officeImages);

  console.log("Inserting 10 stock photo placeholders...");
  const inserted = await db.insert(officeImages).values(stockPhotos).returning();
  console.log(`Done — inserted ${inserted.length} records.`);

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
