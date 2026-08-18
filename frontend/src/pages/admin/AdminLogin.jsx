import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2, Lock } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { formatApiError } from "../../lib/api";
import Seo from "../../components/Seo";

export default function AdminLogin() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate("/admin");
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div data-testid="admin-login-page" className="min-h-[100svh] flex items-center justify-center px-5 bg-background">
      <Seo title="Admin Login" description="MarKendrick CMS login." />
      <motion.form
        onSubmit={submit}
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-sm border border-border bg-card/60 p-8"
        data-testid="admin-login-form"
      >
        <p className="font-display font-extrabold text-xl tracking-tight mb-1">Mar<span className="text-vermilion">Kendrick</span></p>
        <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground mb-8 flex items-center gap-2"><Lock size={12} /> CMS Access</p>
        {error && <p data-testid="admin-login-error" className="text-sm text-vermilion mb-4 border border-vermilion/40 bg-vermilion/10 px-3 py-2">{error}</p>}
        <label className="text-xs uppercase tracking-[0.2em] text-muted-foreground block mb-2">Email</label>
        <input
          data-testid="admin-email-input"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full bg-background border border-border px-4 py-3 text-sm outline-none focus:border-vermilion transition-colors mb-4"
        />
        <label className="text-xs uppercase tracking-[0.2em] text-muted-foreground block mb-2">Password</label>
        <input
          data-testid="admin-password-input"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full bg-background border border-border px-4 py-3 text-sm outline-none focus:border-vermilion transition-colors mb-6"
        />
        <button
          data-testid="admin-login-submit-button"
          type="submit"
          disabled={loading}
          className="w-full bg-vermilion hover:bg-vermilion-hover text-white font-semibold py-3.5 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : "Sign In"}
        </button>
      </motion.form>
    </div>
  );
}
