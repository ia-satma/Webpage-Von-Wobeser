import { Link2 } from "lucide-react";
import { CatalogEditorPage, type CatalogField } from "@/features/admin/catalog/CatalogEditorPage";

const fields: CatalogField[] = [
  { key: "nameEs", label: "Nombre en español", required: true },
  { key: "name", label: "Nombre en inglés", required: true },
  { key: "type", label: "Tipo", type: "select", required: true, options: [
    { value: "network", label: "Red internacional" },
    { value: "association", label: "Asociación" },
    { value: "partnership", label: "Alianza estratégica" },
    { value: "correspondent", label: "Firma corresponsal" },
  ] },
  { key: "memberSince", label: "Miembro desde", type: "number" },
  { key: "descriptionEs", label: "Descripción en español", type: "textarea", span: 2 },
  { key: "description", label: "Descripción en inglés", type: "textarea", span: 2 },
  { key: "countryEs", label: "País en español" },
  { key: "country", label: "País en inglés" },
  { key: "websiteUrl", label: "Sitio web", type: "url" },
  { key: "logoUrl", label: "Logotipo", type: "url" },
  { key: "order", label: "Orden", type: "number" },
  { key: "isFeatured", label: "Destacada", type: "checkbox" },
  { key: "published", label: "Publicada", type: "checkbox" },
];

export default function AdminAlliancesPage() {
  return <CatalogEditorPage title="Alianzas internacionales" description="Administra las redes y alianzas que alimentan Alcance internacional." endpoint="/api/admin/alliances" icon={Link2} fields={fields}
    initial={{ name: "", nameEs: "", type: "network", description: "", descriptionEs: "", country: "", countryEs: "", websiteUrl: "", logoUrl: "", memberSince: null, isFeatured: false, published: false, order: 0 }}
    itemTitle={(item) => String(item.nameEs || item.name || "Alianza")}
    itemMeta={(item) => [item.countryEs || item.country, item.memberSince].filter(Boolean).join(" · ")}
    helpId="alliances" help="La página de Alcance internacional solo podrá activarse cuando exista texto bilingüe aprobado y al menos una alianza publicada." />;
}
