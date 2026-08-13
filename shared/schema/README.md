# Shared schema modules

`shared/schema.ts` is the stable public facade. Application code must continue
importing from `@shared/schema`; domain files are internal implementation details.

Drizzle Kit reads `shared/schema/**/*.ts` directly. Keep table declarations in
one of the domain modules and re-export every public value or type through the
facade. Internal dependencies must remain one-way:

- `people.ts` may import structured types from `foundation.ts`.
- `media.ts` may import `news` for generated-media foreign keys.
- `agentsAudits.ts` may import `news` and `adminUsers` for copy-history foreign keys.
- No domain module may import the facade.

Before accepting a schema refactor, run:

```sh
node --import tsx --test server/security/schemaContract.test.ts
npm run check
npm run test:security
npm run test:performance
npm run build
git diff --check
```

The contract test freezes the public exports, type declarations, Drizzle table
metadata, Zod schemas, catalogs, and normalized PostgreSQL DDL. A structural
move must not require a migration.
