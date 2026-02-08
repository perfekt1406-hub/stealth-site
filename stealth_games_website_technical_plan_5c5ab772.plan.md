---
name: Stealth Games Website Technical Plan
overview: Build a stealth gaming website using Astro framework that appears as an academic resource, with hidden games library accessible via search trigger and URL masking.
todos:
  - id: setup-project
    content: Initialize Astro project with TypeScript, install Simple.css and Lucide Icons
    status: completed
  - id: create-layout
    content: Create BaseLayout.astro with Simple.css integration and academic styling
    status: completed
    dependencies:
      - setup-project
  - id: build-home-page
    content: Build index.astro with academic content, search bar, and subject categories
    status: completed
    dependencies:
      - create-layout
  - id: implement-routing
    content: Create client-side router with URL masking to /reference/archive
    status: completed
    dependencies:
      - setup-project
  - id: create-games-page
    content: Build games library page at /reference/archive with grid layout and iframe embeds
    status: completed
    dependencies:
      - create-layout
      - implement-routing
  - id: search-trigger
    content: Implement search bar trigger logic (case-sensitive "games" keyword)
    status: completed
    dependencies:
      - build-home-page
      - implement-routing
  - id: panic-button
    content: Add ESC key panic button functionality to return to home instantly
    status: completed
    dependencies:
      - create-games-page
  - id: populate-content
    content: Add academic placeholder content and populate games.json with 5-10 initial games
    status: done
    dependencies:
      - build-home-page
      - create-games-page
  - id: configure-vercel
    content: Set up Vercel deployment configuration and test deployment
    status: pending
    dependencies:
      - populate-content
---

# Stealth School Games Website - Technical Implementation Plan

## Technology Stack

### Core Framework

- **Astro** (v4.x) - Static site generator with excellent performance
  - Zero JS by default, perfect for static hosting
  - Component-based architecture
  - Built-in routing and asset optimization

### Styling

- **Simple.css** (v2.x) - Classless CSS framework for academic appearance
  - No build step required
  - Semantic HTML styling
  - Lightweight (~7KB)

### Icons

- **Lucide Icons** - Modern SVG icon library
  - Tree-shakeable, import only needed icons
  - Lightweight and performant
  - Professional academic aesthetic

### Routing & Navigation

- **Astro View Transitions** - Built-in client-side routing
- **History API** - For URL masking without page reloads
- Custom JavaScript router for stealth navigation

### Games Integration

- **iframe** embedding for external games
- Games sourced from:
  - itch.io (open source games)
  - GitHub repositories (self-hosted HTML5 games)
  - Direct HTML5 game embeds

### Hosting & Deployment

- **Vercel** - Static site hosting
  - Automatic deployments from Git
  - Free SSL certificates
  - Global CDN
  - Custom domain support

### Development Tools

- **TypeScript** (optional but recommended)
- **Vite** (bundled with Astro)
- **ESLint** + **Prettier** (code quality)

## Project Structure

```
/
├── src/
│   ├── layouts/
│   │   └── BaseLayout.astro       # Main layout with Simple.css
│   ├── components/
│   │   ├── SearchBar.astro        # Search input with trigger logic
│   │   ├── GameCard.astro         # Game thumbnail card
│   │   ├── GameGrid.astro         # Games library grid layout
│   │   ├── PanicButton.astro      # ESC key handler component
│   │   └── AcademicContent.astro  # Placeholder academic sections
│   ├── pages/
│   │   ├── index.astro            # Home page (School Notes front)
│   │   └── reference/
│   │       └── archive.astro       # Games library (hidden route)
│   ├── scripts/
│   │   ├── router.ts              # Client-side routing logic
│   │   ├── searchTrigger.ts       # Search bar event handler
│   │   └── panicButton.ts         # ESC key panic functionality
│   ├── data/
│   │   └── games.json             # Games metadata (titles, URLs, categories)
│   └── styles/
│       └── global.css             # Custom styles + Simple.css import
├── public/
│   ├── games/                     # Self-hosted game assets (if any)
│   └── pdfs/                      # Placeholder academic PDFs
├── astro.config.mjs               # Astro configuration
├── package.json                   # Dependencies
└── vercel.json                    # Vercel deployment config
```

## Key Implementation Details

### 1. Search Trigger Mechanism

- Event listener on search input
- Case-sensitive check: `input.value === 'games'`
- On match: programmatically navigate to `/reference/archive`
- Uses History API to update URL without page reload

### 2. URL Masking

- Games page accessible at `/reference/archive`
- Browser tab title: "Academic Reference Archive"
- Meta description: Academic-focused content
- History API prevents URL changes from showing in browser history

### 3. Panic Button (ESC Key)

- Global keyboard event listener
- ESC key triggers immediate redirect to home page
- Clears any game state/iframes
- Instant visual feedback

### 4. Games Library

- Grid layout with game thumbnails
- Categories: Action, Puzzle, Retro, Strategy
- Each game embedded via iframe
- Responsive design (mobile-friendly)
- Initial set: 5-10 games

### 5. Academic Front Page

- Title: "OpenSource Academic Repository"
- Marquee with academic updates
- Subject categories (Math, Science, History, Literature, Technology)
- Search bar prominently displayed
- PDF download buttons (placeholder links)
- Last modified timestamps

## Dependencies

### package.json

```json
{
  "dependencies": {
    "astro": "^4.0.0",
    "lucide-astro": "^0.0.1"
  },
  "devDependencies": {
    "@astrojs/check": "^0.9.0",
    "typescript": "^5.0.0"
  }
}
```

## API & External Services

### Games Sources

- **itch.io API** (optional) - For fetching game metadata
- **GitHub** - Hosting self-contained HTML5 games
- Direct iframe embeds from trusted sources

### Analytics (Optional)

- **Vercel Analytics** - Built-in page view tracking
- No external analytics to maintain stealth

## Development Workflow

1. **Setup**: Initialize Astro project, install dependencies
2. **Layout**: Create base layout with Simple.css
3. **Home Page**: Build academic front page with search bar
4. **Routing**: Implement client-side routing and URL masking
5. **Games Page**: Create games library with grid layout
6. **Stealth Features**: Add search trigger and panic button
7. **Content**: Populate with academic placeholders and game data
8. **Testing**: Test on mobile/desktop, verify stealth features
9. **Deployment**: Configure Vercel and deploy

## Security & Stealth Considerations

- No external API calls that could reveal purpose
- All routing handled client-side
- Minimal JavaScript footprint
- Academic-looking URLs and meta tags
- No game-related keywords in source code comments (use generic terms)

## Performance Optimizations

- Astro's zero JS by default
- Lazy loading for game iframes
- Image optimization via Astro's built-in tools
- Static generation for all pages
- Minimal CSS footprint (Simple.css)