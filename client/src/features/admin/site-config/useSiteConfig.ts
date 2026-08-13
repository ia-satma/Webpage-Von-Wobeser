import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { useAdminAuth } from "@/lib/adminAuth";
import { useToast } from "@/hooks/use-toast";
import {
  fetchIndustryCarousel,
  fetchPracticeCarousel,
  fetchSiteConfig,
  optimizeHeroVideo,
  restorePreviousFirm,
  updateSiteConfig,
} from "./api";
import type {
  CarouselGroup,
  ConfigDraft,
  ConfigMap,
  SiteConfigConfirmation,
  SiteConfigField,
} from "./contracts";
import {
  buildConfigChanges,
  configMapToDraft,
  resolveSiteConfigSection,
  shouldOptimizeHeroVideo,
} from "./helpers";
import { PAGES } from "./registry";

export function useSiteConfig() {
  const { isAuthenticated, isLoading: authLoading } = useAdminAuth();
  const [, setLocation] = useLocation();
  const { section: rawSection } = useParams<{ section?: string }>();
  const section = resolveSiteConfigSection(rawSection);
  const page = PAGES[section];
  const { toast } = useToast();
  const [draft, setDraft] = useState<ConfigDraft>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [restoringPreviousFirm, setRestoringPreviousFirm] = useState(false);
  const [confirm, setConfirm] = useState<SiteConfigConfirmation | null>(null);
  const [homeTab, setHomeTab] = useState("0");

  useEffect(() => {
    if (!authLoading && !isAuthenticated) setLocation("/admin/login");
  }, [authLoading, isAuthenticated, setLocation]);

  useEffect(() => {
    if (rawSection === "resumen-firma") setLocation("/admin/site-config/firma");
  }, [rawSection, setLocation]);

  useEffect(() => setHomeTab("0"), [section]);

  const { data, isLoading, refetch } = useQuery<ConfigMap>({
    queryKey: ["/api/admin/site-config"],
    queryFn: fetchSiteConfig,
    enabled: isAuthenticated,
  });

  const practiceCarouselQuery = useQuery<CarouselGroup[]>({
    queryKey: ["/api/admin/practice-groups"],
    queryFn: fetchPracticeCarousel,
    enabled: isAuthenticated && section === "portada",
  });

  const industryCarouselQuery = useQuery<CarouselGroup[]>({
    queryKey: ["/api/admin/industry-groups"],
    queryFn: fetchIndustryCarousel,
    enabled: isAuthenticated && section === "portada",
  });

  useEffect(() => {
    if (data) setDraft(configMapToDraft(data));
  }, [data]);

  const set = (key: string, field: "value" | "valueEs", value: string) => {
    setDraft((current) => ({
      ...current,
      [key]: {
        ...(current[key] || { value: "", valueEs: "" }),
        [field]: value,
      },
    }));
  };

  const save = async (key: string) => {
    setSaving(key);
    try {
      const current = draft[key] || { value: "", valueEs: "" };
      if (shouldOptimizeHeroVideo(key, current.value)) {
        const optimized = await optimizeHeroVideo(current.value);
        if (!optimized.ok) {
          const body = await optimized.json().catch(() => ({}));
          toast({
            title: "No se pudo optimizar",
            description: body.error || "El video anterior continúa publicado.",
            variant: "destructive",
          });
          return;
        }
        const variants = await optimized.json();
        setDraft((existing) => ({
          ...existing,
          hero_video_master: { value: variants.masterPath, valueEs: variants.masterPath },
          hero_video: { value: variants.desktopPath, valueEs: variants.desktopPath },
          hero_video_mobile: { value: variants.mobilePath, valueEs: variants.mobilePath },
          hero_video_poster: { value: variants.posterPath, valueEs: variants.posterPath },
        }));
        toast({
          title: "Video optimizado y publicado",
          description: "Se generaron las versiones de escritorio, móvil y el póster sin modificar el archivo maestro.",
        });
        refetch();
        return;
      }
      const response = await updateSiteConfig(key, current.value, current.valueEs);
      if (response.ok) {
        const payload = await response.json().catch(() => ({}));
        if (key === "site_favicon") {
          window.dispatchEvent(new CustomEvent("vwb:favicon-change", {
            detail: typeof payload.favicon === "string" ? payload.favicon : current.value,
          }));
        }
        toast({ title: "Guardado", description: "El cambio ya está reflejado en el sitio." });
        refetch();
      } else {
        toast({ title: "Error al guardar", variant: "destructive" });
      }
    } catch (error) {
      toast({
        title: "Error al guardar",
        description: error instanceof Error ? error.message : "No fue posible conectar con el servidor.",
        variant: "destructive",
      });
    } finally {
      setSaving(null);
    }
  };

  const requestSave = (field: SiteConfigField) => {
    setConfirm({ key: field.key, changes: buildConfigChanges(field, data, draft) });
  };

  const restorePreviousFirmVersion = async () => {
    if (!data?.firm_landing_previous_version?.value) return;
    if (!window.confirm("¿Restaurar los textos de la versión anterior? La landing pública conservará sus rutas actuales.")) return;
    setRestoringPreviousFirm(true);
    try {
      const response = await restorePreviousFirm();
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.error || "No se pudo restaurar la versión anterior.");
      setDraft({});
      await refetch();
      toast({
        title: "Versión anterior restaurada",
        description: "Los textos se reflejaron en la landing institucional; las rutas antiguas siguen redirigiendo.",
      });
    } catch (error) {
      toast({
        title: "No se pudo restaurar",
        description: error instanceof Error ? error.message : "Inténtalo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setRestoringPreviousFirm(false);
    }
  };

  return {
    section,
    page,
    data,
    draft,
    saving,
    confirm,
    homeTab,
    isLoading,
    restoringPreviousFirm,
    practiceCarouselQuery,
    industryCarouselQuery,
    set,
    save,
    setConfirm,
    setHomeTab,
    requestSave,
    restorePreviousFirmVersion,
  };
}

export type SiteConfigController = ReturnType<typeof useSiteConfig>;
