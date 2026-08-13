import { fmtValue, type Change } from "@/components/admin/ConfirmChangesDialog";
import type {
  CarouselGroup,
  ConfigDraft,
  ConfigMap,
  SiteConfigField,
} from "./contracts";
import { PAGES } from "./registry";

export function resolveSiteConfigSection(rawSection?: string): string {
  if (rawSection === "resumen-firma") return "firma";
  return rawSection && PAGES[rawSection] ? rawSection : "portada";
}

export function configMapToDraft(data: ConfigMap): ConfigDraft {
  const draft: ConfigDraft = {};
  for (const [key, value] of Object.entries(data)) {
    draft[key] = { value: value.value || "", valueEs: value.valueEs || "" };
  }
  return draft;
}

export function shouldOptimizeHeroVideo(key: string, value: string): boolean {
  return key === "hero_video_master"
    && /^\/(?:uploads|images)\/.+\.(?:mp4|webm|mov|ogv)$/i.test(value)
    && !/home-hero-(?:desktop|mobile)-v\d+\.mp4$/i.test(value)
    && !/\/hero-[a-f0-9]+-desktop\.mp4$/i.test(value);
}

export function buildConfigChanges(
  field: Pick<SiteConfigField, "key" | "label" | "bilingual">,
  data: ConfigMap | undefined,
  draft: ConfigDraft,
): Change[] {
  const original = (data && data[field.key]) || { value: "", valueEs: "" };
  const current = draft[field.key] || { value: "", valueEs: "" };
  const changes: Change[] = [];
  if (fmtValue(original.value) !== fmtValue(current.value)) {
    changes.push({
      label: field.bilingual ? `${field.label} (inglés)` : field.label,
      before: fmtValue(original.value),
      after: fmtValue(current.value),
    });
  }
  if (field.bilingual && fmtValue(original.valueEs) !== fmtValue(current.valueEs)) {
    changes.push({
      label: `${field.label} (español)`,
      before: fmtValue(original.valueEs),
      after: fmtValue(current.valueEs),
    });
  }
  return changes;
}

export function visibleCarouselItems(items?: CarouselGroup[]): CarouselGroup[] {
  return [...(items || [])]
    .filter((item) => item.published !== false && item.slug !== "german-desk")
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}
