declare module "@shared/postgres-config.mjs" {
  export interface PostgresConnectionOptions {
    readOnly?: boolean;
  }

  export interface PostgresConnectionConfig {
    connectionString: string;
    ssl: false | { rejectUnauthorized: true };
    options?: string;
  }

  export interface RedactedDatabaseIdentity {
    host: string;
    port: string;
    database: string;
    internal: boolean;
  }

  export function isReplitInternalHost(hostname: string): boolean;
  export function getPostgresConnectionConfig(
    connectionString: string,
    options?: PostgresConnectionOptions,
  ): PostgresConnectionConfig;
  export function redactedDatabaseIdentity(connectionString: string): RedactedDatabaseIdentity;
}
