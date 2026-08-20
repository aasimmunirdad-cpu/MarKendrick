import { useState } from "react";
import { ImageOff } from "lucide-react";

/**
 * Drop-in replacement for a plain <img> cover/hero image that degrades
 * gracefully instead of showing the browser's broken-image icon (or, worse,
 * silently collapsing its box and warping the surrounding layout) when the
 * URL 404s. Keeps the same box/aspect ratio either way so grids and
 * flex/columns around it never reflow, and shows a neutral placeholder
 * (not a fabricated stock photo) so it reads as "no image yet" rather than
 * "something broke".
 */
export default function CoverImage({ src, alt, className = "", imgClassName = "" }) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div className={`flex items-center justify-center bg-secondary/60 text-muted-foreground/50 ${className}`}>
        <ImageOff size={28} strokeWidth={1.5} />
      </div>
    );
  }

  return (
    <div className={className}>
      <img
        src={src}
        alt={alt}
        loading="lazy"
        onError={() => setFailed(true)}
        className={imgClassName}
      />
    </div>
  );
}
