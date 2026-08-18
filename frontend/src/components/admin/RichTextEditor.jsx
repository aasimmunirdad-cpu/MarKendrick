import { useMemo } from "react";
import ReactQuill, { Quill } from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";

// ---------- MS-Office-style formatting options ----------
// Font family whitelist — the site's own brand fonts plus common Office-style
// choices. Uses Quill's style-based font attributor so the chosen font is
// written as an inline `font-family` style, matching how it's rendered on
// the public site (no extra CSS classes required).
const FONT_WHITELIST = [
  "Syne",
  "DM Sans",
  "Arial",
  "Georgia",
  "Times New Roman",
  "Courier New",
  "Montserrat",
  "Playfair Display",
  "Space Mono",
  "Caveat",
];
const SIZE_WHITELIST = ["12px", "14px", "16px", "18px", "20px", "24px", "28px", "32px", "40px"];

let registered = false;
function registerQuillFormats() {
  if (registered) return;
  registered = true;
  const Font = Quill.import("attributors/style/font");
  Font.whitelist = FONT_WHITELIST;
  Quill.register(Font, true);

  const Size = Quill.import("attributors/style/size");
  Size.whitelist = SIZE_WHITELIST;
  Quill.register(Size, true);
}

const TOOLBAR = [
  [{ font: FONT_WHITELIST }, { size: SIZE_WHITELIST }],
  [{ header: [1, 2, 3, false] }],
  ["bold", "italic", "underline", "strike"],
  [{ color: [] }, { background: [] }],
  [{ script: "sub" }, { script: "super" }],
  [{ list: "ordered" }, { list: "bullet" }],
  [{ indent: "-1" }, { indent: "+1" }],
  [{ align: [] }],
  ["blockquote", "link"],
  ["clean"],
];

const FORMATS = [
  "font", "size", "header",
  "bold", "italic", "underline", "strike",
  "color", "background",
  "script",
  "list", "indent",
  "align",
  "blockquote", "link",
];

/**
 * Full WYSIWYG rich text editor for CMS content fields — font family, size,
 * bold/italic/underline/strike, text/highlight color, sub/superscript, lists,
 * indent, alignment, blockquotes and links. Stores content as sanitized HTML.
 */
export default function RichTextEditor({ value, onChange, testId, minHeight = 220, placeholder }) {
  registerQuillFormats();
  const modules = useMemo(() => ({ toolbar: TOOLBAR }), []);

  return (
    <div
      data-testid={testId}
      className="rich-text-editor bg-background border border-border focus-within:border-vermilion transition-colors"
      style={{ "--rte-min-height": `${minHeight}px` }}
    >
      <ReactQuill
        theme="snow"
        value={value || ""}
        onChange={onChange}
        modules={modules}
        formats={FORMATS}
        placeholder={placeholder}
      />
    </div>
  );
}

export { FONT_WHITELIST, SIZE_WHITELIST };
