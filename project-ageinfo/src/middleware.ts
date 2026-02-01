import createMiddleware from 'next-intl/middleware';
import { routing } from '@/i18n/routing';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Enhanced Middleware - Smart Locale Detection & Redirection
 * 
 * Features:
 * - Auto-detects browser language from Accept-Language header
 * - Redirects Indonesian users to /id
 * - Redirects others to /en (default)
 * - Excludes static files from processing
 * - Handles trailing slashes properly
 * - SEO-friendly with consistent locale prefixes
 */

// Create the base next-intl middleware
const intlMiddleware = createMiddleware(routing);

export default function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // ============================================
    // SKIP MIDDLEWARE FOR STATIC FILES
    // ============================================
    // Don't process static assets, API routes, or Next.js internals
    const shouldSkip = [
        '/api/',
        '/_next/',
        '/_vercel/',
        '/favicon.ico',
        '/robots.txt',
        '/sitemap.xml',
        '/manifest.json',
    ].some(path => pathname.startsWith(path));

    // Also skip files with extensions (images, fonts, etc.)
    const hasFileExtension = /\.[^/]+$/.test(pathname);

    if (shouldSkip || hasFileExtension) {
        return NextResponse.next();
    }

    // ============================================
    // SMART LOCALE DETECTION
    // ============================================
    // Check if user is accessing root without locale
    if (pathname === '/') {
        const acceptLanguage = request.headers.get('accept-language');
        let preferredLocale = routing.defaultLocale;

        if (acceptLanguage) {
            // Parse Accept-Language header
            // Example: "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7"
            const languages = acceptLanguage
                .split(',')
                .map(lang => {
                    const [locale, q = 'q=1'] = lang.trim().split(';');
                    const quality = parseFloat(q.replace('q=', ''));
                    return { locale: locale.toLowerCase(), quality };
                })
                .sort((a, b) => b.quality - a.quality);

            // Find first matching locale from our supported locales
            for (const { locale } of languages) {
                // Check for exact match or language code match
                // e.g., 'id-ID' -> 'id', 'en-US' -> 'en'
                const langCode = locale.split('-')[0];

                if (routing.locales.includes(langCode as any)) {
                    preferredLocale = langCode;
                    break;
                }
            }
        }

        // Redirect to detected locale
        const url = request.nextUrl.clone();
        url.pathname = `/${preferredLocale}`;
        return NextResponse.redirect(url);
    }

    // ============================================
    // HANDLE TRAILING SLASHES
    // ============================================
    // Remove trailing slash for consistency (except root)
    if (pathname !== '/' && pathname.endsWith('/')) {
        const url = request.nextUrl.clone();
        url.pathname = pathname.slice(0, -1);
        return NextResponse.redirect(url, 308); // Permanent redirect
    }

    // ============================================
    // APPLY NEXT-INTL MIDDLEWARE
    // ============================================
    // Let next-intl handle locale routing
    return intlMiddleware(request);
}

export const config = {
    // Match all pathnames except for:
    // - api routes
    // - _next (Next.js internals)
    // - _vercel (Vercel internals)
    // - Files with extensions (e.g. favicon.ico, images, etc.)
    matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
