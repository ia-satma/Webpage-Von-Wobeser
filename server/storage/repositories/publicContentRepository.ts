import { type SiteContent, type Stat } from "@shared/schema";
import type { StorageDatabase } from "../types";

const siteContent: SiteContent = {
  heroTitle: "WE GO WHERE CLIENTS NEED US",
  heroSubtitle: "New offices of Von Wobeser y Sierra",
  visionTitle: "A vision of the future, collaboration, and excellence",
  visionText: "Von Wobeser y Sierra has completed the transition to its new offices in the dynamic Campos Elíseos area in Polanco.",
  locationTitle: "New office address",
  locationText: "Torre SOMA Chapultepec Piso 18. Campos Elíseos 204, Polanco",
  statsTitle: "Collaboration, technology and well-being",
  quoteText: "The relocation of our offices responds to two inseparable goals: first, being closer to our clients; and second, offering our team a space designed to foster collaboration and productivity.",
  quoteAuthor: "Fernando Carreño",
  quoteRole: "Partner and member of the Executive Committee",
  address: "Torre SOMA Chapultepec Piso 18. Campos Elíseos 204, Polanco, C.P. 11560, Ciudad de México",
  phone: "+52 55 5258 1000",
  email: "info@vonwobeser.com",
};

const stats: Stat[] = [
  { value: "5,300", label: "square meters", labelEs: "metros cuadrados" },
  { value: "300+", label: "workstations", labelEs: "estaciones de trabajo" },
  { value: "16", label: "meeting rooms", labelEs: "salas de juntas" },
  { value: "6", label: "levels", labelEs: "niveles" },
];

export function createPublicContentRepository(db: StorageDatabase) {
  void db;
  class PublicContentRepository {
    getSiteContent(): SiteContent {
      return siteContent;
    }

    getStats(): Stat[] {
      return stats;
    }
  }

  return new PublicContentRepository();
}
