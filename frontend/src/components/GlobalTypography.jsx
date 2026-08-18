import { useMemo } from "react";
import { useSiteSettings } from "../hooks/useSiteSettings";

// Fonts already loaded via the Google Fonts <link> in public/index.html.
// Anything outside this list still works (browser falls back to a generic
// font), it just won't be pre-loaded.
export const TYPOGRAPHY_FONT_OPTIONS = [
  "Syne", "DM Sans", "Inter", "Poppins", "Montserrat", "Playfair Display",
  "Lora", "Work Sans", "Space Mono", "Caveat", "Georgia", "Arial",
];

/**
 * Injects a small stylesheet that applies the site-wide typography settings
 * chosen in the CMS (Settings → Typography): heading/body font family, base
 * font size, and heading/body/link colors. Uses !important because the site
 * otherwise styles text with Tailwind utility classes, which would win the
 * cascade over a plain element-selector override.
 */
export default function GlobalTypography() {
  const settings = useSiteSettings();
  const css = useMemo(() => {
    const headingFont = settings.typography_heading_font || "Syne";
    const bodyFont = settings.typography_body_font || "DM Sans";
    const baseSize = parseInt(settings.typography_base_size, 10) || 16;
    const headingColor = settings.typography_heading_color;
    const bodyColor = settings.typography_body_color;
    const linkColor = settings.typography_link_color;

    return `
      html { font-size: ${baseSize}px; }
      body, .font-sans { font-family: '${bodyFont}', sans-serif !important; }
      .font-display, h1, h2, h3, h4, h5, h6 { font-family: '${headingFont}', sans-serif !important; }
      ${headingColor ? `.font-display, h1, h2, h3, h4, h5, h6 { color: ${headingColor} !important; }` : ""}
      ${bodyColor ? `body, p { color: ${bodyColor} !important; }` : ""}
      ${linkColor ? `.rich-text a { color: ${linkColor} !important; }` : ""}
    `;
  }, [settings]);

  return <style data-testid="global-typography-style">{css}</style>;
}
