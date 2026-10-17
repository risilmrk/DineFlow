// ==============================================================================
// DineFlow Tenant & Hostname Resolution Engine
// ==============================================================================

export type ResolvedPanel = 'landing' | 'super_admin' | 'hotel_admin' | 'guest';

export interface TenantContextInfo {
  panel: ResolvedPanel;
  hotelSlug: string | null;
  hostname: string;
  isReservedAdmin: boolean;
  isSubdomain: boolean;
}

export const RESERVED_ADMIN_HOSTS = ['admin', 'dashboard', 'app', 'api', 'www', 'manage'];

/**
 * Resolves the active panel and hotel tenant from the current hostname, path, and query params.
 */
export function resolveTenant(
  hostname: string = typeof window !== 'undefined' ? window.location.hostname : 'localhost',
  pathname: string = typeof window !== 'undefined' ? window.location.pathname : '/',
  search: string = typeof window !== 'undefined' ? window.location.search : ''
): TenantContextInfo {
  const params = new URLSearchParams(search);
  const explicitPanel = params.get('panel');
  const explicitHotel = params.get('hotel');

  // 1. Explicit query param overrides (useful for local dev and demo switches)
  if (explicitPanel === 'admin' || explicitPanel === 'superadmin') {
    return {
      panel: 'super_admin',
      hotelSlug: null,
      hostname,
      isReservedAdmin: true,
      isSubdomain: false,
    };
  }
  if (explicitPanel === 'dashboard' || explicitPanel === 'hotel_admin') {
    return {
      panel: 'hotel_admin',
      hotelSlug: explicitHotel || 'gusto',
      hostname,
      isReservedAdmin: true,
      isSubdomain: false,
    };
  }
  if (explicitPanel === 'landing') {
    return {
      panel: 'landing',
      hotelSlug: null,
      hostname,
      isReservedAdmin: false,
      isSubdomain: false,
    };
  }
  if (explicitHotel) {
    return {
      panel: 'guest',
      hotelSlug: explicitHotel.toLowerCase(),
      hostname,
      isReservedAdmin: false,
      isSubdomain: true,
    };
  }

  // 2. Explicit pathname routing fallbacks
  if (pathname.startsWith('/admin') || pathname.startsWith('/superadmin')) {
    return {
      panel: 'super_admin',
      hotelSlug: null,
      hostname,
      isReservedAdmin: true,
      isSubdomain: false,
    };
  }
  if (pathname.startsWith('/dashboard')) {
    const hotelFromQuery = params.get('hotel') || 'gusto';
    return {
      panel: 'hotel_admin',
      hotelSlug: hotelFromQuery,
      hostname,
      isReservedAdmin: true,
      isSubdomain: false,
    };
  }
  if (pathname.startsWith('/hotel/')) {
    const segments = pathname.split('/');
    const slug = segments[2];
    if (slug) {
      return {
        panel: 'guest',
        hotelSlug: slug.toLowerCase(),
        hostname,
        isReservedAdmin: false,
        isSubdomain: true,
      };
    }
  }

  // 3. Subdomain extraction from hostname (e.g., gusto.localhost or gusto.dineflow.com)
  const hostLower = hostname.toLowerCase();
  const parts = hostLower.split('.');

  // e.g. ["gusto", "localhost"] (length 2) or ["gusto", "dineflow", "com"] (length 3)
  if (parts.length > 1) {
    const firstPart = parts[0];

    // Check if it's a reserved admin subdomain
    if (firstPart === 'admin' || firstPart === 'superadmin') {
      return {
        panel: 'super_admin',
        hotelSlug: null,
        hostname,
        isReservedAdmin: true,
        isSubdomain: true,
      };
    }

    if (firstPart === 'dashboard' || firstPart === 'manage' || firstPart === 'app') {
      return {
        panel: 'hotel_admin',
        hotelSlug: params.get('hotel') || 'gusto',
        hostname,
        isReservedAdmin: true,
        isSubdomain: true,
      };
    }

    // Ignore www or bare localhost
    if (firstPart !== 'www' && firstPart !== 'localhost' && !firstPart.includes(':')) {
      return {
        panel: 'guest',
        hotelSlug: firstPart,
        hostname,
        isReservedAdmin: false,
        isSubdomain: true,
      };
    }
  }

  // 4. Default: Landing Marketing Page
  return {
    panel: 'landing',
    hotelSlug: null,
    hostname,
    isReservedAdmin: false,
    isSubdomain: false,
  };
}

/**
 * Builds the canonical public URL for a hotel guest menu.
 */
export function buildHotelGuestUrl(hotelSlug: string, port: string = typeof window !== 'undefined' ? window.location.port : '5173'): string {
  const baseDomain = import.meta.env?.VITE_BASE_DOMAIN || 'localhost:5173';
  const cleanDomain = baseDomain.split(':')[0];
  const activePort = port || (baseDomain.includes(':') ? baseDomain.split(':')[1] : '');

  // Local development subdomain: http://gusto.localhost:5173
  if (cleanDomain.includes('localhost')) {
    const portSuffix = activePort ? `:${activePort}` : '';
    return `http://${hotelSlug}.localhost${portSuffix}`;
  }

  // Production wildcard subdomain: https://gusto.dineflow.com
  return `https://${hotelSlug}.${cleanDomain}`;
}

/**
 * Builds fallback preview URL using query param for browsers without wildcard DNS
 */
export function buildHotelPreviewUrl(hotelSlug: string): string {
  if (typeof window === 'undefined') return `/?hotel=${hotelSlug}`;
  return `${window.location.origin}/?hotel=${hotelSlug}`;
}
