# Von Wobeser y Sierra Corporate Website

> ⚠️ **Estado real (actualizado 2026-06-21).** Este documento quedó desfasado respecto al código. Estas correcciones **prevalecen** sobre el texto de abajo:
> - **Idiomas:** el sitio es **bilingüe estático EN/ES** (`getDisplayValue` + `client/src/i18n.ts`), NO 10 idiomas con traducción LLM en runtime. El hook `useTranslatedContent` quedó como legado.
> - **Almacenamiento:** **PostgreSQL real con Drizzle** (no "in-memory/mock"); `server/seed.ts` puebla datos iniciales.
> - **Autenticación:** **implementada** (`server/auth.ts`: bcrypt + sesiones por token + `requireRole`), no "pendiente".
> - **German Desk:** **eliminado** (ruta, nav, página, `WorldMapSection`).
> - **Datos:** ~**143 abogados** y **843 publicaciones** bilingües (no 25). Texto por **Claude**; Consejo Legal por **OpenAI**; imágenes por **Gemini**.
> - **Agentes:** el catálogo declara **14**, pero el pipeline real corre ~8-9 (algunos quedan dormidos) — ver `shared/agentConstants.ts`.
> - Documento autoritativo del estado: `HANDOFF-2026-06-20-conexion-i18n-deploy.md`.

## Overview
This project is a corporate website for Von Wobeser y Sierra, a leading Mexican law firm. Its primary purpose is to showcase their new office and firm capabilities through a single-page application. Key features include bilingual support (English/Spanish, static — see the status banner above), dark mode, and a professional design aesthetic. The site aims to provide a sophisticated online presence, highlighting news, office vision, statistics, image galleries, and location information.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
The frontend is built with React 18+ and TypeScript, utilizing Vite for development and optimized builds. UI components leverage Shadcn/UI (based on Radix UI) and are styled with Tailwind CSS, following atomic design principles. Framer Motion handles animations. State management primarily uses TanStack Query for server state and local React state for UI interactions. The application is a single-page site with section-based navigation, featuring components for Hero, News, Vision, Stats, ImageCollage, Quote, Map, and Footer.

The design emphasizes a professional corporate aesthetic with conservative animations, a zero-border-radius policy for minimalism, and a robust typography system. Key features include a video hero, news overlay, new offices popup, a world map section for the German Desk, image collages, and rich team member profiles with vCard downloads. SEO is optimized with JSON-LD, sitemap, hreflang, and proper heading structures. Performance is enhanced through image lazy loading, font optimization, and React Query caching. The site is fully mobile-responsive.

### Multi-Language Translation System
The application implements a dual translation approach supporting 10 languages (en, es, de, zh, ko, ja, ar, ru, fr, it) with **100% translation coverage** - no English fallback text visible in any language mode:

1. **Static UI Translations (i18next)**: Used for navigation, buttons, labels, and UI text. Translations are stored as inline JavaScript objects in `client/src/i18n.ts`. The system uses localStorage (`vwb_language`) for persistence and automatically updates the HTML `lang` attribute. RTL support is included for Arabic.

2. **Page-Specific Content Translations**: All page components use inline content objects with complete translations for all 10 languages. Pattern: `content[language as keyof typeof content] || content.en`. This covers hero sections, feature descriptions, benefit lists, and all other static page content.

3. **Dynamic Content Translations (OpenAI)**: Used for database content (news, team bios, practice descriptions, events). Translations are cached in the database (`translation_caches` table) and requested on-demand via the `useTranslatedContent` hook. The backend uses OpenAI GPT-5 for high-quality legal text translation. Supported content types: `team_member`, `practice_group`, `industry_group`, `news`, `event`.

4. **Automatic Language Detection (Geolocation)**: On first visit (when no stored preference exists), the system automatically detects the user's country via IP geolocation (`/api/detect-language` endpoint using ip-api.com) and sets the appropriate language. Supports country-to-language mapping for Spanish-speaking countries (MX, ES, AR, etc.), German-speaking (DE, AT, CH), Chinese regions (CN, TW, HK), and more. Falls back to Spanish for unsupported countries or detection failures.

Key files:
- `client/src/i18n.ts` - i18next configuration with all 10 language resources
- `client/src/contexts/LanguageContext.tsx` - Language state management, persistence, and geolocation detection
- `client/src/hooks/useTranslatedContent.ts` - Dynamic translation hook for database content
- `server/routes.ts` - `/api/detect-language` endpoint with COUNTRY_TO_LANGUAGE mapping
- `server/openai.ts` - OpenAI translation API integration

New dedicated pages for Diversity & Inclusión, Pro Bono, German Desk, Articles, Newsletter, and Internships have been added, all featuring bilingual support, SEO, and animations.

### Backend
The backend uses Express.js with TypeScript, providing RESTful API endpoints under `/api`. It uses **PostgreSQL with Drizzle ORM** for storage (`server/storage.ts` + `server/db.ts`). The server build uses esbuild, while the client uses Vite.

### Data Storage
The project uses a PostgreSQL database with Drizzle ORM. Content is real, extracted from the firm's existing website, and includes bilingual (English/Spanish) fields. The schema defines tables for users, news, office images, practice groups, industry groups, and team members. Data models include 25 real lawyers, 18 practice groups, 7 industry groups, firm news, office images, and site content, all sourced accurately. A translation cache table stores AI-generated translations.

### Authentication & Authorization
Admin authentication and authorization are **implemented** in `server/auth.ts`: bcrypt password hashing, token-based sessions (24h expiry, `admin_sessions` table), login rate-limiting, and `requireRole` (super_admin > editor > author, with super_admin bypass). `express-session`/`passport` remain from earlier scaffolding.

### Design System
The color scheme uses `#AA1A2E` (brand red) as the primary color. **Light mode** uses a warm-gray palette derived from user swatches (#D5D2CD / #C0BDB8): off-white background (HSL 37 6% 97%), warm card (37 6% 82%), warm borders (37 5% 74%). **Dark mode** uses three dark swatches (#8B8D89 / #5B5C5F / #2E2E2A): background (50 5% 17%), cards (50 4% 21%), muted-foreground (100 2% 54%). All UI components use semantic CSS variable tokens (`bg-background`, `bg-card`, `text-foreground`, `border-border`, etc.) — no hardcoded `gray-*` colors. Typography uses Playfair Display for headlines, Óptima/Lato for body, Geomanist/Lato for labels. Consistent `rounded-none` policy throughout (except avatar circles). ALL CAPS headings with `tracking-[0.12em]`.

### AI Agent System (Self-Evolving Backend)
The backend has been transformed from a static brochure into a self-evolving system with autonomous AI agents that continuously improve content quality, translations, SEO, and metadata linking. The system is inspired by the brujer.ia project architecture.

**Architecture:**
- **Knowledge Layer**: Stores agent learnings, legal glossaries, and insights in `agent_knowledge` table and pCloud
- **Skills Layer**: Tracks agent capabilities, expertise levels, and success rates in `agent_skills` table
- **Evolution Layer**: Agents propose improvements tracked in `agent_evolution_proposals` table

**Specialized Agents:**
1. **FormatterAgent**: Cleans PDF-extracted articles, fixes broken line breaks, normalizes paragraphs, removes boilerplate
2. **MetadataLinkerAgent**: Analyzes content to link articles with authors, practice áreas, and industry groups
3. **PolyglotTranslatorAgent**: Translates to 10 languages using legal term glossary with smart caching
4. **ContentAuditorAgent**: Scans database for content gaps (missing translations, authors, formatting issues)
5. **SEOOptimizerAgent**: Improves titles, meta descriptions, slugs, and keywords for search engines
6. **ContentAnalyzerAgent**: Comprehensive article analysis using GPT-4o providing:
   - SEO recommendations (keywords, title suggestions, meta descriptions)
   - Article categorization (primary/secondary categories)
   - Spelling & grammar review with corrections
   - Lawyer identification within content
   - Legal branch classification (Corporate, M&A, Banking, etc.)
   - Industry detection (Financial Services, Energy, Technology, etc.)
   Results stored in `content_analysis` table with quality scores (0-100)

**Orchestration:**
- Central orchestrator (`AgentOrchestrator`) manages job queue, agent coordination, and pipeline execution
- Pipeline execution: article → format → categorize → link metadata → SEO optimize → translate (9 languages) → image (optional)
- Job queue with priority support (critical, high, normal, low)

**Real-Time Pipeline Progress (WebSocket):**
- WebSocket server at `/ws/pipeline` broadcasts pipeline progress to connected clients
- Frontend hook `usePipelineProgress` provides singleton WebSocket manager with automatic reconnection
- `PipelineProgressModal` component displays real-time step-by-step progress with status indicators
- Progress events include: step name, status (running/completed/error), progress percentage, and messages
- Heartbeat/ping mechanism detects and cleans up stale connections every 30 seconds

**Cloud Persistence (pCloud):**
- Agent knowledge and evolution data syncs to pCloud for persistence across sessions
- Configured via `PCLOUD_USERNAME` and `PCLOUD_PASSWORD` secrets

**Database Tables:**
- `agent_jobs`: Job queue with status, payload, results, retry logic
- `agent_events`: Event log for all agent activities
- `agent_knowledge`: Stored learnings and glossary entries
- `agent_skills`: Skill tracking with expertise and success rates
- `agent_evolution_proposals`: Self-improvement proposals pending review

**API Endpoints:**
- `GET /api/agents/status`: System status, queue length, registered agents
- `POST /api/agents/run/:agentType`: Run specific agent with payload
- `POST /api/agents/pipeline/:articleId`: Run full pipeline on article
- `POST /api/agents/audit`: Run content audit across all articles
- `POST /api/agents/evolution/learning-cycle`: Analyze and generate improvement proposals
- `POST /api/agents/pcloud/sync`: Sync knowledge to cloud storage

**Admin Dashboard:**
- Located at `/admin/agents`
- Monitor agent status, view evolution proposals, run audits
- Approve/reject evolution proposals
- Start/stop job processing

**Live Nerve Center Dashboard:**
- Located at `/admin/guide`
- Real-time visualization of the AI agent ecosystem with 30-second auto-refresh
- Displays **14 specialized agents** organized into 3 categories:
  - **The Brain (6 agents)**: Orchestrator, Legal Council, Content Analyzer, Category Agent, Metadata Linker, System Chronicler
  - **The Hands (4 agents)**: Polyglot Translator, Smart Image Generator, SEO Optimizer, Formatter
  - **The Shield (4 agents)**: Auto Recovery, System Health, Content Auditor, Website Auditor
- Each agent card shows: business name, role, description, capabilities, evolution level (1-5 dots), status
- Pulsing CSS animations on active agents to demonstrate "living, breathing" system
- System Evolution Timeline showing narrative history of improvements with impact levels (critical/major/minor)
- Full 10-language support matching all other pages

**Agent Inventory - Single Source of Truth (Auditor-Level Precisión):**
- Shared constants file: `shared/agentConstants.ts`
- Contains canonical `AGENT_IDS` typed constants, `AGENT_CATEGORY_MAP`, and derived category arrays
- `BRAIN_AGENT_IDS`, `HANDS_AGENT_IDS`, `SHIELD_AGENT_IDS` - computed from AGENT_CATEGORY_MAP (not manually maintained)
- Frontend manifest uses typed constants: `id: AGENT_IDS.ORCHESTRATOR` (no literal strings)
- Both frontend and backend **throw errors on startup** if inventory mismatches shared constants
- Runtime validation: SystemChronicler.validateInventory() and validateManifestAgentInventory()
- Category membership verification: ensures brain IDs in BRAIN_AGENT_IDS, etc.
- All agent IDs use underscore format (e.g., `content_analyzer`, `polyglot_translator`)
- Expected counts: 6 brain + 4 hands + 4 shield = 14 total agents

- Key files:
  - `shared/agentConstants.ts` - Single source of truth for agent inventory
  - `server/agents/SystemChronicler.ts` - Meta-agent that auto-documents all agents
  - `client/src/lib/systemManifest.ts` - Frontend technical documentation manifest
  - `client/src/components/admin/NerveCenter.tsx` - Agent network visualization
  - `client/src/components/admin/EvolutionTimeline.tsx` - Timeline component
  - `system_evolution.json` - Persisted evolution history

## External Dependencies

### Third-Party Services
- **Database:** Neon PostgreSQL serverless database.
- **AI Translation:** OpenAI GPT-5 for legal text translation.

### Key NPM Packages
- **UI Framework:** `@radix-ui/*`, `framer-motion`, `lucide-react`, `tailwindcss`.
- **Data & State:** `@tanstack/react-query`, `drizzle-orm`, `drizzle-zod`, `zod`.
- **Server:** `express`, `cors`, `express-rate-limit`.
- **Build & Development:** `vite`, `esbuild`, `tsx`, `typescript`.
- **Utility Libraries:** `clsx`, `tailwind-merge`, `class-variance-authority`, `date-fns`, `nanoid`.

### Asset Management
- **Branding & Content:** Configuration and markdown stored in `attached_assets`.
- **Favicon:** `/favicon.png`.
- **Fonts:** Google Fonts CDN (Cormorant Garamond, Inter).
- **Images:** Partner photos are served locally from `/partner_photos/` (21 photos), with an avatar component providing initials fallback for missing images. Office imagery uses Von Wobeser branding images.