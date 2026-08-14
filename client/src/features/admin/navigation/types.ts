import type {
  NavigationChildConfiguration,
  NavigationConfiguration,
  NavigationPresetId,
  NavigationPrimaryConfiguration,
} from "@shared/navigation";

export type NavigationStatus = "ready" | "no-content" | "hidden" | "future";

export type AdminNavigationChild = NavigationChildConfiguration & {
  order: number;
  pathEs: string;
  pathEn: string;
  canActivate: boolean;
  status: NavigationStatus;
  statusEn: NavigationStatus;
  reasonEs: string;
  reasonEn: string;
};

export type AdminNavigationItem = Omit<NavigationPrimaryConfiguration, "children"> & {
  order: number;
  pathEs: string;
  pathEn: string;
  canActivate: boolean;
  status: NavigationStatus;
  statusEn: NavigationStatus;
  reasonEs: string;
  reasonEn: string;
  children: AdminNavigationChild[];
};

export type NavigationPresetResponse = {
  id: NavigationPresetId;
  name: string;
  description: string;
  active: boolean;
  version: 2;
  revision: string;
  configuration: NavigationConfiguration;
  items: AdminNavigationItem[];
  fixed: {
    homeViaLogo: true;
    search: true;
    language: true;
    contact: true;
    searchLabelEn: string;
    searchLabelEs: string;
    contactLabelEn: string;
    contactLabelEs: string;
  };
};

export type NavigationResponse = NavigationPresetResponse & {
  activePreset: NavigationPresetId;
  stateRevision: string;
  presets: Record<NavigationPresetId, NavigationPresetResponse>;
};
