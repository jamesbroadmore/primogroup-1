import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Plus, FileText, Loader2, X } from "lucide-react";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { toast } from "sonner";

const CATEGORIES = [
  { value: "general", label: "General" },
  { value: "personal_care", label: "Personal Care" },
  { value: "community_access", label: "Community Access" },
  { value: "behaviour", label: "Behaviour" },
  { value: "medication", label: "Medication" },
  { value: "health", label: "Health" },
  { value: "other", label: "Other" },
];

export default function CaseNotes() {
  const [showAdd, setShowAdd] = useState(false);

  const { data: notes = [], isLoading } = useQuery({
    queryKey: ["case-notes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("case_notes")
        .select("*, staff:staff_id(first_name, last_name), client:client_id(first_name, last_name)")
        .order("note_date", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
  });

  return (
    <AppLayout title="Case Notes">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{notes.length} notes</p>
          <button
            onClick={() => setShowAdd(true)}
            className="h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium flex items-center gap-2 hover:opacity-90 transition-opacity"
          >
            <Plus className="h-4 w-4" /> New Note
          </button>
        </div>

        {showAdd && <AddCaseNoteDialog onClose={() => setShowAdd(false)} />}

        {isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : notes.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl bg-card p-12 shadow-card border border-border/50 text-center">
            <p className="text-muted-foreground text-sm">No case notes yet. Click "New Note" to add one.</p>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {notes.map((n: any, i: number) => (
              <motion.div key={n.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="rounded-xl bg-card p-5 shadow-card border border-border/50">
                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <FileText className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-card-foreground">
                      {n.client ? `${n.client.first_name} ${n.client.last_name}` : "Unknown Client"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {n.staff ? `${n.staff.first_name} ${n.staff.last_name}` : "Unknown"} · {format(new Date(n.note_date), "MMM d, yyyy")}
                      {n.category && ` · ${n.category}`}
                    </p>
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
      const { data, error } = await supabase.from("clients").select("id, first_name, last_name").eq("status", "active").order("first_name");
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
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Case note added");
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
              {clientList.map((c: any) => <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>)}
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
            <input type="checkbox" checked={form.is_confidential} onChange={(e) => setForm({ ...form, is_confidential: e.target.checked })}
              className="rounded border-border" />
            <span className="text-xs text-muted-foreground">Mark as confidential</span>
          </label>
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
