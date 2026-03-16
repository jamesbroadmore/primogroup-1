import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Plus, FileText, Loader2, X, Lock, Search } from "lucide-react";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { toast } from "sonner";
import { fullName } from "@/lib/display-names";

const CATEGORIES = [
  { value: "general", label: "General" },
  { value: "personal_care", label: "Personal Care" },
  { value: "community_access", label: "Community Access" },
  { value: "behaviour", label: "Behaviour" },
  { value: "medication", label: "Medication" },
  { value: "health", label: "Health" },
  { value: "skill_development", label: "Skill Development" },
  { value: "other", label: "Other" },
];

export default function CaseNotes() {
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState("");

  const { data: notes = [], isLoading } = useQuery({
    queryKey: ["case-notes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("case_notes")
        .select("*, staff:staff_id(first_name, last_name, preferred_name), client:client_id(first_name, last_name, preferred_name)")
        .order("note_date", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
  });

  const filtered = search.trim()
    ? notes.filter((n: any) => {
        const q = search.toLowerCase();
        return (
          n.content?.toLowerCase().includes(q) ||
          fullName(n.client).toLowerCase().includes(q) ||
          fullName(n.staff).toLowerCase().includes(q) ||
          n.category?.toLowerCase().includes(q)
        );
      })
    : notes;

  return (
    <AppLayout title="Case Notes">
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <p className="text-sm text-muted-foreground">{filtered.length} notes</p>
            <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full flex items-center gap-1">
              <Lock className="h-2.5 w-2.5" /> Immutable after 1 hour
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search notes..."
                className="h-9 pl-9 pr-3 w-56 rounded-lg border bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <button onClick={() => setShowAdd(true)}
              className="h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium flex items-center gap-2 hover:opacity-90 transition-opacity">
              <Plus className="h-4 w-4" /> New Note
            </button>
          </div>
        </div>

        {showAdd && <AddCaseNoteDialog onClose={() => setShowAdd(false)} />}

        {isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : filtered.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl bg-card p-12 shadow-card border border-border/50 text-center">
            <p className="text-muted-foreground text-sm">{notes.length === 0 ? 'No case notes yet. Click "New Note" to add one.' : "No notes match your search."}</p>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {filtered.map((n: any, i: number) => (
              <motion.div key={n.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                className="rounded-xl bg-card p-5 shadow-card border border-border/50">
                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <FileText className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-card-foreground">{fullName(n.client)}</p>
                        <p className="text-xs text-muted-foreground">
                          {fullName(n.staff)} · {format(new Date(n.note_date), "MMM d, yyyy h:mm a")}
                          {n.category && ` · ${n.category}`}
                        </p>
                      </div>
                      {n.is_confidential && (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-destructive/10 text-destructive shrink-0">Confidential</span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{n.content}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}

function AddCaseNoteDialog({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: staffProfile } = useQuery({
    queryKey: ["my-staff-id-notes", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase.from("profiles").select("staff_id").eq("user_id", user.id).single();
      return data?.staff_id || null;
    },
    enabled: !!user,
  });

  const { data: clientList = [] } = useQuery({
    queryKey: ["client-list-notes"],
    queryFn: async () => {
      const { data, error } = await supabase.from("clients").select("id, first_name, last_name, preferred_name").eq("status", "active").order("first_name");
      if (error) throw error;
      return data;
    },
  });

  const [form, setForm] = useState({
    client_id: "",
    category: "general",
    content: "",
    is_confidential: false,
  });

  const mutation = useMutation({
    mutationFn: async () => {
      if (!form.client_id) throw new Error("Please select a client");
      if (!form.content.trim()) throw new Error("Note content is required");
      const { error } = await supabase.from("case_notes").insert({
        client_id: form.client_id,
        staff_id: staffProfile || null,
        category: form.category,
        content: form.content.trim(),
        is_confidential: form.is_confidential,
        created_by: user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Case note saved — this record is now immutable after 1 hour");
      queryClient.invalidateQueries({ queryKey: ["case-notes"] });
      onClose();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md rounded-xl bg-card shadow-xl border border-border"
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-lg font-semibold text-card-foreground">New Case Note</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }} className="p-5 space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Client *</label>
            <select value={form.client_id} onChange={(e) => setForm({ ...form, client_id: e.target.value })}
              className="w-full h-9 rounded-lg border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
              <option value="">Select client...</option>
              {clientList.map((c: any) => (
                <option key={c.id} value={c.id}>{c.preferred_name ? `${c.preferred_name} ${c.last_name}` : `${c.first_name} ${c.last_name}`}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Category</label>
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full h-9 rounded-lg border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
              {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Note *</label>
            <textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })}
              placeholder="Describe the support provided, observations, client mood..." rows={4}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.is_confidential} onChange={(e) => setForm({ ...form, is_confidential: e.target.checked })} className="rounded border-border" />
            <span className="text-xs text-muted-foreground">Mark as confidential (admin-only visibility)</span>
          </label>
          <div className="rounded-lg bg-muted/50 border border-border p-3">
            <p className="text-[10px] text-muted-foreground flex items-center gap-1"><Lock className="h-3 w-3" /> Case notes become immutable 1 hour after creation.</p>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="h-9 px-4 rounded-lg border text-sm font-medium text-foreground hover:bg-secondary transition-colors">Cancel</button>
            <button type="submit" disabled={mutation.isPending} className="h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium flex items-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50">
              {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Save Note
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
