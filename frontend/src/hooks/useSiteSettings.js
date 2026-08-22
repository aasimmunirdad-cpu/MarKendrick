import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";

export const DEFAULT_SITE_SETTINGS = {
  logo_url: "/media/brand/logo-color-mark.png",
  footer_newsletter_title: "One email a month. Zero fluff.",
  footer_newsletter_desc: "Consumer psychology, performance media, brand science. Unsubscribe anytime.",
  footer_copyright: "MarKendrick. Insights that Inform. Strategies that Perform.",
  office_address: "G-12 Commercial, DHA Phase-I, Lahore, Punjab, Pakistan",
  office_email: "hello@markendrick.com",
  office_hours: "Mon–Fri, 9:00–18:00 PKT",
  office_whatsapp: "923339395444",
  facebook_url: "https://www.facebook.com/share/18kcWG5kt1/?mibextid=wwXIfr",
  instagram_url: "https://www.instagram.com/markendrick360?igsi=aDkzZ2gzNnQ1c3Fu&utm_source=qr",
  studio_video_url: "/media/studio-session.mp4",
  about_office_photo_url: "/media/office/office-1.jpg",
  home_showreel_poster_url: "/media/office/office-2.jpg",
  typography_heading_font: "Sora",
  typography_body_font: "DM Sans",
  typography_base_size: "16",
  typography_heading_color: "",
  typography_body_color: "",
  typography_link_color: "",
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
