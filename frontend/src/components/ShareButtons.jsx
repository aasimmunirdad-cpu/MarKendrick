import { useState } from "react";
import { Twitter, Linkedin, Facebook, Link2, Check } from "lucide-react";
import { toast } from "sonner";

export default function ShareButtons({ title }) {
  const [copied, setCopied] = useState(false);
  const url = typeof window !== "undefined" ? window.location.href : "";
  const text = encodeURIComponent(title);
  const encoded = encodeURIComponent(url);

  const links = [
    { id: "x", label: "X", Icon: Twitter, href: `https://twitter.com/intent/tweet?text=${text}&url=${encoded}` },
    { id: "linkedin", label: "LinkedIn", Icon: Linkedin, href: `https://www.linkedin.com/sharing/share-offsite/?url=${encoded}` },
    { id: "facebook", label: "Facebook", Icon: Facebook, href: `https://www.facebook.com/sharer/sharer.php?u=${encoded}` },
  ];

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Link copied.");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy - copy the URL from your address bar.");
    }
  };

  return (
    <div className="flex items-center gap-2" data-testid="share-buttons">
      <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground mr-2">Share</span>
      {links.map(({ id, label, Icon, href }) => (
        <a
          key={id}
          data-testid={`share-${id}`}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Share on ${label}`}
          className="p-2.5 border border-border rounded-full hover:border-vermilion hover:text-vermilion transition-colors"
        >
          <Icon size={15} />
        </a>
      ))}
      <button
        data-testid="share-copy-link"
        onClick={copy}
        aria-label="Copy link"
        className="p-2.5 border border-border rounded-full hover:border-vermilion hover:text-vermilion transition-colors"
      >
        {copied ? <Check size={15} className="text-emerald-500" /> : <Link2 size={15} />}
      </button>
    </div>
  );
}
