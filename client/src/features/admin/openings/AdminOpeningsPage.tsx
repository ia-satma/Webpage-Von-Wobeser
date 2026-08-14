import { UserPlus } from "lucide-react";
import { CatalogEditorPage, type CatalogField } from "@/features/admin/catalog/CatalogEditorPage";

const fields: CatalogField[] = [
  { key: "titleEs", label: "Puesto en español", required: true },
  { key: "title", label: "Puesto en inglés", required: true },
  { key: "departmentEs", label: "Área en español" },
  { key: "department", label: "Área en inglés" },
  { key: "locationEs", label: "Ubicación en español" },
  { key: "location", label: "Ubicación en inglés" },
  { key: "type", label: "Tipo", type: "select", required: true, options: [
    { value: "full_time", label: "Tiempo completo" },
    { value: "part_time", label: "Medio tiempo" },
    { value: "internship", label: "Pasantía" },
    { value: "contract", label: "Contrato" },
  ] },
  { key: "level", label: "Nivel", type: "select", options: [
    { value: "entry", label: "Entrada" }, { value: "mid", label: "Medio" }, { value: "senior", label: "Senior" },
    { value: "associate", label: "Asociado" }, { value: "counsel", label: "Counsel" }, { value: "partner", label: "Socio" },
  ] },
  { key: "descriptionEs", label: "Descripción en español", type: "textarea", required: true, span: 2 },
  { key: "description", label: "Descripción en inglés", type: "textarea", required: true, span: 2 },
  { key: "requirementsEs", label: "Requisitos en español", type: "textarea", span: 2 },
  { key: "requirements", label: "Requisitos en inglés", type: "textarea", span: 2 },
  { key: "benefitsEs", label: "Beneficios en español", type: "textarea", span: 2 },
  { key: "benefits", label: "Beneficios en inglés", type: "textarea", span: 2 },
  { key: "applicationEmail", label: "Correo para postular", type: "email" },
  { key: "applicationUrl", label: "Liga para postular", type: "url" },
  { key: "expiresAt", label: "Vigente hasta", type: "date" },
  { key: "isUrgent", label: "Urgente", type: "checkbox" },
  { key: "published", label: "Publicada", type: "checkbox" },
];

export default function AdminOpeningsPage() {
  return <CatalogEditorPage title="Vacantes" description="Administra los puestos vigentes que pueden aparecer dentro de Talento." endpoint="/api/admin/jobs" icon={UserPlus} fields={fields}
    initial={{ title: "", titleEs: "", department: "", departmentEs: "", location: "", locationEs: "", type: "full_time", level: "entry", description: "", descriptionEs: "", requirements: "", requirementsEs: "", benefits: "", benefitsEs: "", applicationEmail: "", applicationUrl: "", expiresAt: null, isUrgent: false, published: false }}
    itemTitle={(item) => String(item.titleEs || item.title || "Vacante")}
    itemMeta={(item) => [item.departmentEs || item.department, item.locationEs || item.location].filter(Boolean).join(" · ")}
    helpId="openings" help="Talento mostrará Vacantes únicamente cuando exista al menos un puesto publicado cuya fecha de vigencia no haya vencido." />;
}
