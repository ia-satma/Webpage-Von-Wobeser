---
name: Replit AI Integrations provisioning blocker
description: Why AI_INTEGRATIONS_OPENAI_* env vars are missing and what was already tried — read before touching translation features.
---

# Replit AI Integrations provisioning blocker

The app's translation pipeline reads `AI_INTEGRATIONS_OPENAI_API_KEY` / `AI_INTEGRATIONS_OPENAI_BASE_URL` (Replit-managed AI credentials, local proxy on port 1106). As of 2026-07-16, provisioning is broken on this Repl and **cannot be fixed by an agent**:

- Blueprint `javascript_openai_ai_integrations` install is blocked ("blueprint integrations are not supported by this agent") — both `addIntegration` and `ProposeIntegration`.
- The `[agent].integrations` entry in `.replit` is metadata only; it does NOT inject env vars.
- Manually pasted secret values are rejected by the proxy (`404 Replit AI Integrations is not configured`) — credentials are Repl-bound, not portable.
- `requestSecrets` for those keys showed no "managed credentials" option to the user.
- Deleting the secrets did not trigger auto-provisioning; proxy endpoint 404s entirely.
- Personal Core-plan account (owner == user, no org), so org-settings enablement doesn't apply.

**Why:** provisioning is platform-side; user was directed to Replit support.
**How to apply:** don't retry the above paths; if translations must work before support resolves it, use a personal API key in those same env vars (note: app requests model `claude-sonnet-4-6`, so an OpenAI key also needs a model swap in `server/openai.ts`).

Related quirks discovered while verifying:
- Admin login endpoint expects `username` field (accepts email as its value), not `email`.
- `ADMIN_RESET_PASSWORD` secret re-applies the admin password on every server start (see `.replit` comments / `server/seed.ts`).
- OpenAI client in `server/openai.ts` is lazy-initialized (Proxy wrapper) so missing credentials fail per-request, not at boot.
