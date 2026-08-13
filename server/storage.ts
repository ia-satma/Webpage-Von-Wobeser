import { db as defaultDatabase } from "./db";
import { createAuditRepository } from "./storage/repositories/auditRepository";
import { createCatalogRepository } from "./storage/repositories/catalogRepository";
import { createMediaRepository } from "./storage/repositories/mediaRepository";
import { createNewsRepository } from "./storage/repositories/newsRepository";
import { createPeopleRepository } from "./storage/repositories/peopleRepository";
import { createPublicContentRepository } from "./storage/repositories/publicContentRepository";
import { createSecurityRepository } from "./storage/repositories/securityRepository";
import { createSubmissionRepository } from "./storage/repositories/submissionRepository";
import { createTranslationRepository } from "./storage/repositories/translationRepository";
import type { IStorage } from "./storage/contracts";
import type { StorageDatabase } from "./storage/types";

export type {
  AdminLoginEventWithIdentity,
  IStorage,
} from "./storage/contracts";

type StorageRepositories =
  & ReturnType<typeof createAuditRepository>
  & ReturnType<typeof createCatalogRepository>
  & ReturnType<typeof createMediaRepository>
  & ReturnType<typeof createNewsRepository>
  & ReturnType<typeof createPeopleRepository>
  & ReturnType<typeof createPublicContentRepository>
  & ReturnType<typeof createSecurityRepository>
  & ReturnType<typeof createSubmissionRepository>
  & ReturnType<typeof createTranslationRepository>;

type RepositoryContractIsComplete = StorageRepositories extends IStorage ? true : false;
const repositoryContractIsComplete: RepositoryContractIsComplete = true;
void repositoryContractIsComplete;

function installRepository(
  target: object,
  repository: object,
  installedMethods: Set<string>,
): void {
  const prototype = Object.getPrototypeOf(repository) as object;

  for (const methodName of Object.getOwnPropertyNames(prototype)) {
    if (methodName === "constructor") continue;
    if (installedMethods.has(methodName)) {
      throw new Error(`Duplicate storage repository method: ${methodName}`);
    }

    const descriptor = Object.getOwnPropertyDescriptor(prototype, methodName);
    if (!descriptor) continue;

    Object.defineProperty(target, methodName, descriptor);
    installedMethods.add(methodName);
  }
}

/**
 * Backwards-compatible storage façade.
 *
 * Repositories own the domain operations, while callers continue to depend on
 * the same DatabaseStorage class and singleton exported by this module.
 */
export class DatabaseStorage {
  constructor(database: StorageDatabase = defaultDatabase) {
    const installedMethods = new Set<string>();
    const repositories = [
      createNewsRepository(database),
      createPeopleRepository(database),
      createSecurityRepository(database),
      createMediaRepository(database),
      createCatalogRepository(database),
      createTranslationRepository(database),
      createAuditRepository(database),
      createSubmissionRepository(database),
      createPublicContentRepository(database),
    ];

    for (const repository of repositories) {
      installRepository(this, repository, installedMethods);
    }
  }
}

export interface DatabaseStorage extends IStorage {
  getNewsStatusCounts(): Promise<{
    total: number;
    published: number;
    unpublished: number;
  }>;
}

export const storage = new DatabaseStorage();

const storageContract: IStorage = storage;
void storageContract;
