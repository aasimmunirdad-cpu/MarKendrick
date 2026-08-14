export const GA_ID = "G-7VL4TCG1HL";

export function loadGA() {
  if (typeof window === "undefined" || window.gtag) return;
  const s = document.createElement("script");
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.appendChild(s);
  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { window.dataLayer.push(arguments); };
  window.gtag("js", new Date());
  window.gtag("config", GA_ID);
}

export function trackPage(path) {
  if (window.gtag) {
    window.gtag("event", "page_view", { page_path: path, page_location: window.location.href });
  }
}
