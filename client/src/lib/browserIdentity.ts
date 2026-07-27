const SAFE_FAVICON = /^(?:\/(?!\/)|https:\/\/)/i;

/** Actualiza los íconos del documento sin alterar los píxeles del archivo elegido. */
export function applyBrowserFavicon(pathOrUrl: string): void {
  const favicon = String(pathOrUrl || "").trim();
  if (!SAFE_FAVICON.test(favicon)) return;

  document
    .querySelectorAll('link[rel~="icon"], link[rel="apple-touch-icon"]')
    .forEach((element) => element.remove());

  const icon = document.createElement("link");
  icon.rel = "icon";
  icon.href = favicon;
  icon.setAttribute("sizes", "any");
  document.head.append(icon);

  const apple = document.createElement("link");
  apple.rel = "apple-touch-icon";
  apple.href = favicon;
  document.head.append(apple);

  let manifest = document.querySelector<HTMLLinkElement>('link[rel="manifest"]');
  if (!manifest) {
    manifest = document.createElement("link");
    manifest.rel = "manifest";
    document.head.append(manifest);
  }
  manifest.href = "/api/public/manifest.webmanifest";
}

export async function loadBrowserFavicon(): Promise<void> {
  const response = await fetch("/api/public/site-branding", {
    credentials: "same-origin",
    headers: { Accept: "application/json" },
  });
  if (!response.ok) return;
  const payload = await response.json();
  applyBrowserFavicon(payload?.favicon);
}
