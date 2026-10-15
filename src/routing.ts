import { useEffect, useMemo, useSyncExternalStore } from 'react';
import { portfolio, sections } from './data/portfolio';
import type { PortfolioEntry, PortfolioSection, ProjectEntry, SectionId } from './data/portfolio';

export interface DetailSelection {
  section: PortfolioSection;
  entry: PortfolioEntry;
  project?: ProjectEntry;
}

export function entryHref(section: SectionId, entry: string, project?: string) {
  return '#/' + [section, entry, ...(project ? [project] : [])].map(encodeURIComponent).join('/');
}

function resolveRoute(hash: string): { selection: DetailSelection | null; notFound: boolean } {
  if (!hash || hash === '#') return { selection: null, notFound: false };
  const notFound = { selection: null, notFound: true } as const;
  let parts: string[];
  try {
    parts = hash.replace(/^#\//, '').split('/').map(decodeURIComponent);
  } catch (error) {
    if (error instanceof URIError) return notFound;
    throw error;
  }
  if (parts.length < 2 || parts.length > 3) return notFound;
  const section = sections.find((item) => item.id === parts[0]);
  const entry = section?.entries.find((item) => item.id === parts[1]);
  if (!section || !entry) return notFound;
  if (parts.length === 2) return { selection: { section, entry }, notFound: false };
  const project = entry.kind === 'collection'
    ? portfolio.projects.find((item) => item.id === parts[2] && item.category === entry.id)
    : undefined;
  return project ? { selection: { section, entry, project }, notFound: false } : notFound;
}

function subscribe(onChange: () => void) {
  window.addEventListener('hashchange', onChange);
  return () => window.removeEventListener('hashchange', onChange);
}

export function usePortfolioRoute() {
  const hash = useSyncExternalStore(subscribe, () => window.location.hash, () => '');
  const route = useMemo(() => resolveRoute(hash), [hash]);
  useEffect(() => {
    const name = route.selection?.project?.name ?? route.selection?.entry.name;
    document.title = name ? `${name} — Le Tri Lam` : 'Le Tri Lam — Developer';
  }, [route.selection]);
  return route;
}
