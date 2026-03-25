import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Loader2, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { Navigate } from "react-router-dom";
import cartersLogo from "@/assets/Carters-Logo.png";
import cartersIcon from "@/assets/icon.png";

export default function Login() {
  const { signIn, session, loading: authLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  if (!authLoading && session) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signIn(email, password);
      toast.success("Welcome back!");
    } catch (err: any) {
      toast.error(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" style={{ background: "linear-gradient(135deg, #f5f3ff 0%, #ede9fe 30%, #dbeafe 70%, #e0f2fe 100%)" }}>
      {/* Left decorative panel - hidden on mobile */}
      <div className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center p-12 relative overflow-hidden">
        {/* Background circles */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 -left-20 w-72 h-72 rounded-full opacity-20" style={{ background: "linear-gradient(135deg, #a78bfa, #8b5cf6)" }} />
          <div className="absolute -bottom-20 -right-20 w-96 h-96 rounded-full opacity-15" style={{ background: "linear-gradient(135deg, #60a5fa, #3b82f6)" }} />
          <div className="absolute top-1/2 left-1/3 w-48 h-48 rounded-full opacity-10" style={{ background: "linear-gradient(135deg, #4ade80, #22c55e)" }} />
        </div>
        
        <div className="relative z-10 text-center max-w-md">
          <div className="flex items-center justify-center gap-3 mb-8">
            <img src={cartersIcon} alt="" className="h-16 w-16 rounded-2xl shadow-xl" />
            <div className="text-left">
              <h1 className="text-3xl font-black text-slate-800 leading-tight">Carter's</h1>
              <h1 className="text-3xl font-black leading-tight" style={{ background: "linear-gradient(135deg, #8b5cf6, #3b82f6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Care</h1>
            </div>
          </div>
          
          <h2 className="text-2xl font-bold text-slate-700 mb-4">Care Management Platform</h2>
          <p className="text-slate-500 leading-relaxed">
            Streamline your NDIS and aged care operations — rostering, compliance, incidents, timesheets and more.
          </p>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-2 justify-center mt-8">
            {["Rostering", "Compliance", "Case Notes", "Timesheets", "Incidents", "Reports"].map((f) => (
              <span key={f} className="text-xs font-semibold px-3 py-1.5 rounded-full bg-white/60 backdrop-blur text-slate-600 shadow-sm border border-white/80">{f}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Right login panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm"
        >
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-2">
              <img src={cartersIcon} alt="" className="h-10 w-10 rounded-xl shadow-md" />
              <img src={cartersLogo} alt="Carters Care Group" className="h-8" />
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-2xl border border-white/80 overflow-hidden">
            {/* Header bar */}
            <div className="h-2" style={{ background: "linear-gradient(90deg, #8b5cf6, #60a5fa, #4ade80)" }} />

            <div className="p-8">
              <div className="mb-7">
                <h2 className="text-2xl font-bold text-slate-800">Welcome back</h2>
                <p className="text-sm text-slate-500 mt-1">Sign in to your Carter's Care account</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-2 block uppercase tracking-wide">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                      maxLength={255}
                      className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-2 block uppercase tracking-wide">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type={showPw ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      minLength={6}
                      maxLength={128}
                      className="w-full h-11 pl-10 pr-10 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all"
                    />
                    <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 rounded-xl text-white text-sm font-bold flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50 shadow-lg mt-2"
                  style={{ background: "linear-gradient(135deg, #8b5cf6, #7c3aed)" }}
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Sign In
                </button>
              </form>

              <p className="text-center text-xs text-slate-400 mt-5">
                Contact your administrator for account access.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
