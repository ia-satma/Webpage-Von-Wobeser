import type { Request, Response } from "express";
import type { Lang } from "../htmlPipeline";

export function createLegacyRedirect(langOf: (req: Request) => Lang) {
  return (target: string, lang?: Lang) => (req: Request, res: Response) => {
    const url = new URL(target, "https://local.invalid");
    const effectiveLang = lang || langOf(req);
    if (effectiveLang === "en" && !/^\/(?:our-firm|contact|careers|capabilities|publications|privacy|about)(?:\/|$)/.test(target)) {
      url.searchParams.set("lang", "en");
    }
    for (const key of ["q", "page"]) {
      const value = req.query[key];
      if (typeof value === "string" && value) url.searchParams.set(key, value);
    }
    res.redirect(301, url.pathname + url.search);
  };
}
