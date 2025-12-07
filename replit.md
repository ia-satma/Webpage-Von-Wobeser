# Von Wobeser y Sierra Corporate Website

## Overview
This project is a corporate website for Von Wobeser y Sierra, a leading Mexican law firm. Its primary purpose is to showcase their new office and firm capabilities through a single-page application. Key features include comprehensive multi-language support (10 languages with AI-powered legal translation), dark mode, and a professional design aesthetic. The site aims to provide a sophisticated online presence, highlighting news, office vision, statistics, image galleries, and location information.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
The frontend is built with React 18+ and TypeScript, utilizing Vite for development and optimized builds. UI components leverage Shadcn/UI (based on Radix UI) and are styled with Tailwind CSS, following atomic design principles. Framer Motion handles animations. State management primarily uses TanStack Query for server state and local React state for UI interactions. The application is a single-page site with section-based navigation, featuring components for Hero, News, Vision, Stats, ImageCollage, Quote, Map, and Footer.

The design emphasizes a professional corporate aesthetic with conservative animations, a zero-border-radius policy for minimalism, and a robust typography system. It includes comprehensive multi-language support (English, Spanish, German, Chinese, Korean, Japanese, Arabic, Russian, French, Italian) with AI translation capabilities. Key features include a video hero, news overlay, new offices popup, a world map section for the German Desk, image collages, and rich team member profiles with vCard downloads. SEO is optimized with JSON-LD, sitemap, hreflang, and proper heading structures. Performance is enhanced through image lazy loading, font optimization, and React Query caching. The site is fully mobile-responsive.

New dedicated pages for Diversity & Inclusion, Pro Bono, German Desk, Articles, Newsletter, and Internships have been added, all featuring bilingual support, SEO, and animations.

### Backend
The backend uses Express.js with TypeScript, providing RESTful API endpoints under `/api`. It currently uses an in-memory storage implementation for mock data but is designed for PostgreSQL integration. The server build uses esbuild, while the client uses Vite.

### Data Storage
The project uses a PostgreSQL database with Drizzle ORM. Content is real, extracted from the firm's existing website, and includes bilingual (English/Spanish) fields. The schema defines tables for users, news, office images, practice groups, industry groups, and team members. Data models include 25 real lawyers, 18 practice groups, 7 industry groups, firm news, office images, and site content, all sourced accurately. A translation cache table stores AI-generated translations.

### Authentication & Authorization
While a user schema is defined, authentication and authorization are not yet implemented, though necessary dependencies like `express-session` and `passport` are installed, preparing for future integration.

### Design System
The color scheme uses `#AC162C` (deep red) as the primary brand color, with accents, a white background, and gray text. Dark mode is supported via CSS variables. Typography utilizes Optima/Segoe UI for headings and body text, and Georgia/Times New Roman for long-form content. Consistent shadow systems, border radii, and spacing are applied across components.

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