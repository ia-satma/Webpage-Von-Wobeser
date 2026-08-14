import path from "node:path";
import { deletePersistentPrivateCv } from "../media/privateDocuments";
import { cleanExpiredPrivatePresentationInputs, removeUploadQuietly, resolvePrivateCvStoragePath } from "./uploads";
import { storage } from "../storage";
import { uploadsDir } from "../routes/uploadMiddleware";

export async function runSecurityMaintenance(): Promise<{
  sessions: number;
  loginEvents: number;
  contactSubmissions: number;
  careerApplications: number;
  presentationInputs: number;
}> {
  const sessions = await storage.cleanExpiredSessions();
  const security = await storage.cleanExpiredSecurityRecords();
  const contactSubmissions = await storage.deleteExpiredContactSubmissions();
  const expiredCareers = await storage.getExpiredCareerApplications();
  const deletableCareerIds: string[] = [];
  for (const application of expiredCareers) {
    const privatePath = resolvePrivateCvStoragePath(application.cvPath);
    if (privatePath) {
      try {
        await deletePersistentPrivateCv(application.cvPath);
        await removeUploadQuietly(privatePath);
        deletableCareerIds.push(application.id);
      } catch {
        console.error("[SecurityMaintenance] No se pudo retirar un CV privado; el registro se conservará para reintentar.");
      }
      continue;
    }
    if (application.cvPath.startsWith("/uploads/")) {
      const legacyPath = path.resolve(uploadsDir, path.basename(application.cvPath));
      if (path.dirname(legacyPath) === path.resolve(uploadsDir)) {
        await removeUploadQuietly(legacyPath);
      }
      deletableCareerIds.push(application.id);
      continue;
    }
    deletableCareerIds.push(application.id);
  }
  const careerApplications = await storage.deleteCareerApplications(deletableCareerIds);
  const presentationInputs = await cleanExpiredPrivatePresentationInputs();
  return {
    sessions,
    loginEvents: security.loginEvents,
    contactSubmissions,
    careerApplications,
    presentationInputs,
  };
}
