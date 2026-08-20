import { useEffect } from "react";

const SITE_NAME = "MarKendrick";
const SITE_ORIGIN = "https://accurate-serenity-production.up.railway.app";
const DEFAULT_IMAGE = `${SITE_ORIGIN}/media/office/office-1.jpg`;

function setMeta(attr, key, content) {
  if (!content) return;
  let tag = document.querySelector(`meta[${attr}="${key}"]`);
  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute(attr, key);
    document.head.appendChild(tag);
  }
  tag.setAttribute("content", content);
}

function setLink(rel, href) {
  if (!href) return;
  let tag = document.querySelector(`link[rel="${rel}"]`);
  if (!tag) {
    tag = document.createElement("link");
    tag.setAttribute("rel", rel);
    document.head.appendChild(tag);
  }
  tag.setAttribute("href", href);
}

/**
 * Per-page SEO tags. Renders nothing; imperatively syncs document.title,
 * meta description, Open Graph, Twitter Card, and canonical URL on route change.
 *
 * @param {string} title - page title (site name appended automatically)
 * @param {string} description - meta/OG/Twitter description
 * @param {string} [image] - absolute image URL for social previews (defaults to site image)
 * @param {string} [path] - route path for canonical/og:url (defaults to current location)
 * @param {"website"|"article"} [type] - og:type
 * @param {boolean} [noIndex] - true for pages that shouldn't be indexed (e.g.
 *   the 404 page). This app is a client-rendered SPA served by a catch-all
 *   route, so unmatched URLs still return HTTP 200, not a real 404 status -
 *   without this, every broken/typo'd URL would inherit the sitewide
 *   default "index, follow" robots tag and its own self-referencing
 *   canonical link, inviting Google to index junk URLs as real pages.
 */
export default function Seo({ title, description, image, path, type = "website", noIndex = false }) {
  useEffect(() => {
    const fullTitle = title ? `${title} - ${SITE_NAME}` : `${SITE_NAME} - Global Marketing Agency`;
    const url = `${SITE_ORIGIN}${path || window.location.pathname}`;
    const resolvedImage = image
      ? image.startsWith("http")
        ? image
        : `${SITE_ORIGIN}${image.startsWith("/") ? "" : "/"}${image}`
      : null;
    const img = resolvedImage || DEFAULT_IMAGE;

    document.title = fullTitle;

    setMeta("name", "description", description);
    setMeta("property", "og:title", fullTitle);
    setMeta("property", "og:description", description);
    setMeta("property", "og:url", url);
    setMeta("property", "og:image", img);
    setMeta("property", "og:type", type);
    setMeta("name", "twitter:title", fullTitle);
    setMeta("name", "twitter:description", description);
    setMeta("name", "twitter:image", img);
    setMeta("name", "robots", noIndex ? "noindex, follow" : "index, follow");

    if (noIndex) {
      document.querySelector('link[rel="canonical"]')?.remove();
    } else {
      setLink("canonical", url);
    }
  }, [title, description, image, path, type, noIndex]);

  return null;
}
