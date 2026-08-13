import type { Express, Request, Response } from "express";
import { z, ZodError } from "zod";
import {
  insertAllianceSchema,
  insertAwardSchema,
  insertEventSchema,
  insertIndustryGroupSchema,
  insertJobOpeningSchema,
  insertOfficeSchema,
  insertPracticeGroupSchema,
  insertRankingSchema,
  insertRepresentativeClientSchema,
  insertTestimonialSchema,
} from "@shared/schema";
import { authMiddleware, requirePermission } from "../auth";
import { sanitizeFields } from "../mirror/sanitize";
import { invalidatePublicPageCache } from "../mirror/pageCache";
import { rankingOrderRequestSchema } from "../rankings/order";
import { storage } from "../storage";

type CatalogConfig = {
  path: string;
  schema: z.AnyZodObject;
  list: () => Promise<unknown>;
  create: (data: any) => Promise<unknown>;
  update: (id: string, data: any) => Promise<unknown>;
  remove: (id: string) => Promise<boolean>;
  errors: {
    list: string;
    create: string;
    update: string;
    remove: string;
  };
  notFound: string;
  sanitize?: string[];
  createStatus?: number;
  invalidatePublicCache?: boolean;
  registerAfterList?: () => void;
};

function validationError(res: Response, error: unknown): boolean {
  if (!(error instanceof ZodError)) return false;
  res.status(400).json({ error: "Validation failed", details: error.errors });
  return true;
}

function registerCatalogCrud(app: Express, config: CatalogConfig): void {
  const secured = [authMiddleware, requirePermission("content")] as const;
  const invalidate = () => {
    if (config.invalidatePublicCache) invalidatePublicPageCache();
  };

  app.get(config.path, ...secured, async (_req: Request, res: Response) => {
    try {
      res.json(await config.list());
    } catch (error) {
      console.error(config.errors.list, error);
      res.status(500).json({ error: config.errors.list });
    }
  });

  config.registerAfterList?.();

  app.post(config.path, ...secured, async (req: Request, res: Response) => {
    try {
      const data = config.schema.parse(req.body);
      if (config.sanitize) sanitizeFields(data, config.sanitize);
      const created = await config.create(data);
      invalidate();
      res.status(config.createStatus ?? 200).json(created);
    } catch (error) {
      if (validationError(res, error)) return;
      console.error(config.errors.create, error);
      res.status(500).json({ error: config.errors.create });
    }
  });

  app.put(`${config.path}/:id`, ...secured, async (req: Request, res: Response) => {
    try {
      const data = config.schema.partial().parse(req.body);
      if (config.sanitize) sanitizeFields(data, config.sanitize);
      const updated = await config.update(req.params.id, data);
      if (!updated) return res.status(404).json({ error: config.notFound });
      invalidate();
      res.json(updated);
    } catch (error) {
      if (validationError(res, error)) return;
      console.error(config.errors.update, error);
      res.status(500).json({ error: config.errors.update });
    }
  });

  app.delete(`${config.path}/:id`, ...secured, async (req: Request, res: Response) => {
    try {
      const deleted = await config.remove(req.params.id);
      if (!deleted) return res.status(404).json({ error: config.notFound });
      invalidate();
      res.json({ success: true });
    } catch (error) {
      console.error(config.errors.remove, error);
      res.status(500).json({ error: config.errors.remove });
    }
  });
}

export function registerAdminCatalogRoutes(app: Express): void {
  registerCatalogCrud(app, {
    path: "/api/admin/practice-groups",
    schema: insertPracticeGroupSchema,
    list: () => storage.getPracticeGroups(),
    create: (data) => storage.createPracticeGroup(data),
    update: (id, data) => storage.updatePracticeGroup(id, data),
    remove: (id) => storage.deletePracticeGroup(id),
    errors: {
      list: "Failed to fetch practice groups",
      create: "Failed to create practice group",
      update: "Failed to update practice group",
      remove: "Failed to delete practice group",
    },
    notFound: "Practice group not found",
    sanitize: ["description", "descriptionEs", "fullDescription", "fullDescriptionEs"],
    createStatus: 201,
  });

  registerCatalogCrud(app, {
    path: "/api/admin/industry-groups",
    schema: insertIndustryGroupSchema,
    list: () => storage.getIndustryGroups(),
    create: (data) => storage.createIndustryGroup(data),
    update: (id, data) => storage.updateIndustryGroup(id, data),
    remove: (id) => storage.deleteIndustryGroup(id),
    errors: {
      list: "Failed to fetch industry groups",
      create: "Failed to create industry group",
      update: "Failed to update industry group",
      remove: "Failed to delete industry group",
    },
    notFound: "Industry group not found",
    sanitize: ["description", "descriptionEs", "fullDescription", "fullDescriptionEs"],
    createStatus: 201,
  });

  registerCatalogCrud(app, {
    path: "/api/admin/events",
    schema: insertEventSchema,
    list: () => storage.getEvents(),
    create: (data) => storage.createEvent(data),
    update: (id, data) => storage.updateEvent(id, data),
    remove: (id) => storage.deleteEvent(id),
    errors: {
      list: "Failed to fetch events",
      create: "Failed to create event",
      update: "Failed to update event",
      remove: "Failed to delete event",
    },
    notFound: "Event not found",
    sanitize: ["description", "descriptionEs"],
  });

  registerCatalogCrud(app, {
    path: "/api/admin/rankings",
    schema: insertRankingSchema,
    list: () => storage.getRankings(),
    create: (data) => storage.createRanking(data),
    update: (id, data) => storage.updateRanking(id, data),
    remove: (id) => storage.deleteRanking(id),
    errors: {
      list: "Failed to fetch rankings",
      create: "Failed to create ranking",
      update: "Failed to update ranking",
      remove: "Failed to delete ranking",
    },
    notFound: "Ranking not found",
    invalidatePublicCache: true,
    registerAfterList: () => {
      app.put(
        "/api/admin/rankings/order",
        authMiddleware,
        requirePermission("content"),
        async (req: Request, res: Response) => {
          try {
            const data = rankingOrderRequestSchema.parse(req.body);
            const result = await storage.reorderRankings(data.ids);
            if (!result.ok) {
              return res.status(409).json({
                error: "Rankings changed while they were being reordered",
                code: "RANKINGS_ORDER_STALE",
              });
            }
            invalidatePublicPageCache();
            res.json(result.rankings);
          } catch (error) {
            if (validationError(res, error)) return;
            console.error("Reorder rankings error:", error);
            res.status(500).json({ error: "Failed to reorder rankings" });
          }
        },
      );
    },
  });

  const simpleCatalogs: CatalogConfig[] = [
    {
      path: "/api/admin/awards",
      schema: insertAwardSchema,
      list: () => storage.getAwards(),
      create: (data) => storage.createAward(data),
      update: (id, data) => storage.updateAward(id, data),
      remove: (id) => storage.deleteAward(id),
      errors: { list: "Failed to fetch awards", create: "Failed to create award", update: "Failed to update award", remove: "Failed to delete award" },
      notFound: "Award not found",
    },
    {
      path: "/api/admin/clients",
      schema: insertRepresentativeClientSchema,
      list: () => storage.getRepresentativeClients(),
      create: (data) => storage.createRepresentativeClient(data),
      update: (id, data) => storage.updateRepresentativeClient(id, data),
      remove: (id) => storage.deleteRepresentativeClient(id),
      errors: { list: "Failed to fetch clients", create: "Failed to create client", update: "Failed to update client", remove: "Failed to delete client" },
      notFound: "Client not found",
    },
    {
      path: "/api/admin/testimonials",
      schema: insertTestimonialSchema,
      list: () => storage.getTestimonials(),
      create: (data) => storage.createTestimonial(data),
      update: (id, data) => storage.updateTestimonial(id, data),
      remove: (id) => storage.deleteTestimonial(id),
      errors: { list: "Failed to fetch testimonials", create: "Failed to create testimonial", update: "Failed to update testimonial", remove: "Failed to delete testimonial" },
      notFound: "Testimonial not found",
    },
    {
      path: "/api/admin/jobs",
      schema: insertJobOpeningSchema,
      list: () => storage.getJobOpenings(),
      create: (data) => storage.createJobOpening(data),
      update: (id, data) => storage.updateJobOpening(id, data),
      remove: (id) => storage.deleteJobOpening(id),
      errors: { list: "Failed to fetch jobs", create: "Failed to create job", update: "Failed to update job", remove: "Failed to delete job" },
      notFound: "Job not found",
    },
    {
      path: "/api/admin/offices",
      schema: insertOfficeSchema,
      list: () => storage.getOffices(),
      create: (data) => storage.createOffice(data),
      update: (id, data) => storage.updateOffice(id, data),
      remove: (id) => storage.deleteOffice(id),
      errors: { list: "Failed to fetch offices", create: "Failed to create office", update: "Failed to update office", remove: "Failed to delete office" },
      notFound: "Office not found",
    },
    {
      path: "/api/admin/alliances",
      schema: insertAllianceSchema,
      list: () => storage.getAlliances(),
      create: (data) => storage.createAlliance(data),
      update: (id, data) => storage.updateAlliance(id, data),
      remove: (id) => storage.deleteAlliance(id),
      errors: { list: "Failed to fetch alliances", create: "Failed to create alliance", update: "Failed to update alliance", remove: "Failed to delete alliance" },
      notFound: "Alliance not found",
    },
  ];

  simpleCatalogs.forEach((config) => registerCatalogCrud(app, config));
}
