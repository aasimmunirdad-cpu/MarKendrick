import { useEffect } from "react";

export default function JsonLd({ id, data }) {
  const json = JSON.stringify(data);
  useEffect(() => {
    const el = document.createElement("script");
    el.type = "application/ld+json";
    el.id = id;
    el.text = json;
    document.head.appendChild(el);
    return () => document.getElementById(id)?.remove();
  }, [id, json]);
  return null;
}
