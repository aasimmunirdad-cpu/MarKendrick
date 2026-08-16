import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, Navigate } from "react-router-dom";
import { Plus, Pencil, Trash2, LogOut, Loader2, X, Upload, FileText, ExternalLink, Radio } from "lucide-react";
import { toast } from "sonner";
import { api, formatApiError } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";
import Seo from "../../components/Seo";

const TABS = ["Posts", "Case Studies", "Testimonials", "Whitepapers", "Newsletter", "Leads", "Bookings", "Subscribers"];
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

        {tab === "Newsletter" && (
          <NewsletterTab posts={posts} />
        )}

        {tab === "Leads" && (
          <div className="overflow-x-auto border border-border" data-testid="admin-leads-table">
            <table className="w-full min-w-[720px]">
              <thead className="bg-card/60"><tr><th className={th}>Name</th><th className={th}>Service</th><th className={th}>Budget</th><th className={th}>Timeline</th><th className={th}>Received</th></tr></thead>
              <tbody>
                {leads.length === 0 && <tr><td colSpan={5} className={td}>No leads yet.</td></tr>}
                {leads.map((l) => (
                  <tr key={l.id}>
                    <td className={td}><span className="font-semibold">{l.name}</span><span className="block text-xs text-muted-foreground">{l.email} {l.company && `· ${l.company}`}</span>{l.message && <span className="block text-xs text-muted-foreground mt-1 max-w-xs">{l.message}</span>}</td>
                    <td className={td}>{l.service || "—"}</td>
                    <td className={td}>{l.budget || "—"}</td>
                    <td className={td}>{l.timeline || "—"}</td>
                    <td className={td}><span className="text-xs text-muted-foreground">{new Date(l.created_at).toLocaleDateString("en-GB")}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === "Bookings" && (
          <div className="overflow-x-auto border border-border" data-testid="admin-bookings-table">
            <table className="w-full min-w-[640px]">
              <thead className="bg-card/60"><tr><th className={th}>Name</th><th className={th}>Service</th><th className={th}>When</th><th className={th}>Notes</th></tr></thead>
              <tbody>
                {bookings.length === 0 && <tr><td colSpan={4} className={td}>No bookings yet.</td></tr>}
                {bookings.map((b) => (
                  <tr key={b.id}>
                    <td className={td}><span className="font-semibold">{b.name}</span><span className="block text-xs text-muted-foreground">{b.email} {b.company && `· ${b.company}`}</span></td>
                    <td className={td}>{b.service || "—"}</td>
                    <td className={td}><span className="font-semibold text-vermilion">{b.date} · {b.slot}</span></td>
                    <td className={td}><span className="text-xs text-muted-foreground max-w-xs block">{b.notes || "—"}</span></td>
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
                {subs.map((s) => <li key={s.id} className="text-sm border border-border px-4 py-3">{s.email}</li>)}
              </ul>
            )}
          </div>
        )}
      </div>

      {editing && <EditorModal editing={editing} onClose={() => setEditing(null)} onSave={save} />}
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
    <div className="fixed inset-0 z-[70] bg-background/80 backdrop-blur-sm flex items-start justify-center overflow-y-auto py-10 px-4" data-testid="editor-modal">
      <div className="w-full max-w-2xl bg-card border border-border p-6 sm:p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-2xl font-bold tracking-tighter">{editing.id ? "Edit" : "New"} {isPost ? "Post" : "Case Study"}</h2>
          <button data-testid="editor-close-button" onClick={onClose} className="p-2 hover:text-vermilion transition-colors"><X size={20} /></button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          {fields.map(([k, l]) => (
            <div key={k}>
              <label className={label}>{l}</label>
              <input data-testid={`editor-field-${k}`} className={input} value={data[k] || ""} onChange={(e) => set(k, e.target.value)} />
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
        <div className="fixed inset-0 z-[70] bg-background/80 backdrop-blur-sm flex items-start justify-center overflow-y-auto py-10 px-4" data-testid="testimonial-modal">
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
        <div className="fixed inset-0 z-[70] bg-background/80 backdrop-blur-sm flex items-start justify-center overflow-y-auto py-10 px-4" data-testid="whitepaper-upload-modal">
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
        <div className="fixed inset-0 z-[70] bg-background/80 backdrop-blur-sm flex items-start justify-center overflow-y-auto py-10 px-4" data-testid="whitepaper-edit-modal">
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
