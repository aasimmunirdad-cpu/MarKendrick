import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";

export const DEFAULT_SITE_SETTINGS = {
  logo_url: "/media/brand/logo-color-mark.png",
  footer_newsletter_title: "One email a month. Zero fluff.",
  footer_newsletter_desc: "Consumer psychology, performance media, brand science. Unsubscribe anytime.",
  footer_copyright: "MarKendrick. Insights that Inform. Strategies that Perform.",
  office_address: "Gulberg III, Lahore, Punjab, Pakistan",
  office_email: "hello@markendrick.com",
  office_hours: "Mon–Fri, 9:00–18:00 PKT",
  office_whatsapp: "923339395444",
  studio_video_url: "/media/studio-session.mp4",
  about_office_photo_url: "/media/office/office-1.jpg",
  home_showreel_poster_url: "/media/office/office-2.jpg",
};

export function useSiteSettings() {
  const { data } = useQuery({
    queryKey: ["site-settings"],
    queryFn: () => api.get("/settings").then((r) => r.data),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
  return { ...DEFAULT_SITE_SETTINGS, ...(data || {}) };
}
