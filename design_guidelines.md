# Design Guidelines: Von Wobeser y Sierra Corporate Website

## Design Approach
**Reference-Based:** Drawing inspiration from premium law firm websites (Baker McKenzie, Latham & Watkins) with a focus on professional credibility, sophisticated layouts, and content-rich presentations. The design emphasizes trust, expertise, and modern professionalism.

## Core Design Principles
- **Professional Sophistication:** Clean, corporate aesthetic that conveys authority and expertise
- **Content Hierarchy:** Clear visual organization prioritizing key information and calls-to-action
- **Spatial Elegance:** Generous whitespace balanced with information density
- **Conservative Animations:** Minimal, purposeful motion that doesn't distract from content

## Typography System

**Font Families (Web-Safe Alternatives):**
- Primary/Headings: 'Optima', 'Segoe UI', sans-serif
- Body Text: 'Optima', 'Segoe UI', sans-serif  
- Paragraphs/Long-form: 'Georgia', 'Times New Roman', serif

**Scale & Hierarchy:**
- Hero Headline (H1): 48px (desktop) / 32px (mobile), line-height: 1.2, letter-spacing: -0.02em
- Section Headers (H2): 36px (desktop) / 24px (mobile), line-height: 1.3, font-weight: 300
- Subsection Headers (H3): 24px, line-height: 1.4
- Body Text: 18px, line-height: 1.7
- Small Text/Captions: 14px, line-height: 1.5

## Layout System

**Spacing Primitives:** Use Tailwind units of 4, 6, 8, 12, 16, 20, 24 for consistent rhythm

**Container Strategy:**
- Maximum width: 1400px (max-w-7xl)
- Section padding: py-20 (desktop) / py-12 (mobile)
- Horizontal padding: px-6 (mobile) / px-12 (desktop)

**Grid Patterns:**
- News cards: 3-column grid (lg:grid-cols-3, md:grid-cols-2, base: grid-cols-1)
- Image collage: Masonry-style asymmetric grid with varying heights
- Statistics: 4-column layout for metrics (md:grid-cols-4)

## Component Library

**Navigation:**
- Fixed header with transparent-to-solid transition on scroll
- Logo left-aligned, menu right-aligned
- Language switcher (ESP/ENG) in top-right corner
- Mobile: Hamburger menu opening full-screen overlay
- Zero border radius throughout

**Hero Section:**
- Full-viewport height (min-h-screen) with subtle scroll indicator
- Large hero image showing office/cityscape with dark overlay (opacity-40)
- Centered headline with animated word reveal on load
- Blurred background on CTA button (backdrop-blur-md bg-white/10)

**News Cards:**
- Vertical card design with image thumbnail
- Title, date, and "SEE MORE" link
- Hover: subtle scale transform (1.02) with shadow increase
- Sharp corners (rounded-none)

**Map Section:**
- Embedded Google Maps (iframe) with custom styling if possible
- Side-by-side layout: Map (60%) + Address/Info (40%)
- Contact details and directions CTA

**Image Collage:**
- Asymmetric grid with images of varying aspect ratios
- 3 rows with mixed 1-column and 2-column spans
- Lightbox functionality on click
- Lazy loading for performance

**Stats Display:**
- Large numbers (64px, font-weight: 300)
- Descriptive labels below
- Centered alignment
- Minimal dividers between items

**Quote Section:**
- Centered block quote with increased font size (24px)
- Attribution with name and title
- Subtle background treatment (bg-gray-50)

**Buttons:**
- Primary: bg-[#AC162C], text-white, px-8 py-4, sharp corners
- Secondary: border-2 border-gray-400, text-gray-700, px-8 py-4
- Hover states: opacity-90 for primary, bg-gray-50 for secondary
- No hover/active states on hero buttons with blurred backgrounds

**Footer:**
- Multi-column layout: Address | Quick Links | Social
- Copyright and legal disclaimers
- bg-gray-900 with white text

## Color Application

**Exact Brand Colors (provided):**
- Primary Red: #AC162C (main CTAs, accents, links)
- Dark Red: #841A1A (hover states, secondary accents)
- Background: #FFFFFF
- Text Primary: #5E5E5E
- Neutral Gray for borders: #CCCCCC

**Usage Rules:**
- Backgrounds: White primary, light gray (#F9FAFB) for alternate sections
- Text: #5E5E5E for body, #1F2937 for headlines
- Accents: Red (#AC162C) sparingly for CTAs and important elements
- Dividers/Borders: #E5E7EB

## Imagery Guidelines

**Hero Section:**
- Large hero image: Modern office building or Mexico City skyline
- Professional photography of office interiors
- Dark overlay (bg-black/40) for text legibility

**Office Collage:**
- 9+ professional photographs showing:
  - Open collaborative workspaces
  - Meeting rooms with city views
  - Reception and common areas
  - Terrace views
  - Architectural details
- Mix of wide and detail shots

**Icons:**
- Use Heroicons via CDN (outline style)
- 24px size for navigation, 32px for feature highlights
- Stroke width: 1.5px

## Animation Guidelines

**Conservative Motion:**
- Page load: Fade-in for hero text (duration-700)
- Scroll: Subtle parallax on hero background (translateY by 30%)
- Cards: Scale on hover (transform scale-105, duration-200)
- Navigation: Smooth height transition on scroll
- NO: Excessive scroll-triggered animations, autoplay carousels, or distracting effects

## Accessibility & Polish

- Focus states: 2px red outline (ring-2 ring-red-600)
- Minimum touch target: 44px × 44px
- Contrast ratio: Minimum 4.5:1 for all text
- Alt text for all images
- Keyboard navigation support throughout

## Page Structure

1. **Fixed Navigation Bar**
2. **Hero Section:** Full-screen with image, headline, scroll indicator
3. **News Highlights:** 3-column card grid with latest updates
4. **Office Vision:** Text section with key messaging
5. **Location Map:** Interactive map with address details
6. **Office Stats:** 4-column metrics showcase
7. **Image Collage:** Asymmetric grid gallery
8. **Testimonial Quote:** Featured statement from partner
9. **Footer:** Multi-column with contact info

This design creates a sophisticated, trustworthy corporate presence that reflects the firm's professional stature while maintaining modern web standards.