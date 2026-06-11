/**
 * Canonical site origin. Defaults to the production Vercel domain; override
 * with NEXT_PUBLIC_SITE_URL when deploying to a custom domain. Drives
 * metadataBase (canonical/OG URLs), robots.txt and sitemap.xml.
 */
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://visa-lark.vercel.app";
