import JsonLd from "./JsonLd";

const SITE_ORIGIN = "https://accurate-serenity-production.up.railway.app";

/**
 * Emits a BreadcrumbList JSON-LD schema. No visible UI.
 * @param {{name: string, path: string}[]} items - ordered from home to current page.
 *   Pass path relative to site root, e.g. "/", "/services", "/services/seo".
 */
export default function BreadcrumbSchema({ items = [] }) {
  if (!items.length) return null;
  return (
    <JsonLd
      id="breadcrumb-schema"
      data={{
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: items.map((item, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: item.name,
          item: `${SITE_ORIGIN}${item.path}`,
        })),
      }}
    />
  );
}
