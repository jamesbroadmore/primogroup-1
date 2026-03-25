import { useState, useEffect, useRef, useMemo } from "react";
import { WorkerLayout } from "@/components/WorkerLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, FileText, Search, X, Loader2, Lock,
  ChevronRight, AlertTriangle, Clock, User,
} from "lucide-react";
import { format, formatDistanceToNow, isToday, isYesterday } from "date-fns";
import { fullName } from "@/lib/display-names";

// ─── Category config ───────────────────────────────────────────────────────────
const CATEGORIES = [
  { value: "all",              label: "All",           color: "bg-slate-100 text-slate-600",      active: "bg-purple-500 text-white" },
  { value: "general",          label: "General",       color: "bg-slate-100 text-slate-600",      active: "bg-slate-700 text-white" },
  { value: "personal_care",    label: "Personal Care", color: "bg-pink-100 text-pink-700",        active: "bg-pink-500 text-white" },
  { value: "medication",       label: "Medication",    color: "bg-red-100 text-red-700",          active: "bg-red-500 text-white" },
  { value: "community_access", label: "Community",     color: "bg-teal-100 text-teal-700",        active: "bg-teal-500 text-white" },
  { value: "behaviour",        label: "Behaviour",     color: "bg-orange-100 text-orange-700",    active: "bg-orange-500 text-white" },
  { value: "health",           label: "Health",        color: "bg-blue-100 text-blue-700",        active: "bg-blue-500 text-white" },
  { value: "skill_development",label: "Skills",        color: "bg-purple-100 text-purple-700",    active: "bg-purple-500 text-white" },
  { value: "other",            label: "Other",         color: "bg-gray-100 text-gray-600",        active: "bg-gray-500 text-white" },
];

const NOTE_CATEGORIES = CATEGORIES.filter(c => c.value !== "all");

function formatNoteDate(dateStr: string): string {
  const d = new Date(dateStr);
  if (isToday(d)) return `Today at ${format(d, "h:mm a")}`;
  if (isYesterday(d)) return `Yesterday at ${format(d, "h:mm a")}`;
  return format(d, "d MMM yyyy, h:mm a");
}

function getCategoryConfig(value: string) {
  return CATEGORIES.find(c => c.value === value) ?? CATEGORIES[1];
}

// ─── Avatar initials ──────────────────────────────────────────────────────────
function AvatarSmall({ name }: { name: string }) {
  const GRADIENTS = [
    "linear-gradient(135deg, #a78bfa, #8b5cf6)",
    "linear-gradient(135deg, #60a5fa, #3b82f6)",
    "linear-gradient(135deg, #4ade80, #22c55e)",
    "linear-gradient(135deg, #f472b6, #ec4899)",
    "linear-gradient(135deg, #2dd4bf, #14b8a6)",
    "linear-gradient(135deg, #fb923c, #f97316)",
  ];
  const initials = (name || "??").split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  const idx = (name || "").split("").reduce((a, c) => a + c.charCodeAt(0), 0) % GRADIENTS.length;
  return (
    <div
      className="h-9 w-9 rounded-xl flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm"
      style={{ background: GRADIENTS[idx] }}
    >
      {initials}
    </div>
  );
}

// ─── Add Note bottom sheet ─────────────────────────────────────────────────────
function AddNoteSheet({
  open,
  onClose,
  staffId,
  defaultClientId,
}: {
  open: boolean;
  onClose: () => void;
  staffId: string | null;
  defaultClientId?: string;
}) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const textRef = useRef<HTMLTextAreaElement>(null);

  const [clientId, setClientId] = useState(defaultClientId ?? "");
  const [category, setCategory] = useState("general");
  const [content, setContent] = useState("");
  const [isConfidential, setIsConfidential] = useState(false);

  useEffect(() => {
    if (open) {
      setTimeout(() => textRef.current?.focus(), 350);
    } else {
      // Reset on close
      setContent("");
      setCategory("general");
      setIsConfidential(false);
    }
  }, [open]);

  const { data: clientList = [] } = useQuery({
    queryKey: ["worker-client-list-notes"],
    queryFn: async () => {
      const { data } = await supabase
        .from("clients").select("id, first_name, last_name, preferred_name")
        .eq("status", "active").order("first_name");
      return data ?? [];
    },
  });

  const mutation = useMutation({
    mutationFn: async () => {
      if (!content.trim()) throw new Error("Please write your case note.");
      if (!clientId) throw new Error("Please select a client.");
      const { error } = await supabase.from("case_notes").insert({
        staff_id: staffId,
        client_id: clientId,
        category,
        content: content.trim(),
        is_confidential: isConfidential,
        created_by: user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Case note saved ✓");
      queryClient.invalidateQueries({ queryKey: ["my-notes"] });
      queryClient.invalidateQueries({ queryKey: ["worker-my-notes"] });
      onClose();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl overflow-hidden flex flex-col"
            style={{ maxHeight: "92vh" }}
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 26, stiffness: 280 }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1 shrink-0">
              <div className="h-1 w-10 rounded-full bg-slate-200" />
            </div>

            {/* Header */}
            <div className="px-5 py-4 flex items-center justify-between border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-2xl flex items-center justify-center shadow-sm" style={{ background: "linear-gradient(135deg, #60a5fa, #3b82f6)" }}>
                  <FileText className="h-4.5 w-4.5 text-white" />
                </div>
                <div>
                  <h2 className="text-[15px] font-bold text-slate-800">New Case Note</h2>
                  <p className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Lock className="h-2.5 w-2.5" /> Immutable after 1 hour
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:bg-slate-200 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Scrollable form body */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {/* Client */}
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">
                  Client <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <select
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                    className="w-full h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-800 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-400/50 transition-all"
                  >
                    <option value="">Select client…</option>
                    {clientList.map((c: any) => (
                      <option key={c.id} value={c.id}>
                        {c.preferred_name ? `${c.preferred_name} ${c.last_name}` : `${c.first_name} ${c.last_name}`}
                      </option>
                    ))}
                  </select>
                  <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 rotate-90 pointer-events-none" />
                </div>
              </div>

              {/* Category chips */}
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">Category</label>
                <div className="flex flex-wrap gap-2">
                  {NOTE_CATEGORIES.map((cat) => (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => setCategory(cat.value)}
                      className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition-all ${
                        category === cat.value ? cat.active + " shadow-sm" : cat.color
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Note content */}
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">
                  Note <span className="text-red-400">*</span>
                </label>
                <textarea
                  ref={textRef}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Describe the support provided — client mood, activities, any concerns or observations…"
                  rows={6}
                  maxLength={3000}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400/50 transition-all resize-none"
                />
                <p className="text-[10px] text-slate-400 text-right mt-1">{content.length}/3000</p>
              </div>

              {/* Confidential toggle */}
              <label className="flex items-center gap-3 cursor-pointer">
                <div
                  onClick={() => setIsConfidential(!isConfidential)}
                  className={`h-6 w-11 rounded-full transition-all relative ${isConfidential ? "" : "bg-slate-200"}`}
                  style={isConfidential ? { background: "linear-gradient(135deg, #a78bfa, #8b5cf6)" } : {}}
                >
                  <div className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${isConfidential ? "left-[22px]" : "left-0.5"}`} />
                </div>
                <span className="text-sm text-slate-600">Mark as confidential</span>
              </label>
            </div>

            {/* Submit */}
            <div className="px-5 pb-6 pt-3 space-y-2 shrink-0 border-t border-slate-100">
              <button
                onClick={() => mutation.mutate()}
                disabled={mutation.isPending || !content.trim() || !clientId}
                className="w-full h-14 rounded-2xl text-white text-[15px] font-bold flex items-center justify-center gap-2.5 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-40 shadow-lg"
                style={{ background: "linear-gradient(135deg, #60a5fa, #3b82f6)" }}
              >
                {mutation.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <FileText className="h-5 w-5" />}
                Save Case Note
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────
export default function WorkerNotes() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [showAdd, setShowAdd] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Get this worker's staff ID
  const { data: myStaffId } = useQuery({
    queryKey: ["my-staff-id-notes", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles").select("staff_id").eq("user_id", user!.id).single();
      return data?.staff_id ?? null;
    },
  });

  // Fetch MY notes only
  const { data: notes = [], isLoading } = useQuery({
    queryKey: ["my-notes", myStaffId],
    enabled: !!myStaffId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("case_notes")
        .select("*, client:client_id(id, first_name, last_name, preferred_name)")
        .eq("staff_id", myStaffId)
        .order("note_date", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
    refetchInterval: 60000,
  });

  // Filter
  const filtered = useMemo(() => {
    let list = notes;
    if (activeCategory !== "all") {
      list = list.filter((n: any) => n.category === activeCategory);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((n: any) =>
        n.content?.toLowerCase().includes(q) ||
        fullName(n.client).toLowerCase().includes(q) ||
        n.category?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [notes, activeCategory, search]);

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: notes.length };
    notes.forEach((n: any) => {
      counts[n.category] = (counts[n.category] ?? 0) + 1;
    });
    return counts;
  }, [notes]);

  // Check if note is still editable (within 1 hour)
  const isEditable = (noteDate: string) => {
    const created = new Date(noteDate);
    const diffMs = Date.now() - created.getTime();
    return diffMs < 60 * 60 * 1000;
  };

  return (
    <WorkerLayout title="My Notes">
      <div className="px-4 pt-5 pb-4 max-w-lg mx-auto space-y-4">

        {/* Search bar */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search notes…"
            className="w-full h-11 pl-10 pr-10 rounded-2xl bg-white border border-white/80 shadow-sm text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-400/40 transition-all"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full bg-slate-200 flex items-center justify-center"
            >
              <X className="h-3 w-3 text-slate-500" />
            </button>
          )}
        </div>

        {/* Category chips */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none -mx-4 px-4">
          {CATEGORIES.map((cat) => {
            const count = categoryCounts[cat.value] ?? 0;
            if (cat.value !== "all" && count === 0) return null;
            const isActive = activeCategory === cat.value;
            return (
              <button
                key={cat.value}
                onClick={() => setActiveCategory(cat.value)}
                className={`flex-shrink-0 h-8 px-3 rounded-full text-[11px] font-bold flex items-center gap-1.5 transition-all ${
                  isActive ? cat.active + " shadow-sm" : cat.color
                }`}
              >
                {cat.label}
                <span className={`text-[9px] font-black px-1 py-0.5 rounded-full ${isActive ? "bg-white/30" : "bg-white/70 text-slate-500"}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Stats row */}
        {notes.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Total", value: notes.length, bg: "from-purple-50 to-purple-100/50" },
              { label: "This Week", value: notes.filter((n: any) => new Date(n.note_date) > new Date(Date.now() - 7 * 86400000)).length, bg: "from-blue-50 to-blue-100/50" },
              { label: "Today", value: notes.filter((n: any) => isToday(new Date(n.note_date))).length, bg: "from-emerald-50 to-emerald-100/50" },
            ].map((s, i) => (
              <div key={i} className={`rounded-2xl bg-gradient-to-br ${s.bg} p-3 text-center shadow-sm border border-white/80`}>
                <p className="text-lg font-black text-slate-800">{s.value}</p>
                <p className="text-[10px] text-slate-500 font-semibold">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Note list */}
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-slate-300" />
          </div>
        ) : filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center py-16 text-center"
          >
            <div
              className="h-20 w-20 rounded-3xl flex items-center justify-center mb-4 shadow-sm"
              style={{ background: "linear-gradient(135deg, #dbeafe, #bfdbfe)" }}
            >
              <FileText className="h-10 w-10 text-blue-300" />
            </div>
            <p className="text-base font-bold text-slate-600 mb-1">
              {notes.length === 0 ? "No notes yet" : "No matching notes"}
            </p>
            <p className="text-sm text-slate-400 max-w-xs leading-relaxed">
              {notes.length === 0
                ? "Tap the + button below to write your first case note after a shift."
                : "Try adjusting your search or category filter."}
            </p>
          </motion.div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {filtered.map((note: any, i: number) => {
                const cat = getCategoryConfig(note.category);
                const clientName = note.client ? fullName(note.client) : "General";
                const editable = isEditable(note.note_date);
                const isExpanded = expandedId === note.id;

                return (
                  <motion.div
                    key={note.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ delay: Math.min(i * 0.04, 0.3) }}
                    className="bg-white rounded-3xl shadow-sm border border-white/80 overflow-hidden"
                  >
                    {/* Note header */}
                    <button
                      className="w-full flex items-start gap-3 p-4 text-left"
                      onClick={() => setExpandedId(isExpanded ? null : note.id)}
                    >
                      <AvatarSmall name={clientName} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <p className="text-sm font-bold text-slate-800 truncate">{clientName}</p>
                          <div className="flex items-center gap-1 shrink-0">
                            {note.is_confidential && (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-red-50 text-red-500 border border-red-200">
                                Conf.
                              </span>
                            )}
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${cat.color}`}>
                              {cat.label}
                            </span>
                          </div>
                        </div>
                        <p className={`text-[13px] text-slate-600 leading-relaxed ${isExpanded ? "" : "line-clamp-2"}`}>
                          {note.content}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Clock className="h-3 w-3 text-slate-300" />
                          <span className="text-[11px] text-slate-400">
                            {formatNoteDate(note.note_date)}
                          </span>
                          {editable && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200">
                              Editable
                            </span>
                          )}
                          {!editable && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-400 flex items-center gap-0.5">
                              <Lock className="h-2 w-2" /> Locked
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            <p className="text-center text-[11px] text-slate-400 py-2">
              {filtered.length} note{filtered.length !== 1 ? "s" : ""}
              {activeCategory !== "all" || search ? " (filtered)" : ""}
            </p>
          </div>
        )}
      </div>

      {/* Floating add button */}
      <button
        onClick={() => setShowAdd(true)}
        className="fixed bottom-24 right-5 z-30 h-14 w-14 rounded-2xl flex items-center justify-center text-white shadow-xl transition-all hover:scale-105 active:scale-95"
        style={{ background: "linear-gradient(135deg, #60a5fa, #3b82f6)" }}
      >
        <Plus className="h-6 w-6" />
      </button>

      {/* Add note sheet */}
      <AddNoteSheet
        open={showAdd}
        onClose={() => setShowAdd(false)}
        staffId={myStaffId}
      />
    </WorkerLayout>
  );
}
