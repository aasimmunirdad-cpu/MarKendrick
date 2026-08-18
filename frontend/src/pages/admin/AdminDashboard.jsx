import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, Navigate } from "react-router-dom";
import { Plus, Pencil, Trash2, LogOut, Loader2, X, Upload, FileText, ExternalLink, Radio, Copy, Image as ImageIcon, Save } from "lucide-react";
import { toast } from "sonner";
import { api, formatApiError } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";
import Seo from "../../components/Seo";

const TABS = ["Posts", "Case Studies", "Services", "Industries", "Locations", "FAQ", "Legal", "Testimonials", "Whitepapers", "Media", "Settings", "Newsletter", "Leads", "Bookings", "Subscribers"];
const EMPTY_POST = { title: "", category: "Strategy", excerpt: "", body: "", author: "Dr Aasim Munir Dad", tags: "", cover: "", read_time: "5 min read", published: true };
const EMPTY_CS = { client: "", title: "", industry: "", services: "", summary: "", challenge: "", approach: "", results: "", quote: "", quote_author: "", cover: "", published: true };

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [tab, setTab] = useState("Posts");
  const [editing, setEditing] = useState(null); // {type:'post'|'cs', data:{}, id?}

  const { data: posts = [], isLoading: lp } = useQuery({ queryKey: ["admin-posts"], queryFn: async () => (await api.get("/admin/posts")).data, enabled: !!user });
  const { data: studies = [], isLoading: lc } = useQuery({ queryKey: ["admin-cs"], queryFn: async () => (await api.get("/admin/case-studies")).data, enabled: !!user });
  const { data: leads = [] } = useQuery({ queryKey: ["admin-leads"], queryFn: async () => (await api.get("/admin/leads")).data, enabled: !!user && tab === "Leads" });
  const { data: bookings = [] } = useQuery({ queryKey: ["admin-bookings"], queryFn: async () => (await api.get("/admin/bookings")).data, enabled: !!user && tab === "Bookings" });
  const { data: subs = [] } = useQuery({ queryKey: ["admin-subs"], queryFn: async () => (await api.get("/admin/subscribers")).data, enabled: !!user && tab === "Subscribers" });
  const { data: testimonials = [], isLoading: lt } = useQuery({ queryKey: ["admin-testimonials"], queryFn: async () => (await api.get("/admin/testimonials")).data, enabled: !!user && tab === "Testimonials" });
  const { data: whitepapers = [], isLoading: lw } = useQuery({ queryKey: ["admin-whitepapers"], queryFn: async () => (await api.get("/admin/whitepapers")).data, enabled: !!user && tab === "Whitepapers" });
  const { data: media = [], isLoading: lm } = useQuery({ queryKey: ["admin-media"], queryFn: async () => (await api.get("/admin/media")).data, enabled: !!user && tab === "Media" });
  const { data: settings, isLoading: ls } = useQuery({ queryKey: ["admin-settings"], queryFn: async () => (await api.get("/admin/settings")).data, enabled: !!user && tab === "Settings" });
  const { data: services = [], isLoading: lsv } = useQuery({ queryKey: ["admin-services"], queryFn: async () => (await api.get("/admin/services")).data, enabled: !!user && tab === "Services" });
  const { data: industries = [], isLoading: lind } = useQuery({ queryKey: ["admin-industries"], queryFn: async () => (await api.get("/admin/industries")).data, enabled: !!user && tab === "Industries" });
  const { data: locations = [], isLoading: lloc } = useQuery({ queryKey: ["admin-locations"], queryFn: async () => (await api.get("/admin/locations")).data, enabled: !!user && tab === "Locations" });
  const { data: faqs = [], isLoading: lfaq } = useQuery({ queryKey: ["admin-faqs"], queryFn: async () => (await api.get("/admin/faqs")).data, enabled: !!user && tab === "FAQ" });
  const { data: legalPages = [], isLoading: lleg } = useQuery({ queryKey: ["admin-legal"], queryFn: async () => (await api.get("/admin/legal-pages")).data, enabled: !!user && tab === "Legal" });

  if (user === null) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-vermilion" size={28} /></div>;
  if (user === false) return <Navigate to="/admin/login" replace />;

  const remove = async (type, id) => {
    if (!window.confirm("Delete permanently?")) return;
    try {
      await api.delete(`/admin/${type === "post" ? "posts" : "case-studies"}/${id}`);
      qc.invalidateQueries({ queryKey: [type === "post" ? "admin-posts" : "admin-cs"] });
      qc.invalidateQueries({ queryKey: [type === "post" ? "posts" : "case-studies"] });
      toast.success("Deleted.");
    } catch (err) {
      toast.error(formatApiError(err));
    }
  };

  const removeRecord = async (path, queryKey, id) => {
    if (!window.confirm("Delete permanently?")) return;
    try {
      await api.delete(`/admin/${path}/${id}`);
      qc.invalidateQueries({ queryKey: [queryKey] });
      toast.success("Deleted.");
    } catch (err) {
      toast.error(formatApiError(err));
    }
  };

  const save = async (type, data, id) => {
    const path = type === "post" ? "/admin/posts" : "/admin/case-studies";
    const payload = type === "post"
      ? { ...data, tags: typeof data.tags === "string" ? data.tags.split(",").map((t) => t.trim()).filter(Boolean) : data.tags }
      : {
          ...data,
          services: typeof data.services === "string" ? data.services.split(",").map((t) => t.trim()).filter(Boolean) : data.services,
          results: typeof data.results === "string"
            ? data.results.split("\n").map((l) => { const [metric, ...rest] = l.split("|"); return metric && rest.length ? { metric: metric.trim(), label: rest.join("|").trim() } : null; }).filter(Boolean)
            : data.results,
        };
    try {
      if (id) await api.put(`${path}/${id}`, payload);
      else await api.post(path, payload);
      qc.invalidateQueries({ queryKey: [type === "post" ? "admin-posts" : "admin-cs"] });
      qc.invalidateQueries({ queryKey: [type === "post" ? "posts" : "case-studies"] });
      setEditing(null);
      toast.success(id ? "Updated." : "Published.");
    } catch (err) {
      toast.error(formatApiError(err));
    }
  };

  const th = "text-left text-xs uppercase tracking-[0.15em] text-muted-foreground py-3 px-4 font-medium";
  const td = "py-3 px-4 text-sm border-t border-border align-top";

  return (
    <div data-testid="admin-dashboard" className="min-h-screen bg-background pt-24 pb-16">
      <Seo title="CMS Dashboard" description="MarKendrick CMS." />
      <div className="max-w-[1200px] mx-auto px-5 sm:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-3xl font-extrabold tracking-tighter">CMS <span className="text-vermilion">Dashboard</span></h1>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
          <div className="flex gap-2">
            {(tab === "Posts" || tab === "Case Studies") && (
              <button
                data-testid="admin-new-button"
                onClick={() => setEditing({ type: tab === "Posts" ? "post" : "cs", data: tab === "Posts" ? { ...EMPTY_POST } : { ...EMPTY_CS } })}
                className="inline-flex items-center gap-2 bg-vermilion hover:bg-vermilion-hover text-white text-sm font-semibold px-5 py-2.5 transition-colors"
              >
                <Plus size={15} /> New {tab === "Posts" ? "Post" : "Case Study"}
              </button>
            )}
            <button
              data-testid="admin-logout-button"
              onClick={async () => { await logout(); navigate("/admin/login"); }}
              className="inline-flex items-center gap-2 border border-border hover:border-vermilion hover:text-vermilion text-sm font-semibold px-5 py-2.5 transition-colors"
            >
              <LogOut size={15} /> Logout
            </button>
          </div>
        </div>

        <div className="flex gap-1 border-b border-border mb-6 overflow-x-auto" data-testid="admin-tabs">
          {TABS.map((t) => (
            <button
              key={t}
              data-testid={`admin-tab-${t.toLowerCase().replace(" ", "-")}`}
              onClick={() => setTab(t)}
              className={`px-4 py-3 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${tab === t ? "border-vermilion text-vermilion" : "border-transparent text-muted-foreground hover:text-foreground"}`}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === "Posts" && (
          <div className="overflow-x-auto border border-border" data-testid="admin-posts-table">
            <table className="w-full min-w-[640px]">
              <thead className="bg-card/60"><tr><th className={th}>Title</th><th className={th}>Category</th><th className={th}>Status</th><th className={th}>Actions</th></tr></thead>
              <tbody>
                {lp ? <tr><td colSpan={4} className={td}><Loader2 className="animate-spin" size={18} /></td></tr>
                : posts.map((p) => (
                  <tr key={p.id} data-testid={`admin-post-row-${p.slug}`}>
                    <td className={td}><span className="font-semibold">{p.title}</span><span className="block text-xs text-muted-foreground">/{p.slug}</span></td>
                    <td className={td}>{p.category}</td>
                    <td className={td}><span className={`text-xs px-2 py-1 ${p.published ? "bg-emerald-500/15 text-emerald-500" : "bg-muted text-muted-foreground"}`}>{p.published ? "Live" : "Draft"}</span></td>
                    <td className={td}>
                      <div className="flex gap-2">
                        <button data-testid={`edit-post-${p.slug}`} onClick={() => setEditing({ type: "post", id: p.id, data: { ...p, tags: p.tags?.join(", ") || "" } })} className="p-2 border border-border hover:border-vermilion hover:text-vermilion transition-colors"><Pencil size={14} /></button>
                        <button data-testid={`delete-post-${p.slug}`} onClick={() => remove("post", p.id)} className="p-2 border border-border hover:border-vermilion hover:text-vermilion transition-colors"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === "Case Studies" && (
          <div className="overflow-x-auto border border-border" data-testid="admin-cs-table">
            <table className="w-full min-w-[640px]">
              <thead className="bg-card/60"><tr><th className={th}>Client / Title</th><th className={th}>Industry</th><th className={th}>Status</th><th className={th}>Actions</th></tr></thead>
              <tbody>
                {lc ? <tr><td colSpan={4} className={td}><Loader2 className="animate-spin" size={18} /></td></tr>
                : studies.map((c) => (
                  <tr key={c.id} data-testid={`admin-cs-row-${c.slug}`}>
                    <td className={td}><span className="font-semibold">{c.client}</span><span className="block text-xs text-muted-foreground">{c.title}</span></td>
                    <td className={td}>{c.industry}</td>
                    <td className={td}><span className={`text-xs px-2 py-1 ${c.published ? "bg-emerald-500/15 text-emerald-500" : "bg-muted text-muted-foreground"}`}>{c.published ? "Live" : "Draft"}</span></td>
                    <td className={td}>
                      <div className="flex gap-2">
                        <button data-testid={`edit-cs-${c.slug}`} onClick={() => setEditing({ type: "cs", id: c.id, data: { ...c, services: c.services?.join(", ") || "", results: (c.results || []).map((r) => `${r.metric} | ${r.label}`).join("\n") } })} className="p-2 border border-border hover:border-vermilion hover:text-vermilion transition-colors"><Pencil size={14} /></button>
                        <button data-testid={`delete-cs-${c.slug}`} onClick={() => remove("cs", c.id)} className="p-2 border border-border hover:border-vermilion hover:text-vermilion transition-colors"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === "Services" && (
          <ServicesTab
            items={services}
            loading={lsv}
            onChanged={() => { qc.invalidateQueries({ queryKey: ["admin-services"] }); qc.invalidateQueries({ queryKey: ["services"] }); }}
          />
        )}

        {tab === "Industries" && (
          <IndustriesTab
            items={industries}
            loading={lind}
            onChanged={() => { qc.invalidateQueries({ queryKey: ["admin-industries"] }); qc.invalidateQueries({ queryKey: ["industries"] }); }}
          />
        )}

        {tab === "Locations" && (
          <LocationsTab
            items={locations}
            loading={lloc}
            onChanged={() => { qc.invalidateQueries({ queryKey: ["admin-locations"] }); qc.invalidateQueries({ queryKey: ["locations"] }); }}
          />
        )}

        {tab === "FAQ" && (
          <FaqTab
            items={faqs}
            loading={lfaq}
            onChanged={() => { qc.invalidateQueries({ queryKey: ["admin-faqs"] }); qc.invalidateQueries({ queryKey: ["faqs"] }); }}
          />
        )}

        {tab === "Legal" && (
          <LegalTab
            items={legalPages}
            loading={lleg}
            onChanged={() => { qc.invalidateQueries({ queryKey: ["admin-legal"] }); qc.invalidateQueries({ queryKey: ["legal-page"] }); }}
          />
        )}

        {tab === "Testimonials" && (
          <TestimonialsTab
            items={testimonials}
            loading={lt}
            onChanged={() => { qc.invalidateQueries({ queryKey: ["admin-testimonials"] }); qc.invalidateQueries({ queryKey: ["testimonials"] }); }}
          />
        )}

        {tab === "Whitepapers" && (
          <WhitepapersTab
            items={whitepapers}
            loading={lw}
            onChanged={() => { qc.invalidateQueries({ queryKey: ["admin-whitepapers"] }); qc.invalidateQueries({ queryKey: ["whitepapers"] }); }}
          />
        )}

        {tab === "Media" && (
          <MediaTab
            items={media}
            loading={lm}
            onChanged={() => qc.invalidateQueries({ queryKey: ["admin-media"] })}
          />
        )}

        {tab === "Settings" && (
          <SettingsTab
            settings={settings}
            loading={ls}
            onChanged={() => { qc.invalidateQueries({ queryKey: ["admin-settings"] }); qc.invalidateQueries({ queryKey: ["site-settings"] }); }}
          />
        )}

        {tab === "Newsletter" && (
          <NewsletterTab posts={posts} />
        )}

        {tab === "Leads" && (
          <div className="overflow-x-auto border border-border" data-testid="admin-leads-table">
            <table className="w-full min-w-[780px]">
              <thead className="bg-card/60"><tr><th className={th}>Name</th><th className={th}>Service</th><th className={th}>Budget</th><th className={th}>Timeline</th><th className={th}>Received</th><th className={th}>Actions</th></tr></thead>
              <tbody>
                {leads.length === 0 && <tr><td colSpan={6} className={td}>No leads yet.</td></tr>}
                {leads.map((l) => (
                  <tr key={l.id}>
                    <td className={td}><span className="font-semibold">{l.name}</span><span className="block text-xs text-muted-foreground">{l.email} {l.company && `· ${l.company}`}</span>{l.message && <span className="block text-xs text-muted-foreground mt-1 max-w-xs">{l.message}</span>}</td>
                    <td className={td}>{l.service || "—"}</td>
                    <td className={td}>{l.budget || "—"}</td>
                    <td className={td}>{l.timeline || "—"}</td>
                    <td className={td}><span className="text-xs text-muted-foreground">{new Date(l.created_at).toLocaleDateString("en-GB")}</span></td>
                    <td className={td}>
                      <button data-testid={`delete-lead-${l.id}`} onClick={() => removeRecord("leads", "admin-leads", l.id)} className="p-2 border border-border hover:border-vermilion hover:text-vermilion transition-colors"><Trash2 size={14} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === "Bookings" && (
          <div className="overflow-x-auto border border-border" data-testid="admin-bookings-table">
            <table className="w-full min-w-[720px]">
              <thead className="bg-card/60"><tr><th className={th}>Name</th><th className={th}>Service</th><th className={th}>When</th><th className={th}>Notes</th><th className={th}>Actions</th></tr></thead>
              <tbody>
                {bookings.length === 0 && <tr><td colSpan={5} className={td}>No bookings yet.</td></tr>}
                {bookings.map((b) => (
                  <tr key={b.id}>
                    <td className={td}><span className="font-semibold">{b.name}</span><span className="block text-xs text-muted-foreground">{b.email} {b.company && `· ${b.company}`}</span></td>
                    <td className={td}>{b.service || "—"}</td>
                    <td className={td}><span className="font-semibold text-vermilion">{b.date} · {b.slot}</span></td>
                    <td className={td}><span className="text-xs text-muted-foreground max-w-xs block">{b.notes || "—"}</span></td>
                    <td className={td}>
                      <button data-testid={`delete-booking-${b.id}`} onClick={() => removeRecord("bookings", "admin-bookings", b.id)} className="p-2 border border-border hover:border-vermilion hover:text-vermilion transition-colors"><Trash2 size={14} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === "Subscribers" && (
          <div className="border border-border p-6" data-testid="admin-subscribers-list">
            {subs.length === 0 ? <p className="text-sm text-muted-foreground">No subscribers yet.</p> : (
              <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {subs.map((s) => (
                  <li key={s.id} className="text-sm border border-border px-4 py-3 flex items-center justify-between gap-3">
                    <span className="truncate">{s.email}</span>
                    <button data-testid={`delete-subscriber-${s.id}`} onClick={() => removeRecord("subscribers", "admin-subs", s.id)} className="p-1.5 border border-border hover:border-vermilion hover:text-vermilion transition-colors shrink-0"><Trash2 size={12} /></button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {editing && <EditorModal editing={editing} onClose={() => setEditing(null)} onSave={save} />}
    </div>
  );
}

function ImagePicker({ value, onChange, testId }) {
  const [showBrowser, setShowBrowser] = useState(false);
  const [uploading, setUploading] = useState(false);
  const { data: media = [], isLoading: loadingMedia } = useQuery({
    queryKey: ["admin-media"],
    queryFn: async () => (await api.get("/admin/media")).data,
    enabled: showBrowser,
  });

  const upload = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await api.post("/admin/media", fd);
      onChange(res.data.url);
      toast.success("Uploaded.");
    } catch (err) {
      toast.error(formatApiError(err));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-3 border border-border p-3">
        <div className="h-14 w-20 bg-background flex items-center justify-center shrink-0 overflow-hidden">
          {value ? <img src={value} alt="" className="w-full h-full object-cover" /> : <ImageIcon size={18} className="text-muted-foreground" />}
        </div>
        <input data-testid={testId} className={inputCls} value={value || ""} onChange={(e) => onChange(e.target.value)} placeholder="Image URL" />
        <div className="flex gap-2 shrink-0">
          <button type="button" onClick={() => setShowBrowser(true)} className="text-xs font-semibold border border-border hover:border-vermilion hover:text-vermilion px-3 py-2.5 transition-colors">Browse</button>
          <label className="text-xs font-semibold border border-border hover:border-vermilion hover:text-vermilion px-3 py-2.5 transition-colors cursor-pointer">
            {uploading ? <Loader2 size={13} className="animate-spin" /> : "Upload"}
            <input type="file" accept="image/png,image/jpeg,image/gif,image/webp,image/svg+xml" className="hidden" disabled={uploading} onChange={(e) => { upload(e.target.files[0]); e.target.value = ""; }} />
          </label>
        </div>
      </div>

      {showBrowser && (
        <div className="fixed inset-0 z-[80] bg-background/80 backdrop-blur-sm flex items-start justify-center overflow-y-auto py-10 px-4" data-lenis-prevent>
          <div className="w-full max-w-3xl bg-card border border-border p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-xl font-bold tracking-tighter">Choose an image</h3>
              <button type="button" onClick={() => setShowBrowser(false)} className="p-2 hover:text-vermilion transition-colors"><X size={18} /></button>
            </div>
            {loadingMedia ? (
              <Loader2 className="animate-spin" size={18} />
            ) : media.length === 0 ? (
              <p className="text-sm text-muted-foreground">No images in the library yet. Upload one, or go to the Media tab and import images already used on the site.</p>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 max-h-[60vh] overflow-y-auto">
                {media.map((m) => (
                  <button key={m.id} type="button" onClick={() => { onChange(m.url); setShowBrowser(false); }} className="aspect-square border border-border hover:border-vermilion transition-colors overflow-hidden">
                    <img src={m.url} alt={m.filename} className="w-full h-full object-cover" loading="lazy" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function EditorModal({ editing, onClose, onSave }) {
  const [data, setData] = useState(editing.data);
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setData((d) => ({ ...d, [k]: v }));
  const isPost = editing.type === "post";

  const input = "w-full bg-background border border-border px-3 py-2.5 text-sm outline-none focus:border-vermilion transition-colors";
  const label = "text-xs uppercase tracking-[0.15em] text-muted-foreground block mb-1.5";

  const fields = isPost
    ? [["title", "Title *"], ["category", "Category"], ["author", "Author"], ["read_time", "Read Time"], ["tags", "Tags (comma separated)"], ["cover", "Cover Image URL"]]
    : [["client", "Client *"], ["title", "Title *"], ["industry", "Industry"], ["services", "Services (comma separated)"], ["quote_author", "Quote Author"], ["cover", "Cover Image URL"]];

  const areas = isPost
    ? [["excerpt", "Excerpt", 2], ["body", "Body (blank line between paragraphs)", 10]]
    : [["summary", "Summary", 2], ["challenge", "Challenge", 4], ["approach", "Approach", 4], ["results", "Results — one per line: +212% | ROAS in 6 months", 3], ["quote", "Client Quote", 2]];

  return (
    <div className="fixed inset-0 z-[70] bg-background/80 backdrop-blur-sm flex items-start justify-center overflow-y-auto py-10 px-4" data-testid="editor-modal" data-lenis-prevent>
      <div className="w-full max-w-2xl bg-card border border-border p-6 sm:p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-2xl font-bold tracking-tighter">{editing.id ? "Edit" : "New"} {isPost ? "Post" : "Case Study"}</h2>
          <button data-testid="editor-close-button" onClick={onClose} className="p-2 hover:text-vermilion transition-colors"><X size={20} /></button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          {fields.map(([k, l]) => (
            <div key={k} className={k === "cover" ? "sm:col-span-2" : ""}>
              <label className={label}>{l}</label>
              {k === "cover" ? (
                <ImagePicker value={data[k]} onChange={(v) => set(k, v)} testId={`editor-field-${k}`} />
              ) : (
                <input data-testid={`editor-field-${k}`} className={input} value={data[k] || ""} onChange={(e) => set(k, e.target.value)} />
              )}
            </div>
          ))}
        </div>
        {areas.map(([k, l, rows]) => (
          <div key={k} className="mb-4">
            <label className={label}>{l}</label>
            <textarea data-testid={`editor-field-${k}`} className={`${input} resize-y`} rows={rows} value={data[k] || ""} onChange={(e) => set(k, e.target.value)} />
          </div>
        ))}
        <label className="flex items-center gap-2 text-sm mb-6 cursor-pointer">
          <input data-testid="editor-published-toggle" type="checkbox" checked={!!data.published} onChange={(e) => set("published", e.target.checked)} className="accent-vermilion w-4 h-4" />
          Published (visible on site)
        </label>
        <div className="flex justify-end gap-3">
          <button data-testid="editor-cancel-button" onClick={onClose} className="px-6 py-3 text-sm font-semibold border border-border hover:border-vermilion transition-colors">Cancel</button>
          <button
            data-testid="editor-save-button"
            disabled={saving || !data.title || (!isPost && !data.client)}
            onClick={async () => { setSaving(true); await onSave(editing.type, data, editing.id); setSaving(false); }}
            className="px-8 py-3 text-sm font-semibold bg-vermilion hover:bg-vermilion-hover text-white transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {saving ? <Loader2 size={15} className="animate-spin" /> : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

const inputCls = "w-full bg-background border border-border px-3 py-2.5 text-sm outline-none focus:border-vermilion transition-colors";
const labelCls = "text-xs uppercase tracking-[0.15em] text-muted-foreground block mb-1.5";

function NewsletterTab({ posts }) {
  const { data: subs = [] } = useQuery({ queryKey: ["admin-subs"], queryFn: async () => (await api.get("/admin/subscribers")).data });
  const { data: log = [], refetch } = useQuery({ queryKey: ["admin-newsletter-log"], queryFn: async () => (await api.get("/admin/newsletter/log")).data });
  const [sendingId, setSendingId] = useState(null);
  const qc = useQueryClient();

  const send = async (post) => {
    if (!window.confirm(`Send "${post.title}" to ${subs.length} subscriber${subs.length === 1 ? "" : "s"}?`)) return;
    setSendingId(post.id);
    try {
      const res = await api.post("/admin/newsletter/send", { post_id: post.id });
      toast.success(`The Signal sent to ${res.data.sent}/${res.data.total} subscribers.`);
      refetch();
      qc.invalidateQueries({ queryKey: ["admin-newsletter-log"] });
    } catch (err) {
      toast.error(formatApiError(err));
    } finally {
      setSendingId(null);
    }
  };

  const published = posts.filter((p) => p.published);
  const th = "text-left text-xs uppercase tracking-[0.15em] text-muted-foreground py-3 px-4 font-medium";
  const td = "py-3 px-4 text-sm border-t border-border align-top";

  return (
    <div data-testid="admin-newsletter-tab">
      <div className="border border-border bg-card/40 p-5 mb-6 flex items-center justify-between">
        <div>
          <p className="font-display font-bold tracking-tight">The Signal — one click, every inbox.</p>
          <p className="text-sm text-muted-foreground">Pick a published article. We email it to <strong className="text-vermilion">{subs.length} subscriber{subs.length === 1 ? "" : "s"}</strong> with your branding.</p>
        </div>
      </div>

      <h3 className="font-display text-lg font-bold tracking-tight mb-3">Published articles</h3>
      <div className="overflow-x-auto border border-border mb-10">
        <table className="w-full min-w-[560px]">
          <thead className="bg-card/60"><tr><th className={th}>Article</th><th className={th}>Category</th><th className={th}>Send</th></tr></thead>
          <tbody>
            {published.length === 0 && <tr><td colSpan={3} className={td}>No published articles yet.</td></tr>}
            {published.map((p) => (
              <tr key={p.id} data-testid={`newsletter-post-${p.slug}`}>
                <td className={td}><span className="font-semibold">{p.title}</span><span className="block text-xs text-muted-foreground">/{p.slug}</span></td>
                <td className={td}>{p.category}</td>
                <td className={td}>
                  <button
                    data-testid={`send-signal-${p.slug}`}
                    onClick={() => send(p)}
                    disabled={sendingId === p.id || subs.length === 0}
                    className="inline-flex items-center gap-2 bg-vermilion hover:bg-vermilion-hover text-white text-xs font-semibold px-4 py-2 transition-colors disabled:opacity-50"
                  >
                    {sendingId === p.id ? <Loader2 size={13} className="animate-spin" /> : <Radio size={13} />} Send The Signal
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3 className="font-display text-lg font-bold tracking-tight mb-3">Send history</h3>
      <div className="overflow-x-auto border border-border">
        <table className="w-full min-w-[560px]">
          <thead className="bg-card/60"><tr><th className={th}>Article</th><th className={th}>Delivered</th><th className={th}>Sent At</th></tr></thead>
          <tbody>
            {log.length === 0 && <tr><td colSpan={3} className={td}>No sends yet.</td></tr>}
            {log.map((l) => (
              <tr key={l.id}>
                <td className={td}>{l.post_title}</td>
                <td className={td}><span className="text-emerald-500 font-semibold">{l.sent_count}/{l.total_subscribers}</span></td>
                <td className={td}><span className="text-xs text-muted-foreground">{new Date(l.sent_at).toLocaleString("en-GB")}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TestimonialsTab({ items, loading, onChanged }) {
  const [editing, setEditing] = useState(null); // {data, id?}
  const [saving, setSaving] = useState(false);
  const EMPTY = { quote: "", name: "", role: "", company: "", industry: "", metric: "", video_url: "", published: true };
  const th = "text-left text-xs uppercase tracking-[0.15em] text-muted-foreground py-3 px-4 font-medium";
  const td = "py-3 px-4 text-sm border-t border-border align-top";

  const save = async () => {
    setSaving(true);
    try {
      if (editing.id) await api.put(`/admin/testimonials/${editing.id}`, editing.data);
      else await api.post("/admin/testimonials", editing.data);
      toast.success("Saved.");
      setEditing(null);
      onChanged();
    } catch (err) {
      toast.error(formatApiError(err));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this testimonial?")) return;
    try {
      await api.delete(`/admin/testimonials/${id}`);
      toast.success("Deleted.");
      onChanged();
    } catch (err) {
      toast.error(formatApiError(err));
    }
  };

  return (
    <div data-testid="admin-testimonials-tab">
      <button data-testid="testimonial-new-button" onClick={() => setEditing({ data: { ...EMPTY } })} className="mb-4 inline-flex items-center gap-2 bg-vermilion hover:bg-vermilion-hover text-white text-sm font-semibold px-5 py-2.5 transition-colors">
        <Plus size={15} /> New Testimonial
      </button>
      <div className="overflow-x-auto border border-border">
        <table className="w-full min-w-[680px]">
          <thead className="bg-card/60"><tr><th className={th}>Quote</th><th className={th}>Person</th><th className={th}>Metric</th><th className={th}>Status</th><th className={th}>Actions</th></tr></thead>
          <tbody>
            {loading ? <tr><td colSpan={5} className={td}><Loader2 className="animate-spin" size={18} /></td></tr>
            : items.map((t) => (
              <tr key={t.id}>
                <td className={td}><span className="line-clamp-2 max-w-sm">{t.quote}</span></td>
                <td className={td}><span className="font-semibold">{t.name}</span><span className="block text-xs text-muted-foreground">{t.role}{t.company ? `, ${t.company}` : ""}</span></td>
                <td className={td}>{t.metric || "—"}</td>
                <td className={td}><span className={`text-xs px-2 py-1 ${t.published ? "bg-emerald-500/15 text-emerald-500" : "bg-muted text-muted-foreground"}`}>{t.published ? "Live" : "Draft"}</span></td>
                <td className={td}>
                  <div className="flex gap-2">
                    <button data-testid={`edit-testimonial-${t.id}`} onClick={() => setEditing({ id: t.id, data: { quote: t.quote, name: t.name, role: t.role || "", company: t.company || "", industry: t.industry || "", metric: t.metric || "", video_url: t.video_url || "", published: t.published } })} className="p-2 border border-border hover:border-vermilion hover:text-vermilion transition-colors"><Pencil size={14} /></button>
                    <button data-testid={`delete-testimonial-${t.id}`} onClick={() => remove(t.id)} className="p-2 border border-border hover:border-vermilion hover:text-vermilion transition-colors"><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && (
        <div className="fixed inset-0 z-[70] bg-background/80 backdrop-blur-sm flex items-start justify-center overflow-y-auto py-10 px-4" data-testid="testimonial-modal" data-lenis-prevent>
          <div className="w-full max-w-xl bg-card border border-border p-6 sm:p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-2xl font-bold tracking-tighter">{editing.id ? "Edit" : "New"} Testimonial</h2>
              <button data-testid="testimonial-modal-close" onClick={() => setEditing(null)} className="p-2 hover:text-vermilion transition-colors"><X size={20} /></button>
            </div>
            <label className={labelCls}>Quote *</label>
            <textarea data-testid="testimonial-field-quote" rows={4} className={`${inputCls} mb-4 resize-y`} value={editing.data.quote} onChange={(e) => setEditing((s) => ({ ...s, data: { ...s.data, quote: e.target.value } }))} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              {[["name", "Name *"], ["role", "Role"], ["company", "Company"], ["industry", "Industry"], ["metric", "Result Metric (e.g. +212% ROAS)"], ["video_url", "Video URL (optional)"]].map(([k, l]) => (
                <div key={k}>
                  <label className={labelCls}>{l}</label>
                  <input data-testid={`testimonial-field-${k}`} className={inputCls} value={editing.data[k]} onChange={(e) => setEditing((s) => ({ ...s, data: { ...s.data, [k]: e.target.value } }))} />
                </div>
              ))}
            </div>
            <label className="flex items-center gap-2 text-sm mb-6 cursor-pointer">
              <input data-testid="testimonial-published-toggle" type="checkbox" checked={!!editing.data.published} onChange={(e) => setEditing((s) => ({ ...s, data: { ...s.data, published: e.target.checked } }))} className="accent-vermilion w-4 h-4" />
              Published (visible on site)
            </label>
            <div className="flex justify-end gap-3">
              <button onClick={() => setEditing(null)} className="px-6 py-3 text-sm font-semibold border border-border hover:border-vermilion transition-colors">Cancel</button>
              <button data-testid="testimonial-save-button" disabled={saving || !editing.data.quote || !editing.data.name} onClick={save} className="px-8 py-3 text-sm font-semibold bg-vermilion hover:bg-vermilion-hover text-white transition-colors disabled:opacity-50 flex items-center gap-2">
                {saving ? <Loader2 size={15} className="animate-spin" /> : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function WhitepapersTab({ items, loading, onChanged }) {
  const [showUpload, setShowUpload] = useState(false);
  const [editing, setEditing] = useState(null); // {data, id}
  const [form, setForm] = useState({ title: "", category: "Report", description: "", pages: "", file: null, published: true });
  const [saving, setSaving] = useState(false);
  const th = "text-left text-xs uppercase tracking-[0.15em] text-muted-foreground py-3 px-4 font-medium";
  const td = "py-3 px-4 text-sm border-t border-border align-top";

  const upload = async () => {
    if (!form.file) { toast.error("Choose a PDF file first."); return; }
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("title", form.title);
      fd.append("category", form.category);
      fd.append("description", form.description);
      fd.append("pages", form.pages);
      fd.append("published", String(form.published));
      fd.append("file", form.file);
      await api.post("/admin/whitepapers", fd);
      toast.success("Report published.");
      setShowUpload(false);
      setForm({ title: "", category: "Report", description: "", pages: "", file: null, published: true });
      onChanged();
    } catch (err) {
      toast.error(formatApiError(err));
    } finally {
      setSaving(false);
    }
  };

  const saveMeta = async () => {
    setSaving(true);
    try {
      const { id, ...meta } = editing.data;
      await api.put(`/admin/whitepapers/${editing.id}`, meta);
      toast.success("Updated.");
      setEditing(null);
      onChanged();
    } catch (err) {
      toast.error(formatApiError(err));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this report and its PDF?")) return;
    try {
      await api.delete(`/admin/whitepapers/${id}`);
      toast.success("Deleted.");
      onChanged();
    } catch (err) {
      toast.error(formatApiError(err));
    }
  };

  return (
    <div data-testid="admin-whitepapers-tab">
      <button data-testid="whitepaper-upload-button" onClick={() => setShowUpload(true)} className="mb-4 inline-flex items-center gap-2 bg-vermilion hover:bg-vermilion-hover text-white text-sm font-semibold px-5 py-2.5 transition-colors">
        <Upload size={15} /> Upload New Report
      </button>
      <div className="overflow-x-auto border border-border">
        <table className="w-full min-w-[680px]">
          <thead className="bg-card/60"><tr><th className={th}>Title</th><th className={th}>Category</th><th className={th}>Status</th><th className={th}>Actions</th></tr></thead>
          <tbody>
            {loading ? <tr><td colSpan={4} className={td}><Loader2 className="animate-spin" size={18} /></td></tr>
            : items.map((w) => (
              <tr key={w.id} data-testid={`admin-whitepaper-row-${w.id}`}>
                <td className={td}>
                  <span className="font-semibold flex items-center gap-2"><FileText size={14} className="text-vermilion" /> {w.title}</span>
                  <a href={w.file_url} target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground hover:text-vermilion inline-flex items-center gap-1 mt-1">View PDF <ExternalLink size={11} /></a>
                </td>
                <td className={td}>{w.category} {w.pages ? `· ${w.pages}` : ""}</td>
                <td className={td}><span className={`text-xs px-2 py-1 ${w.published ? "bg-emerald-500/15 text-emerald-500" : "bg-muted text-muted-foreground"}`}>{w.published ? "Live" : "Draft"}</span></td>
                <td className={td}>
                  <div className="flex gap-2">
                    <button data-testid={`edit-whitepaper-${w.id}`} onClick={() => setEditing({ id: w.id, data: { title: w.title, category: w.category || "Report", description: w.description || "", pages: w.pages || "", published: w.published } })} className="p-2 border border-border hover:border-vermilion hover:text-vermilion transition-colors"><Pencil size={14} /></button>
                    <button data-testid={`delete-whitepaper-${w.id}`} onClick={() => remove(w.id)} className="p-2 border border-border hover:border-vermilion hover:text-vermilion transition-colors"><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showUpload && (
        <div className="fixed inset-0 z-[70] bg-background/80 backdrop-blur-sm flex items-start justify-center overflow-y-auto py-10 px-4" data-testid="whitepaper-upload-modal" data-lenis-prevent>
          <div className="w-full max-w-xl bg-card border border-border p-6 sm:p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-2xl font-bold tracking-tighter">Upload New Report</h2>
              <button onClick={() => setShowUpload(false)} className="p-2 hover:text-vermilion transition-colors"><X size={20} /></button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div className="sm:col-span-2"><label className={labelCls}>Title *</label><input data-testid="upload-field-title" className={inputCls} value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} /></div>
              <div><label className={labelCls}>Category</label><input data-testid="upload-field-category" className={inputCls} value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} /></div>
              <div><label className={labelCls}>Pages (e.g. 12 pages)</label><input data-testid="upload-field-pages" className={inputCls} value={form.pages} onChange={(e) => setForm((f) => ({ ...f, pages: e.target.value }))} /></div>
              <div className="sm:col-span-2"><label className={labelCls}>Description</label><textarea data-testid="upload-field-description" rows={3} className={`${inputCls} resize-y`} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} /></div>
              <div className="sm:col-span-2">
                <label className={labelCls}>PDF File *</label>
                <input data-testid="upload-field-file" type="file" accept="application/pdf" onChange={(e) => setForm((f) => ({ ...f, file: e.target.files[0] || null }))} className="text-sm file:mr-4 file:bg-vermilion file:text-white file:border-0 file:px-4 file:py-2 file:text-xs file:font-semibold file:cursor-pointer" />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm mb-6 cursor-pointer">
              <input data-testid="upload-published-toggle" type="checkbox" checked={form.published} onChange={(e) => setForm((f) => ({ ...f, published: e.target.checked }))} className="accent-vermilion w-4 h-4" />
              Published (visible on site)
            </label>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowUpload(false)} className="px-6 py-3 text-sm font-semibold border border-border hover:border-vermilion transition-colors">Cancel</button>
              <button data-testid="upload-submit-button" disabled={saving || !form.title || !form.file} onClick={upload} className="px-8 py-3 text-sm font-semibold bg-vermilion hover:bg-vermilion-hover text-white transition-colors disabled:opacity-50 flex items-center gap-2">
                {saving ? <Loader2 size={15} className="animate-spin" /> : "Publish Report"}
              </button>
            </div>
          </div>
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-[70] bg-background/80 backdrop-blur-sm flex items-start justify-center overflow-y-auto py-10 px-4" data-testid="whitepaper-edit-modal" data-lenis-prevent>
          <div className="w-full max-w-xl bg-card border border-border p-6 sm:p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-2xl font-bold tracking-tighter">Edit Report</h2>
              <button onClick={() => setEditing(null)} className="p-2 hover:text-vermilion transition-colors"><X size={20} /></button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div className="sm:col-span-2"><label className={labelCls}>Title *</label><input data-testid="edit-wp-field-title" className={inputCls} value={editing.data.title} onChange={(e) => setEditing((s) => ({ ...s, data: { ...s.data, title: e.target.value } }))} /></div>
              <div><label className={labelCls}>Category</label><input className={inputCls} value={editing.data.category} onChange={(e) => setEditing((s) => ({ ...s, data: { ...s.data, category: e.target.value } }))} /></div>
              <div><label className={labelCls}>Pages</label><input className={inputCls} value={editing.data.pages} onChange={(e) => setEditing((s) => ({ ...s, data: { ...s.data, pages: e.target.value } }))} /></div>
              <div className="sm:col-span-2"><label className={labelCls}>Description</label><textarea rows={3} className={`${inputCls} resize-y`} value={editing.data.description} onChange={(e) => setEditing((s) => ({ ...s, data: { ...s.data, description: e.target.value } }))} /></div>
            </div>
            <label className="flex items-center gap-2 text-sm mb-6 cursor-pointer">
              <input type="checkbox" checked={!!editing.data.published} onChange={(e) => setEditing((s) => ({ ...s, data: { ...s.data, published: e.target.checked } }))} className="accent-vermilion w-4 h-4" />
              Published (visible on site)
            </label>
            <div className="flex justify-end gap-3">
              <button onClick={() => setEditing(null)} className="px-6 py-3 text-sm font-semibold border border-border hover:border-vermilion transition-colors">Cancel</button>
              <button data-testid="edit-wp-save-button" disabled={saving || !editing.data.title} onClick={saveMeta} className="px-8 py-3 text-sm font-semibold bg-vermilion hover:bg-vermilion-hover text-white transition-colors disabled:opacity-50 flex items-center gap-2">
                {saving ? <Loader2 size={15} className="animate-spin" /> : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MediaTab({ items, loading, onChanged }) {
  const [uploading, setUploading] = useState(false);
  const [importing, setImporting] = useState(false);

  const handleFile = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await api.post("/admin/media", fd);
      toast.success("Uploaded.");
      onChanged();
      navigator.clipboard?.writeText(res.data.url).catch(() => {});
      toast("URL copied to clipboard.");
    } catch (err) {
      toast.error(formatApiError(err));
    } finally {
      setUploading(false);
    }
  };

  const importExisting = async () => {
    setImporting(true);
    try {
      const res = await api.post("/admin/media/import-existing");
      toast.success(res.data.imported > 0 ? `Imported ${res.data.imported} image${res.data.imported === 1 ? "" : "s"} already used on the site.` : "Nothing new to import — everything's already in the library.");
      onChanged();
    } catch (err) {
      toast.error(formatApiError(err));
    } finally {
      setImporting(false);
    }
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this image? Anything referencing its URL will break.")) return;
    try {
      await api.delete(`/admin/media/${id}`);
      toast.success("Deleted.");
      onChanged();
    } catch (err) {
      toast.error(formatApiError(err));
    }
  };

  const copy = (url) => {
    navigator.clipboard?.writeText(url).then(() => toast.success("URL copied."));
  };

  const sourceLabel = { case_study: "Case study", post: "Blog post", upload: "Uploaded" };

  return (
    <div data-testid="admin-media-tab">
      <div className="border border-border bg-card/40 p-5 mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="font-display font-bold tracking-tight">Media library</p>
          <p className="text-sm text-muted-foreground">Upload new images, or import ones already used on the site — then reuse them anywhere via the picker or a copied URL.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            data-testid="media-import-button"
            onClick={importExisting}
            disabled={importing}
            className="inline-flex items-center gap-2 border border-border hover:border-vermilion hover:text-vermilion text-sm font-semibold px-5 py-2.5 transition-colors disabled:opacity-50"
          >
            {importing ? <Loader2 size={15} className="animate-spin" /> : <ImageIcon size={15} />}
            Import Existing Site Images
          </button>
          <label className="inline-flex items-center gap-2 bg-vermilion hover:bg-vermilion-hover text-white text-sm font-semibold px-5 py-2.5 transition-colors cursor-pointer">
            {uploading ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
            Upload Image
            <input
              data-testid="media-upload-input"
              type="file"
              accept="image/png,image/jpeg,image/gif,image/webp,image/svg+xml"
              className="hidden"
              disabled={uploading}
              onChange={(e) => { handleFile(e.target.files[0]); e.target.value = ""; }}
            />
          </label>
        </div>
      </div>

      {loading ? (
        <Loader2 className="animate-spin" size={18} />
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground border border-border p-6">No images yet. Upload one, or click "Import Existing Site Images" to pull in covers already used by your posts and case studies.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4" data-testid="media-grid">
          {items.map((m) => (
            <div key={m.id} className="border border-border bg-card/40 group" data-testid={`media-item-${m.id}`}>
              <div className="aspect-square bg-background/60 flex items-center justify-center overflow-hidden relative">
                <img src={m.url} alt={m.filename} className="w-full h-full object-contain" loading="lazy" />
                {m.source && m.source !== "upload" && (
                  <span className="absolute top-1.5 left-1.5 text-[10px] uppercase tracking-wide bg-background/90 border border-border px-1.5 py-0.5">{sourceLabel[m.source] || m.source}</span>
                )}
              </div>
              <div className="p-3">
                <p className="text-xs truncate mb-2" title={m.filename}>{m.filename}</p>
                <div className="flex gap-2">
                  <button data-testid={`copy-media-${m.id}`} onClick={() => copy(m.url)} className="flex-1 p-1.5 border border-border hover:border-vermilion hover:text-vermilion transition-colors flex items-center justify-center gap-1 text-xs"><Copy size={12} /> Copy URL</button>
                  <button data-testid={`delete-media-${m.id}`} onClick={() => remove(m.id)} className="p-1.5 border border-border hover:border-vermilion hover:text-vermilion transition-colors"><Trash2 size={12} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SettingsTab({ settings, loading, onChanged }) {
  const [data, setData] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  if (data === null && settings) setData(settings);

  const set = (k, v) => setData((d) => ({ ...d, [k]: v }));

  const uploadLogo = async (file) => {
    if (!file) return;
    setUploadingLogo(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await api.post("/admin/media", fd);
      set("logo_url", res.data.url);
      toast.success("Logo uploaded. Remember to Save.");
    } catch (err) {
      toast.error(formatApiError(err));
    } finally {
      setUploadingLogo(false);
    }
  };

  const save = async () => {
    setSaving(true);
    try {
      await api.put("/admin/settings", data);
      toast.success("Settings saved. Live on site now.");
      onChanged();
    } catch (err) {
      toast.error(formatApiError(err));
    } finally {
      setSaving(false);
    }
  };

  if (loading || !data) return <Loader2 className="animate-spin" size={18} />;

  return (
    <div data-testid="admin-settings-tab" className="max-w-2xl">
      <div className="border border-border bg-card/40 p-5 mb-6">
        <p className="font-display font-bold tracking-tight">Site settings</p>
        <p className="text-sm text-muted-foreground">Controls the logo, footer text and office details shown across the live site.</p>
      </div>

      <div className="mb-6">
        <label className={labelCls}>Logo</label>
        <div className="flex items-center gap-4 border border-border p-4">
          <div className="h-10 w-32 bg-background flex items-center justify-center shrink-0">
            <img src={data.logo_url} alt="Logo preview" className="max-h-8 max-w-full object-contain" />
          </div>
          <input data-testid="settings-field-logo_url" className={`${inputCls} flex-1`} value={data.logo_url} onChange={(e) => set("logo_url", e.target.value)} placeholder="Logo image URL" />
          <label className="inline-flex items-center gap-1.5 border border-border hover:border-vermilion hover:text-vermilion text-xs font-semibold px-3 py-2.5 transition-colors cursor-pointer shrink-0">
            {uploadingLogo ? <Loader2 size={13} className="animate-spin" /> : <ImageIcon size={13} />} Upload
            <input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" className="hidden" disabled={uploadingLogo} onChange={(e) => { uploadLogo(e.target.files[0]); e.target.value = ""; }} />
          </label>
        </div>
      </div>

      <h3 className="font-display text-lg font-bold tracking-tight mb-3">Footer</h3>
      <div className="grid grid-cols-1 gap-4 mb-8">
        <div>
          <label className={labelCls}>Newsletter heading</label>
          <input data-testid="settings-field-footer_newsletter_title" className={inputCls} value={data.footer_newsletter_title} onChange={(e) => set("footer_newsletter_title", e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>Newsletter description</label>
          <input data-testid="settings-field-footer_newsletter_desc" className={inputCls} value={data.footer_newsletter_desc} onChange={(e) => set("footer_newsletter_desc", e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>Copyright line (year is added automatically)</label>
          <input data-testid="settings-field-footer_copyright" className={inputCls} value={data.footer_copyright} onChange={(e) => set("footer_copyright", e.target.value)} />
        </div>
      </div>

      <h3 className="font-display text-lg font-bold tracking-tight mb-3">Office</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <div className="sm:col-span-2">
          <label className={labelCls}>Address</label>
          <input data-testid="settings-field-office_address" className={inputCls} value={data.office_address} onChange={(e) => set("office_address", e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>Email</label>
          <input data-testid="settings-field-office_email" className={inputCls} value={data.office_email} onChange={(e) => set("office_email", e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>Hours</label>
          <input data-testid="settings-field-office_hours" className={inputCls} value={data.office_hours} onChange={(e) => set("office_hours", e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>WhatsApp number</label>
          <input data-testid="settings-field-office_whatsapp" className={inputCls} value={data.office_whatsapp} onChange={(e) => set("office_whatsapp", e.target.value)} />
        </div>
      </div>

      <h3 className="font-display text-lg font-bold tracking-tight mb-3">Page imagery</h3>
      <div className="grid grid-cols-1 gap-4 mb-8">
        <div>
          <label className={labelCls}>About page — studio photo (also used as video poster)</label>
          <ImagePicker value={data.about_office_photo_url} onChange={(v) => set("about_office_photo_url", v)} testId="settings-field-about_office_photo_url" />
        </div>
        <div>
          <label className={labelCls}>Home page — showreel video poster</label>
          <ImagePicker value={data.home_showreel_poster_url} onChange={(v) => set("home_showreel_poster_url", v)} testId="settings-field-home_showreel_poster_url" />
        </div>
        <div>
          <label className={labelCls}>Studio video URL (shown on Home and About — .mp4 link, not managed by the image library)</label>
          <input data-testid="settings-field-studio_video_url" className={inputCls} value={data.studio_video_url} onChange={(e) => set("studio_video_url", e.target.value)} placeholder="/media/studio-session.mp4 or a hosted .mp4 URL" />
        </div>
      </div>

      <button data-testid="settings-save-button" disabled={saving} onClick={save} className="inline-flex items-center gap-2 px-8 py-3 text-sm font-semibold bg-vermilion hover:bg-vermilion-hover text-white transition-colors disabled:opacity-50">
        {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} Save Settings
      </button>
    </div>
  );
}

// ---------- Generic list/editor scaffolding for Services, Industries, Locations, FAQ, Legal ----------

function ListTable({ testId, columns, rows, renderRow, onNew, newLabel, empty }) {
  const th = "text-left text-xs uppercase tracking-[0.15em] text-muted-foreground py-3 px-4 font-medium";
  return (
    <div data-testid={testId}>
      {onNew && (
        <button data-testid={`${testId}-new-button`} onClick={onNew} className="mb-4 inline-flex items-center gap-2 bg-vermilion hover:bg-vermilion-hover text-white text-sm font-semibold px-5 py-2.5 transition-colors">
          <Plus size={15} /> {newLabel}
        </button>
      )}
      <div className="overflow-x-auto border border-border">
        <table className="w-full min-w-[680px]">
          <thead className="bg-card/60"><tr>{columns.map((c) => <th key={c} className={th}>{c}</th>)}</tr></thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan={columns.length} className="py-4 px-4 text-sm border-t border-border">{empty}</td></tr>}
            {rows.map(renderRow)}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const td = "py-3 px-4 text-sm border-t border-border align-top";

function EditorShell({ title, onClose, onSave, saving, disabled, children, wide }) {
  return (
    <div className="fixed inset-0 z-[70] bg-background/80 backdrop-blur-sm flex items-start justify-center overflow-y-auto py-10 px-4" data-lenis-prevent>
      <div className={`w-full ${wide ? "max-w-3xl" : "max-w-2xl"} bg-card border border-border p-6 sm:p-8`}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-2xl font-bold tracking-tighter">{title}</h2>
          <button onClick={onClose} className="p-2 hover:text-vermilion transition-colors"><X size={20} /></button>
        </div>
        {children}
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="px-6 py-3 text-sm font-semibold border border-border hover:border-vermilion transition-colors">Cancel</button>
          <button disabled={saving || disabled} onClick={onSave} className="px-8 py-3 text-sm font-semibold bg-vermilion hover:bg-vermilion-hover text-white transition-colors disabled:opacity-50 flex items-center gap-2">
            {saving ? <Loader2 size={15} className="animate-spin" /> : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

function PublishedToggle({ checked, onChange }) {
  return (
    <label className="flex items-center gap-2 text-sm mb-2 cursor-pointer">
      <input type="checkbox" checked={!!checked} onChange={(e) => onChange(e.target.checked)} className="accent-vermilion w-4 h-4" />
      Published (visible on site)
    </label>
  );
}

// ---------- Services ----------

function ServicesTab({ items, loading, onChanged }) {
  const EMPTY = { slug: "", name: "", short: "", icon: "Search", metaTitle: "", metaDesc: "", hero: "", body: "", deliverables: "", group: "", order: 0, published: true };
  const [editing, setEditing] = useState(null); // {id?, data}
  const [saving, setSaving] = useState(false);

  const openNew = () => setEditing({ data: { ...EMPTY } });
  const openEdit = (s) => setEditing({ id: s.id, data: { ...s, deliverables: (s.deliverables || []).join("\n") } });

  const save = async () => {
    setSaving(true);
    try {
      const payload = { ...editing.data, deliverables: editing.data.deliverables.split("\n").map((l) => l.trim()).filter(Boolean), order: Number(editing.data.order) || 0 };
      if (editing.id) await api.put(`/admin/services/${editing.id}`, payload);
      else await api.post("/admin/services", payload);
      toast.success("Saved.");
      setEditing(null);
      onChanged();
    } catch (err) {
      toast.error(formatApiError(err));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this service? Its detail page will 404.")) return;
    try {
      await api.delete(`/admin/services/${id}`);
      toast.success("Deleted.");
      onChanged();
    } catch (err) {
      toast.error(formatApiError(err));
    }
  };

  const set = (k, v) => setEditing((s) => ({ ...s, data: { ...s.data, [k]: v } }));

  return (
    <div data-testid="admin-services-tab">
      <ListTable
        testId="admin-services-table"
        columns={["Name", "Group", "Status", "Actions"]}
        rows={items}
        empty={loading ? "Loading…" : "No services yet."}
        onNew={openNew}
        newLabel="New Service"
        renderRow={(s) => (
          <tr key={s.id}>
            <td className={td}><span className="font-semibold">{s.name}</span><span className="block text-xs text-muted-foreground">/services/{s.slug}</span></td>
            <td className={td}>{s.group}</td>
            <td className={td}><span className={`text-xs px-2 py-1 ${s.published ? "bg-emerald-500/15 text-emerald-500" : "bg-muted text-muted-foreground"}`}>{s.published ? "Live" : "Draft"}</span></td>
            <td className={td}>
              <div className="flex gap-2">
                <button onClick={() => openEdit(s)} className="p-2 border border-border hover:border-vermilion hover:text-vermilion transition-colors"><Pencil size={14} /></button>
                <button onClick={() => remove(s.id)} className="p-2 border border-border hover:border-vermilion hover:text-vermilion transition-colors"><Trash2 size={14} /></button>
              </div>
            </td>
          </tr>
        )}
      />
      {editing && (
        <EditorShell title={editing.id ? "Edit Service" : "New Service"} onClose={() => setEditing(null)} onSave={save} saving={saving} disabled={!editing.data.name || !editing.data.slug}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            {[["slug", "Slug (URL) *"], ["name", "Name *"], ["group", "Group (hub category)"], ["icon", "Icon (lucide name)"], ["hero", "Detail page headline"], ["metaTitle", "SEO Title"], ["metaDesc", "SEO Description"]].map(([k, l]) => (
              <div key={k}><label className={labelCls}>{l}</label><input className={inputCls} value={editing.data[k] || ""} onChange={(e) => set(k, e.target.value)} /></div>
            ))}
          </div>
          <div className="mb-4"><label className={labelCls}>Short description (used on cards)</label><textarea rows={2} className={`${inputCls} resize-y`} value={editing.data.short || ""} onChange={(e) => set("short", e.target.value)} /></div>
          <div className="mb-4"><label className={labelCls}>Body (blank line between paragraphs)</label><textarea rows={6} className={`${inputCls} resize-y`} value={editing.data.body || ""} onChange={(e) => set("body", e.target.value)} /></div>
          <div className="mb-4"><label className={labelCls}>Deliverables — one per line</label><textarea rows={5} className={`${inputCls} resize-y`} value={editing.data.deliverables || ""} onChange={(e) => set("deliverables", e.target.value)} /></div>
          <PublishedToggle checked={editing.data.published} onChange={(v) => set("published", v)} />
        </EditorShell>
      )}
    </div>
  );
}

// ---------- Industries ----------

function IndustriesTab({ items, loading, onChanged }) {
  const EMPTY = { slug: "", name: "", tagline: "", intro: "", challenges: "", services: "", metaTitle: "", metaDesc: "", order: 0, published: true };
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  const openNew = () => setEditing({ data: { ...EMPTY } });
  const openEdit = (i) => setEditing({ id: i.id, data: { ...i, challenges: (i.challenges || []).join("\n"), services: (i.services || []).join(", ") } });

  const save = async () => {
    setSaving(true);
    try {
      const payload = {
        ...editing.data,
        challenges: editing.data.challenges.split("\n").map((l) => l.trim()).filter(Boolean),
        services: editing.data.services.split(",").map((s) => s.trim()).filter(Boolean),
        order: Number(editing.data.order) || 0,
      };
      if (editing.id) await api.put(`/admin/industries/${editing.id}`, payload);
      else await api.post("/admin/industries", payload);
      toast.success("Saved.");
      setEditing(null);
      onChanged();
    } catch (err) {
      toast.error(formatApiError(err));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this industry? Its detail page will 404.")) return;
    try {
      await api.delete(`/admin/industries/${id}`);
      toast.success("Deleted.");
      onChanged();
    } catch (err) {
      toast.error(formatApiError(err));
    }
  };

  const set = (k, v) => setEditing((s) => ({ ...s, data: { ...s.data, [k]: v } }));

  return (
    <div data-testid="admin-industries-tab">
      <ListTable
        testId="admin-industries-table"
        columns={["Name", "Tagline", "Status", "Actions"]}
        rows={items}
        empty={loading ? "Loading…" : "No industries yet."}
        onNew={openNew}
        newLabel="New Industry"
        renderRow={(i) => (
          <tr key={i.id}>
            <td className={td}><span className="font-semibold">{i.name}</span><span className="block text-xs text-muted-foreground">/industries/{i.slug}</span></td>
            <td className={td}><span className="line-clamp-1 max-w-xs block">{i.tagline}</span></td>
            <td className={td}><span className={`text-xs px-2 py-1 ${i.published ? "bg-emerald-500/15 text-emerald-500" : "bg-muted text-muted-foreground"}`}>{i.published ? "Live" : "Draft"}</span></td>
            <td className={td}>
              <div className="flex gap-2">
                <button onClick={() => openEdit(i)} className="p-2 border border-border hover:border-vermilion hover:text-vermilion transition-colors"><Pencil size={14} /></button>
                <button onClick={() => remove(i.id)} className="p-2 border border-border hover:border-vermilion hover:text-vermilion transition-colors"><Trash2 size={14} /></button>
              </div>
            </td>
          </tr>
        )}
      />
      {editing && (
        <EditorShell title={editing.id ? "Edit Industry" : "New Industry"} onClose={() => setEditing(null)} onSave={save} saving={saving} disabled={!editing.data.name || !editing.data.slug}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            {[["slug", "Slug (URL) *"], ["name", "Name *"], ["tagline", "Tagline"], ["metaTitle", "SEO Title"], ["metaDesc", "SEO Description"]].map(([k, l]) => (
              <div key={k} className={k === "metaDesc" ? "sm:col-span-2" : ""}><label className={labelCls}>{l}</label><input className={inputCls} value={editing.data[k] || ""} onChange={(e) => set(k, e.target.value)} /></div>
            ))}
          </div>
          <div className="mb-4"><label className={labelCls}>Intro paragraph</label><textarea rows={3} className={`${inputCls} resize-y`} value={editing.data.intro || ""} onChange={(e) => set("intro", e.target.value)} /></div>
          <div className="mb-4"><label className={labelCls}>Challenges — one per line</label><textarea rows={4} className={`${inputCls} resize-y`} value={editing.data.challenges || ""} onChange={(e) => set("challenges", e.target.value)} /></div>
          <div className="mb-4"><label className={labelCls}>Related service slugs (comma separated, e.g. market-research, seo)</label><input className={inputCls} value={editing.data.services || ""} onChange={(e) => set("services", e.target.value)} /></div>
          <PublishedToggle checked={editing.data.published} onChange={(v) => set("published", v)} />
        </EditorShell>
      )}
    </div>
  );
}

// ---------- Locations ----------

function LocationsTab({ items, loading, onChanged }) {
  const EMPTY = { slug: "", name: "", eyebrow: "", h1: "", intro: "", body2: "", points: "", metaTitle: "", metaDesc: "", order: 0, published: true };
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  const openNew = () => setEditing({ data: { ...EMPTY } });
  const openEdit = (l) => setEditing({ id: l.id, data: { ...l, points: (l.points || []).join("\n") } });

  const save = async () => {
    setSaving(true);
    try {
      const payload = { ...editing.data, points: editing.data.points.split("\n").map((x) => x.trim()).filter(Boolean), order: Number(editing.data.order) || 0 };
      if (editing.id) await api.put(`/admin/locations/${editing.id}`, payload);
      else await api.post("/admin/locations", payload);
      toast.success("Saved.");
      setEditing(null);
      onChanged();
    } catch (err) {
      toast.error(formatApiError(err));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this location page?")) return;
    try {
      await api.delete(`/admin/locations/${id}`);
      toast.success("Deleted.");
      onChanged();
    } catch (err) {
      toast.error(formatApiError(err));
    }
  };

  const set = (k, v) => setEditing((s) => ({ ...s, data: { ...s.data, [k]: v } }));

  return (
    <div data-testid="admin-locations-tab">
      <ListTable
        testId="admin-locations-table"
        columns={["Name", "Status", "Actions"]}
        rows={items}
        empty={loading ? "Loading…" : "No location pages yet."}
        onNew={openNew}
        newLabel="New Location"
        renderRow={(l) => (
          <tr key={l.id}>
            <td className={td}><span className="font-semibold">{l.name}</span><span className="block text-xs text-muted-foreground">/locations/{l.slug}</span></td>
            <td className={td}><span className={`text-xs px-2 py-1 ${l.published ? "bg-emerald-500/15 text-emerald-500" : "bg-muted text-muted-foreground"}`}>{l.published ? "Live" : "Draft"}</span></td>
            <td className={td}>
              <div className="flex gap-2">
                <button onClick={() => openEdit(l)} className="p-2 border border-border hover:border-vermilion hover:text-vermilion transition-colors"><Pencil size={14} /></button>
                <button onClick={() => remove(l.id)} className="p-2 border border-border hover:border-vermilion hover:text-vermilion transition-colors"><Trash2 size={14} /></button>
              </div>
            </td>
          </tr>
        )}
      />
      {editing && (
        <EditorShell title={editing.id ? "Edit Location" : "New Location"} onClose={() => setEditing(null)} onSave={save} saving={saving} disabled={!editing.data.name || !editing.data.slug}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            {[["slug", "Slug (URL) *"], ["name", "Name *"], ["eyebrow", "Eyebrow label"], ["h1", "Headline"], ["metaTitle", "SEO Title"], ["metaDesc", "SEO Description"]].map(([k, l]) => (
              <div key={k}><label className={labelCls}>{l}</label><input className={inputCls} value={editing.data[k] || ""} onChange={(e) => set(k, e.target.value)} /></div>
            ))}
          </div>
          <div className="mb-4"><label className={labelCls}>Intro paragraph</label><textarea rows={3} className={`${inputCls} resize-y`} value={editing.data.intro || ""} onChange={(e) => set("intro", e.target.value)} /></div>
          <div className="mb-4"><label className={labelCls}>Second paragraph</label><textarea rows={3} className={`${inputCls} resize-y`} value={editing.data.body2 || ""} onChange={(e) => set("body2", e.target.value)} /></div>
          <div className="mb-4"><label className={labelCls}>Why brands here choose us — one point per line</label><textarea rows={4} className={`${inputCls} resize-y`} value={editing.data.points || ""} onChange={(e) => set("points", e.target.value)} /></div>
          <PublishedToggle checked={editing.data.published} onChange={(v) => set("published", v)} />
        </EditorShell>
      )}
    </div>
  );
}

// ---------- FAQ ----------

function FaqTab({ items, loading, onChanged }) {
  const EMPTY = { group: "", question: "", answer: "", order: 0, published: true };
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  const openNew = () => setEditing({ data: { ...EMPTY, order: items.length } });
  const openEdit = (f) => setEditing({ id: f.id, data: { ...f } });

  const save = async () => {
    setSaving(true);
    try {
      const payload = { ...editing.data, order: Number(editing.data.order) || 0 };
      if (editing.id) await api.put(`/admin/faqs/${editing.id}`, payload);
      else await api.post("/admin/faqs", payload);
      toast.success("Saved.");
      setEditing(null);
      onChanged();
    } catch (err) {
      toast.error(formatApiError(err));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this FAQ?")) return;
    try {
      await api.delete(`/admin/faqs/${id}`);
      toast.success("Deleted.");
      onChanged();
    } catch (err) {
      toast.error(formatApiError(err));
    }
  };

  const set = (k, v) => setEditing((s) => ({ ...s, data: { ...s.data, [k]: v } }));

  return (
    <div data-testid="admin-faq-tab">
      <ListTable
        testId="admin-faq-table"
        columns={["Question", "Group", "Order", "Status", "Actions"]}
        rows={items}
        empty={loading ? "Loading…" : "No FAQs yet."}
        onNew={openNew}
        newLabel="New FAQ"
        renderRow={(f) => (
          <tr key={f.id}>
            <td className={td}><span className="line-clamp-2 max-w-md">{f.question}</span></td>
            <td className={td}>{f.group}</td>
            <td className={td}>{f.order}</td>
            <td className={td}><span className={`text-xs px-2 py-1 ${f.published ? "bg-emerald-500/15 text-emerald-500" : "bg-muted text-muted-foreground"}`}>{f.published ? "Live" : "Draft"}</span></td>
            <td className={td}>
              <div className="flex gap-2">
                <button onClick={() => openEdit(f)} className="p-2 border border-border hover:border-vermilion hover:text-vermilion transition-colors"><Pencil size={14} /></button>
                <button onClick={() => remove(f.id)} className="p-2 border border-border hover:border-vermilion hover:text-vermilion transition-colors"><Trash2 size={14} /></button>
              </div>
            </td>
          </tr>
        )}
      />
      {editing && (
        <EditorShell title={editing.id ? "Edit FAQ" : "New FAQ"} onClose={() => setEditing(null)} onSave={save} saving={saving} disabled={!editing.data.question}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div><label className={labelCls}>Group (section heading)</label><input className={inputCls} value={editing.data.group || ""} onChange={(e) => set("group", e.target.value)} placeholder="e.g. The Agency" /></div>
            <div><label className={labelCls}>Order (lower = earlier)</label><input type="number" className={inputCls} value={editing.data.order} onChange={(e) => set("order", e.target.value)} /></div>
          </div>
          <div className="mb-4"><label className={labelCls}>Question *</label><input className={inputCls} value={editing.data.question || ""} onChange={(e) => set("question", e.target.value)} /></div>
          <div className="mb-4"><label className={labelCls}>Answer</label><textarea rows={4} className={`${inputCls} resize-y`} value={editing.data.answer || ""} onChange={(e) => set("answer", e.target.value)} /></div>
          <PublishedToggle checked={editing.data.published} onChange={(v) => set("published", v)} />
        </EditorShell>
      )}
    </div>
  );
}

// ---------- Legal pages ----------

function LegalTab({ items, loading, onChanged }) {
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  const sectionsToText = (sections) => (sections || []).map((s) => `${s.h} | ${s.p}`).join("\n");
  const textToSections = (text) => text.split("\n").map((l) => l.trim()).filter(Boolean).map((l) => {
    const [h, ...rest] = l.split("|");
    return { h: (h || "").trim(), p: rest.join("|").trim() };
  });

  const openEdit = (doc) => setEditing({ slug: doc.slug, data: { ...doc, sectionsText: sectionsToText(doc.sections) } });

  const save = async () => {
    setSaving(true);
    try {
      const payload = { ...editing.data, sections: textToSections(editing.data.sectionsText) };
      delete payload.sectionsText;
      await api.put(`/admin/legal-pages/${editing.slug}`, payload);
      toast.success("Saved.");
      setEditing(null);
      onChanged();
    } catch (err) {
      toast.error(formatApiError(err));
    } finally {
      setSaving(false);
    }
  };

  const set = (k, v) => setEditing((s) => ({ ...s, data: { ...s.data, [k]: v } }));

  return (
    <div data-testid="admin-legal-tab">
      <ListTable
        testId="admin-legal-table"
        columns={["Page", "Last Updated", "Actions"]}
        rows={items}
        empty={loading ? "Loading…" : "No legal pages yet."}
        renderRow={(doc) => (
          <tr key={doc.slug}>
            <td className={td}><span className="font-semibold">{doc.title}</span><span className="block text-xs text-muted-foreground">/{doc.slug}</span></td>
            <td className={td}>{doc.updated}</td>
            <td className={td}>
              <button onClick={() => openEdit(doc)} className="p-2 border border-border hover:border-vermilion hover:text-vermilion transition-colors"><Pencil size={14} /></button>
            </td>
          </tr>
        )}
      />
      {editing && (
        <EditorShell title={`Edit ${editing.data.title}`} onClose={() => setEditing(null)} onSave={save} saving={saving} wide>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div><label className={labelCls}>Title</label><input className={inputCls} value={editing.data.title || ""} onChange={(e) => set("title", e.target.value)} /></div>
            <div><label className={labelCls}>Updated label</label><input className={inputCls} value={editing.data.updated || ""} onChange={(e) => set("updated", e.target.value)} placeholder="Last updated: August 2026" /></div>
            <div className="sm:col-span-2"><label className={labelCls}>SEO Description</label><input className={inputCls} value={editing.data.metaDesc || ""} onChange={(e) => set("metaDesc", e.target.value)} /></div>
          </div>
          <div className="mb-4">
            <label className={labelCls}>Sections — one per line, format: Heading | Paragraph text</label>
            <textarea rows={14} className={`${inputCls} resize-y font-mono text-xs`} value={editing.data.sectionsText || ""} onChange={(e) => set("sectionsText", e.target.value)} />
          </div>
        </EditorShell>
      )}
    </div>
  );
}
