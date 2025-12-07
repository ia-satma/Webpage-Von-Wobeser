# Von Wobeser y Sierra Corporate Website

## Overview

This is a corporate website for Von Wobeser y Sierra, a leading law firm in Mexico, showcasing their new office location in Polanco, Mexico City. The application is built as a single-page website with multiple sections including news, office vision, statistics, image galleries, and location information. The site features comprehensive multi-language support (10 languages with AI-powered legal translation), dark mode, and follows a professional, sophisticated design aesthetic inspired by premium law firm websites.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Build Tools**
- React 18+ with TypeScript for type-safe component development
- Vite for fast development and optimized production builds
- Wouter for lightweight client-side routing
- TanStack Query (React Query) for server state management and data fetching

**UI Component System**
- Shadcn/UI component library based on Radix UI primitives
- Tailwind CSS for utility-first styling with custom design tokens
- Framer Motion for declarative animations and transitions
- Component architecture follows atomic design principles with reusable UI components in `client/src/components/ui/`

**Styling Approach**
- CSS variables for theme-able color system supporting light/dark modes
- Design guidelines specify professional corporate aesthetic with conservative animations
- Typography system using web-safe font stacks (Optima, Georgia, serif fallbacks)
- Responsive design with mobile-first breakpoints
- Zero border radius throughout for corporate minimalism

**State Management**
- React Query for async state (API data fetching, caching, background updates)
- Local React state for UI interactions (mobile menu, language toggle, theme)
- No global state management library - relies on composition and props

**Key Pages & Sections**
- Single-page application with section-based navigation
- Home page (`client/src/pages/Home.tsx`) orchestrates all major sections
- Modular section components: Hero, News, Vision, Stats, ImageCollage, Quote, Map, Footer

**Recent Feature Additions (December 2025)**
- Video hero with looping Mexico City skyline background and dark gradient overlay
- News overlay panel on hero (shows 2 latest articles on left side, desktop only)
- New offices popup modal with Google Maps embed (1.5s delay, localStorage tracking)
- World map section showing German Desk with animated red marker
- Image collage with 9 real office images from vonwobeser.com/img/Collage/
- Team member avatars with graceful initials fallback when external images blocked
- JSON-LD Schema.org structured data for SEO (LegalService type)
- Font optimization with preload and font-display: swap
- Improved accessibility with better text contrast ratios

**Comprehensive Team Member Profiles (December 2025)**
- Extended team member schema with JSONB fields for: education[], barAdmissions[], languages[], affiliations[], rankings[], publications[], representativeMatters[], experience[]
- TeamMemberDetail.tsx updated with full profile sections displaying all new fields
- Bilingual support for all profile sections (English/Spanish)
- Sample comprehensive profiles for Luis Burgueño (Partner) and Claus von Wobeser (Of Counsel/Founding Partner)
- vCard download functionality with bilingual support

**Complete Practice & Industry Group Content (December 2025)**
- All 18 practice groups now have comprehensive bilingual fullDescription content sourced from vonwobeser.com, Chambers, Legal 500, and official firm pages
- All 7 industry groups now have comprehensive bilingual fullDescription content
- Practice groups include: Corporate/M&A, Arbitration, Litigation, Competition Law, Banking & Finance, ESG, Real Estate, Intellectual Property, Labor & Employment, Tax, International Trade, TMT, Environmental, Administrative Law, German Desk, etc.
- Industry groups include: Automotive/Manufacturing, Consumer Goods, Energy & Natural Resources, Pharmaceutical, Financial Services, Real Estate, Technology
- PracticeGroupDetail.tsx uses fallback logic: displays fullDescription if available, otherwise falls back to description
- Content stored in both database (for runtime) and seed.ts (for future seeding)

**Multi-Language System with AI Translation (December 2025)**
- Expanded language support from 2 to 10 languages: English (en), Spanish (es), German (de), Chinese (zh), Korean (ko), Japanese (ja), Arabic (ar), Russian (ru), French (fr), Italian (it)
- Created server/openai.ts with OpenAI GPT-5 integration for legal translation:
  - translateLegalText(): Single text translation with legal terminology focus
  - translateMultipleTexts(): Batch translation for multiple texts
  - suggestTranslation(): AI-powered translation suggestion with confidence scores
- API endpoints: GET /api/languages, POST /api/translate, POST /api/translate/batch, POST /api/translate/suggest
- LanguageContext provides: language (10-language code), displayLanguage (fallback "en"/"es"), setLanguage, getLanguageInfo
- LanguageSelector dropdown component in header with native language names
- AdminPostForm has AI translation suggestion buttons for Spanish fields (titleEs, excerptEs, contentEs) with confidence percentage display
- Content fallback: Non-EN/ES languages display English content until translations are added to database

**Website Optimization (December 2025)**
SEO & AI Readability:
- robots.txt created allowing all crawlers including AI bots (GPTBot, ChatGPT-User, Anthropic-AI, Claude-Web)
- sitemap.xml with hreflang tags for 10 languages (en, es-MX, de, zh-CN, ko, ja, ar, ru, fr, it)
- SEOHead component updated with comprehensive hreflang tags for all 10 languages
- JSON-LD schemas expanded: Organization, LegalService, LocalBusiness, WebSite, BreadcrumbList, Article (for news), Person (for team members)
- Heading hierarchy fixed: Single H1 per page, proper H2/H3 structure throughout
- All meta tags: Open Graph, Twitter Cards, canonical URLs

Performance:
- Hero video optimization: poster image, mobile fallback (static image on < 768px), preload="metadata"
- Image lazy loading with srcset for responsive images
- React Query caching: 5min staleTime, 10min gcTime, smart retry logic
- Font optimization with preload and font-display: swap

Mobile Responsiveness:
- 44px minimum touch targets on all interactive elements
- Mobile navigation improvements with proper sizing
- Responsive grids with flex-wrap and gap utilities
- touch-manipulation CSS for better mobile interactions

**New Pages & Navigation Fixes (December 2025)**
- Created 6 new pages to fix 404 navigation errors:
  - `/diversity-inclusion` - DiversityInclusion.tsx: Full D&I program page with stats, initiatives, and commitment history
  - `/pro-bono` - ProBono.tsx: Pro bono program details, 35+ years of service, areas of practice, impact statistics
  - `/german-desk` - GermanDesk.tsx: German/Austrian client services, 34+ years experience, cultural understanding
  - `/articles` - Articles.tsx: Legal articles and insights grid with search functionality
  - `/newsletter` - Newsletter.tsx: Newsletter subscription form and archive section
  - `/careers/interns` - Interns.tsx: Internship program details, requirements, application process
- All pages feature bilingual support (EN/ES), SEOHead meta tags, framer-motion animations, brand color #AC162C
- Favicon updated from Replit logo to Von Wobeser logo (vw-icon) in brand red

### Backend Architecture

**Server Framework**
- Express.js server with TypeScript
- HTTP server creation for potential WebSocket support
- Middleware stack: JSON body parsing, URL encoding, static file serving

**API Structure**
- RESTful endpoints under `/api` prefix
- News API: `GET /api/news`, `GET /api/news/:id`
- Content API: `GET /api/office-images`, `GET /api/site-content`, `GET /api/stats`
- Currently uses in-memory storage implementation (`server/storage.ts`)

**Data Layer Design**
- Abstract storage interface (`IStorage`) for future database integration
- Current implementation: Mock data stored in TypeScript objects
- Database schema defined in `shared/schema.ts` ready for Drizzle ORM + PostgreSQL migration
- Schema includes: users, news, office images, site content, stats

**Build Strategy**
- Custom build script (`script/build.ts`) using esbuild for server bundling
- Selective dependency bundling to optimize cold start times
- Vite for client build with public asset output to `dist/public`
- Development mode uses Vite HMR with Express middleware mode

### Data Storage

**Current Implementation**
- PostgreSQL database with Drizzle ORM
- Real content from vonwobeser.com extracted and seeded
- All content is bilingual (English/Spanish fields)

**Database Architecture**
- PostgreSQL via Neon serverless driver (`@neondatabase/serverless`)
- Drizzle ORM for type-safe database operations
- Schema migration ready with `drizzle.config.ts`
- Tables: users, news, office_images, practice_groups, industry_groups, team_members

**Data Models**
- Team Members: 25 real lawyers with photos from vonwobeser.com/images/Socios/, bilingual bios, contact info
- Practice Groups: 18 real practice areas with authentic descriptions (Corporativo/M&A, Arbitraje, Litigio, Competencia Económica, etc.)
- Industry Groups: 7 real industry sectors (Farmacéutica, Energía, Automotriz, Servicios Financieros, etc.)
- News: Real firm announcements (new offices, rankings, recognitions)
- Office Images: Tower SOMA Chapultepec office photos
- Site Content: Key-value pairs for hero text, vision, quotes, contact info
- Stats: Numeric values with bilingual labels

**Real Content Sources**
- Team photos: https://www.vonwobeser.com/images/Socios/Fotos_socios/
- Practice area descriptions: Extracted from vonwobeser.com/index.php/practica
- Industry group descriptions: Extracted from vonwobeser.com/index.php/industria
- Firm address: Torre SOMA Chapultepec Piso 18, Campos Elíseos 204, Polanco, 11560 CDMX

### Authentication & Authorization

**Current State**
- User schema defined but authentication not implemented
- Schema includes username/password fields with UUID primary keys
- No active authentication middleware or session management

**Prepared Infrastructure**
- Dependencies installed: `express-session`, `connect-pg-simple`, `passport`, `passport-local`
- Session store ready for PostgreSQL integration
- JWT and bcrypt libraries available for password hashing

### Design System

**Color Scheme**
- Primary brand color: `#AC162C` (deep red)
- Accent: `#841A1A` (darker red variant)
- Background: White with subtle gray variations for cards
- Text hierarchy: Primary gray (`#5E5E5E`), link color matches accent
- Dark mode support via CSS variables and Tailwind's `dark:` classes

**Typography Hierarchy**
- Heading font: Optima/Segoe UI sans-serif stack
- Body text: Optima/Segoe UI
- Long-form content: Georgia/Times New Roman serif stack
- Scale: H1 48px→32px mobile, H2 36px→24px, body 18px, captions 14px

**Component Patterns**
- Consistent shadow system: `shadow-sm`, `shadow-md` for elevation
- Border radius: 9px (lg), 6px (md), 3px (sm)
- Spacing using Tailwind's 4-unit increments
- Hover states with subtle elevation changes via custom CSS classes

## External Dependencies

### Third-Party Services

**Database**
- Neon PostgreSQL serverless database (configured but not actively connected)
- Connection via `DATABASE_URL` environment variable
- Drizzle Kit for schema migrations

**Development Tools**
- Replit-specific plugins for runtime error overlay, cartographer, dev banner
- Custom Vite configuration for Replit environment detection

### Key NPM Packages

**UI Framework**
- `@radix-ui/*` - Headless UI primitives for accessible components
- `framer-motion` - Animation library for smooth transitions
- `lucide-react` - Icon library for consistent iconography
- `tailwindcss` - Utility-first CSS framework

**Data & State**
- `@tanstack/react-query` - Server state management
- `drizzle-orm` - TypeScript ORM for PostgreSQL
- `drizzle-zod` - Zod schema generation from Drizzle schemas
- `zod` - Runtime type validation

**Server**
- `express` - Web server framework
- `cors` - CORS middleware (installed but not configured)
- `express-rate-limit` - Rate limiting (installed but not active)

**Build & Development**
- `vite` - Frontend build tool and dev server
- `esbuild` - Fast JavaScript bundler for server code
- `tsx` - TypeScript execution for development
- `typescript` - Type system

**Utility Libraries**
- `clsx` + `tailwind-merge` - Conditional class name handling
- `class-variance-authority` - Component variant management
- `date-fns` - Date formatting and manipulation
- `nanoid` - Unique ID generation

### Asset Management

**Static Assets**
- Branding configuration in `attached_assets/branding-1764699766040.json`
- Content markdown in `attached_assets/content-1764699764081.md`
- Favicon served from `/favicon.png`
- Font loading via Google Fonts CDN (Cormorant Garamond, Inter)

**Image Strategy**
- Partner photos served locally from `/partner_photos/` endpoint (21 photos in attached_assets/partner_photos/)
- Photo naming convention: `[firstname_lastname].jpg` (e.g., `luis_burgueno.jpg`, `montserrat_manzano.jpg`)
- Adrián Castillo is the only partner without a local photo (uses initials fallback)
- Office imagery uses Von Wobeser branding images
- Responsive images handled via Tailwind classes
- Avatar component has initials fallback for failed image loads

**Partner Photo Hosting**
- Static files served from: `attached_assets/partner_photos/`
- URL pattern: `/partner_photos/[firstname_lastname].jpg`
- Configured in: `server/routes.ts` using `express.static`
- 21 partner photos migrated from vonwobeser.com to local storage