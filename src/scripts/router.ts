/**
 * Client-side router for stealth navigation
 * Handles URL masking and navigation without page reloads
 */

export interface Route {
  path: string;
  title: string;
  description: string;
}

export const routes: Record<string, Route> = {
  '/reference/archive': {
    path: '/reference/archive',
    title: 'Academic Reference Archive',
    description: 'A comprehensive collection of academic reference materials and resources'
  }
};

/**
 * Navigate to a route using Astro View Transitions (no page reload)
 */
export async function navigateTo(path: string, replace: boolean = false): Promise<void> {
  if (typeof window === 'undefined') return;

  const route = routes[path];
  if (!route) {
    console.warn(`Route not found: ${path}`);
    return;
  }

  // Use Astro View Transitions for smooth navigation
  // Check if View Transitions are available
  if ('startViewTransition' in document) {
    // @ts-ignore - View Transition API
    document.startViewTransition(() => {
      if (replace) {
        window.history.replaceState({ path }, '', path);
      } else {
        window.history.pushState({ path }, '', path);
      }
      // Trigger navigation
      window.location.href = path;
    });
  } else {
    // Fallback: use regular navigation with View Transitions
    if (replace) {
      window.history.replaceState({ path }, '', path);
    } else {
      window.history.pushState({ path }, '', path);
    }
    // Use Astro's navigation
    window.location.href = path;
  }

  // Update document title and meta description
  updatePageMetadata(route);

  // Dispatch custom event for route change
  window.dispatchEvent(new CustomEvent('routechange', { detail: { path, route } }));
}

/**
 * Update page metadata (title and description)
 */
function updatePageMetadata(route: Route): void {
  if (typeof document === 'undefined') return;

  document.title = route.title;
  
  const metaDescription = document.querySelector('meta[name="description"]');
  if (metaDescription) {
    metaDescription.setAttribute('content', route.description);
  }
}

/**
 * Initialize router - handle browser back/forward buttons
 */
export function initRouter(): void {
  if (typeof window === 'undefined') return;

  // Handle browser back/forward navigation
  window.addEventListener('popstate', (event) => {
    const path = event.state?.path || window.location.pathname;
    const route = routes[path];
    
    if (route) {
      updatePageMetadata(route);
      window.dispatchEvent(new CustomEvent('routechange', { detail: { path, route } }));
    }
  });

  // Initialize current route metadata
  const currentPath = window.location.pathname;
  const currentRoute = routes[currentPath];
  if (currentRoute) {
    updatePageMetadata(currentRoute);
  }
}
