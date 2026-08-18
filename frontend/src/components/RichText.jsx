import DOMPurify from "dompurify";

const HTML_TAG_RE = /<\/?[a-z][\s\S]*>/i;

const SANITIZE_CONFIG = {
  ALLOWED_TAGS: [
    "p", "br", "strong", "b", "em", "i", "u", "s", "strike", "span", "a",
    "ul", "ol", "li", "h1", "h2", "h3", "h4", "blockquote", "sub", "sup", "hr",
  ],
  ALLOWED_ATTR: ["style", "class", "href", "target", "rel"],
};

/**
 * Renders CMS content that may be either legacy plain text (paragraphs
 * separated by a blank line) or HTML produced by the admin rich text editor.
 * HTML is sanitized client-side as defense-in-depth (the backend already
 * sanitizes on save).
 */
export default function RichText({ html, className = "" }) {
  if (!html) return null;

  if (HTML_TAG_RE.test(html)) {
    const clean = DOMPurify.sanitize(html, SANITIZE_CONFIG);
    return <div className={`rich-text ${className}`} dangerouslySetInnerHTML={{ __html: clean }} />;
  }

  return (
    <div className={className}>
      {html.split("\n\n").map((p, i) => (
        <p key={i} className="mb-6 last:mb-0">{p}</p>
      ))}
    </div>
  );
}
