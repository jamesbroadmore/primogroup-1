import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Plus, FileText, Loader2, Lock, Search } from "lucide-react";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { toast } from "sonner";
import { fullName } from "@/lib/display-names";
import {
  Avatar, PrimaryButton, SearchInput, EmptyState,
  DialogOverlay, DialogHeader, FormField, FormSelect, FormTextarea
} from "@/components/ui-kit";

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

const CATEGORY_COLORS: Record<string, string> = {
  general: "bg-slate-100 text-slate-600",
  personal_care: "bg-pink-100 text-pink-700",
  community_access: "bg-teal-100 text-teal-700",
  behaviour: "bg-orange-100 text-orange-700",
  medication: "bg-red-100 text-red-700",
  health: "bg-blue-100 text-blue-700",
  skill_development: "bg-purple-100 text-purple-700",
  other: "bg-gray-100 text-gray-600",
};

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
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <SearchInput value={search} onChange={setSearch} placeholder="Search notes..." className="w-56" />
            <span className="text-xs text-muted-foreground bg-white border border-border px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-sm">
              <Lock className="h-3 w-3 text-muted-foreground" />
              Immutable after 1 hour
            </span>
          </div>
          <PrimaryButton onClick={() => setShowAdd(true)} variant="blue">
            <Plus className="h-4 w-4" /> New Note
          </PrimaryButton>
        </div>

        {showAdd && <AddCaseNoteDialog onClose={() => setShowAdd(false)} />}

        {isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl bg-white border border-border/50 shadow-sm">
            <EmptyState
              icon={FileText}
              title={notes.length === 0 ? "No case notes yet" : "No notes match your search"}
              description={notes.length === 0 ? 'Click "New Note" to add the first case note.' : "Try different search terms."}
            />
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((n: any, i: number) => (
              <motion.div
                key={n.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="rounded-2xl bg-white border border-border/50 shadow-sm hover:shadow-md transition-shadow p-5"
              >
                <div className="flex items-start gap-4">
                  <Avatar name={fullName(n.client)} size="md" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <p className="text-sm font-bold text-foreground">{fullName(n.client)}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {fullName(n.staff)} · {format(new Date(n.note_date), "MMM d, yyyy h:mm a")}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {n.category && (
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${CATEGORY_COLORS[n.category] || "bg-slate-100 text-slate-600"}`}>
                            {n.category.replace(/_/g, " ")}
                          </span>
                        )}
                        {n.is_confidential && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200">Confidential</span>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed">{n.content}</p>
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

  const [form, setForm] = useState({ client_id: "", category: "general", content: "", is_confidential: false });

  const mutation = useMutation({
    mutationFn: async () => {
      if (!form.client_id) throw new Error("Please select a client");
      if (!form.content.trim()) throw new Error("Note content is required");
      const { error } = await supabase.from("case_notes").insert({
        client_id: form.client_id, staff_id: staffProfile || null,
        category: form.category, content: form.content.trim(),
        is_confidential: form.is_confidential, created_by: user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Case note saved — immutable after 1 hour");
      queryClient.invalidateQueries({ queryKey: ["case-notes"] });
      onClose();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <DialogOverlay onClose={onClose}>
      <DialogHeader title="New Case Note" onClose={onClose} gradient="linear-gradient(90deg, #60a5fa, #3b82f6)" />
      <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }} className="p-6 space-y-4">
        <FormField label="Client" required>
          <FormSelect value={form.client_id} onChange={(v) => setForm({ ...form, client_id: v })}>
            <option value="">Select client...</option>
            {clientList.map((c: any) => (
              <option key={c.id} value={c.id}>{c.preferred_name ? `${c.preferred_name} ${c.last_name}` : `${c.first_name} ${c.last_name}`}</option>
            ))}
          </FormSelect>
        </FormField>
        <FormField label="Category">
          <FormSelect value={form.category} onChange={(v) => setForm({ ...form, category: v })}>
            {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </FormSelect>
        </FormField>
        <FormField label="Note" required>
          <FormTextarea value={form.content} onChange={(v) => setForm({ ...form, content: v })}
            placeholder="Describe the support provided, observations, client mood..." rows={4} />
        </FormField>
        <label className="flex items-center gap-2.5 cursor-pointer">
          <input type="checkbox" checked={form.is_confidential} onChange={(e) => setForm({ ...form, is_confidential: e.target.checked })} className="rounded border-border" />
          <span className="text-sm text-muted-foreground">Mark as confidential (admin-only visibility)</span>
        </label>
        <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 flex items-center gap-2">
          <Lock className="h-4 w-4 text-amber-500 shrink-0" />
          <p className="text-xs text-amber-700">Case notes become immutable 1 hour after creation.</p>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="h-10 px-4 rounded-xl border text-sm font-medium text-foreground hover:bg-secondary transition-colors">Cancel</button>
          <button type="submit" disabled={mutation.isPending}
            className="h-10 px-5 rounded-xl text-white text-sm font-bold flex items-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50 shadow-md"
            style={{ background: "linear-gradient(135deg, #60a5fa, #3b82f6)" }}>
            {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Save Note
          </button>
        </div>
      </form>
    </DialogOverlay>
  );
}
