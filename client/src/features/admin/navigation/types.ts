import type {
  NavigationChildConfiguration,
  NavigationConfiguration,
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

export type NavigationResponse = {
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
