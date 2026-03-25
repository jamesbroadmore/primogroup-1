import { useState, useMemo, useRef, useEffect } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Plus, MoreHorizontal, Loader2, Pencil, Trash2, UserCircle, Users } from "lucide-react";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AddClientDialog } from "@/components/AddClientDialog";
import { EditClientDialog } from "@/components/EditClientDialog";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { fullName } from "@/lib/display-names";
import { Avatar, SearchInput, PrimaryButton, StatusBadge, EmptyState } from "@/components/ui-kit";

const TABS = [
  { key: "all", label: "All Clients", gradient: "linear-gradient(135deg, #a78bfa, #8b5cf6)" },
  { key: "ndis", label: "NDIS", gradient: "linear-gradient(135deg, #60a5fa, #3b82f6)" },
  { key: "aged_care", label: "Aged Care", gradient: "linear-gradient(135deg, #2dd4bf, #14b8a6)" },
  { key: "other", label: "Other", gradient: "linear-gradient(135deg, #94a3b8, #64748b)" },
];

const FUNDING_LABELS: Record<string, string> = {
  ndis: "NDIS",
  home_care: "Home Care",
  aged_care: "Aged Care",
  chsp: "CHSP",
  hvp: "HVP",
  private: "Private",
  other: "Other",
};

function getFundingCategory(fundingType: string | null): string {
  if (!fundingType) return "other";
  if (fundingType === "ndis") return "ndis";
  if (["home_care", "aged_care", "chsp", "hvp"].includes(fundingType)) return "aged_care";
  return "other";
}

const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  ndis: { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200" },
  aged_care: { bg: "bg-teal-50", text: "text-teal-700", border: "border-teal-200" },
  other: { bg: "bg-slate-100", text: "text-slate-600", border: "border-slate-200" },
};

export default function Clients() {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [editClient, setEditClient] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  const { data: clientsData = [], isLoading } = useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const { data, error } = await supabase.from("clients").select("*").order("first_name");
      if (error) throw error;
      return data;
    },
  });

  const { data: assignments = [] } = useQuery({
    queryKey: ["client-staff-assignments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("client_staff_assignments")
        .select("client_id, staff_id, staff:staff_id(id, first_name, last_name, preferred_name)");
      if (error) throw error;
      return data;
    },
  });

  const assignmentsByClient = useMemo(() => {
    const map: Record<string, any[]> = {};
    assignments.forEach((a: any) => {
      if (!map[a.client_id]) map[a.client_id] = [];
      if (a.staff) map[a.client_id].push(a.staff);
    });
    return map;
  }, [assignments]);

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("clients").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Client removed");
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-client-count"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const handleDelete = (client: any) => {
    if (confirm(`Remove ${fullName(client)}?`)) {
      deleteMutation.mutate(client.id);
    }
    setMenuOpen(null);
  };

  const filtered = useMemo(() => {
    let list = clientsData;
    if (activeTab !== "all") list = list.filter((c) => getFundingCategory(c.funding_type) === activeTab);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((c) =>
        c.first_name.toLowerCase().includes(q) ||
        c.last_name.toLowerCase().includes(q) ||
        (c.preferred_name && c.preferred_name.toLowerCase().includes(q)) ||
        (c.ndis_number && c.ndis_number.toLowerCase().includes(q))
      );
    }
    return list;
  }, [clientsData, activeTab, search]);

  const counts = useMemo(() => {
    const c = { all: clientsData.length, ndis: 0, aged_care: 0, other: 0 };
    clientsData.forEach((cl) => { c[getFundingCategory(cl.funding_type) as keyof typeof c]++; });
    return c;
  }, [clientsData]);

  return (
    <AppLayout title="Clients">
      <div className="space-y-5">
        {/* Tab pills */}
        <div className="flex flex-wrap gap-2">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`h-9 px-4 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all ${
                activeTab === tab.key
                  ? "text-white shadow-md"
                  : "bg-white text-muted-foreground border border-border hover:bg-secondary"
              }`}
              style={activeTab === tab.key ? { background: tab.gradient } : {}}
            >
              {tab.label}
              <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full ${
                activeTab === tab.key ? "bg-white/25 text-white" : "bg-muted text-muted-foreground"
              }`}>{counts[tab.key as keyof typeof counts]}</span>
            </button>
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <SearchInput value={search} onChange={setSearch} placeholder="Search clients..." className="w-full sm:w-72" />
          {isAdmin && (
            <PrimaryButton onClick={() => setShowAdd(true)} variant="teal" className="">
              <Plus className="h-4 w-4" /> Add Client
            </PrimaryButton>
          )}
        </div>

        <AddClientDialog open={showAdd} onClose={() => setShowAdd(false)} />
        <EditClientDialog open={!!editClient} onClose={() => setEditClient(null)} client={editClient} />

        {isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl bg-white border border-border/50 shadow-sm">
            <EmptyState
              icon={UserCircle}
              title={clientsData.length === 0 ? "No clients yet" : "No results found"}
              description={clientsData.length === 0 ? 'Click "Add Client" to add your first client.' : "Try adjusting your search or filters."}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((c: any, i: number) => {
              const category = getFundingCategory(c.funding_type);
              const catColors = CATEGORY_COLORS[category];
              const assigned = assignmentsByClient[c.id] || [];
              return (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="rounded-2xl bg-white border border-border/50 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
                >
                  {/* Top accent line */}
                  <div className="h-1" style={{ background: TABS.find(t => t.key === category)?.gradient || TABS[0].gradient }} />
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={fullName(c)} size="md" />
                        <div>
                          <h3 className="text-sm font-bold text-foreground">{fullName(c)}</h3>
                          {c.preferred_name && c.preferred_name !== c.first_name && (
                            <p className="text-[11px] text-muted-foreground">Legal: {c.first_name} {c.last_name}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${catColors.bg} ${catColors.text} ${catColors.border}`}>
                          {category === "ndis" ? "NDIS" : category === "aged_care" ? "Aged Care" : "Other"}
                        </span>
                        {isAdmin && (
                          <ClientActionMenu open={menuOpen === c.id} onToggle={() => setMenuOpen(menuOpen === c.id ? null : c.id)}
                            onClose={() => setMenuOpen(null)} onEdit={() => { setEditClient(c); setMenuOpen(null); }}
                            onDelete={() => handleDelete(c)} />
                        )}
                      </div>
                    </div>

                    <div className="space-y-1.5 text-xs border-t border-slate-100 pt-3">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Status</span>
                        <StatusBadge status={c.status} />
                      </div>
                      {c.funding_type && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Funding</span>
                          <span className="font-medium text-foreground">{FUNDING_LABELS[c.funding_type] || c.funding_type}</span>
                        </div>
                      )}
                      {c.ndis_number && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">NDIS #</span>
                          <span className="font-medium text-foreground font-mono text-[11px]">{c.ndis_number}</span>
                        </div>
                      )}
                      {c.phone && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Phone</span>
                          <span className="font-medium text-foreground">{c.phone}</span>
                        </div>
                      )}
                      {assigned.length > 0 && (
                        <div className="pt-1">
                          <p className="text-muted-foreground mb-1.5">Assigned Workers</p>
                          <div className="flex flex-wrap gap-1">
                            {assigned.map((s: any) => (
                              <span key={s.id} className="inline-flex items-center px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-semibold">
                                {fullName(s)}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}

function ClientActionMenu({ open, onToggle, onClose, onEdit, onDelete }: {
  open: boolean; onToggle: () => void; onClose: () => void; onEdit: () => void; onDelete: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose(); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, onClose]);

  return (
    <div ref={ref} className="relative">
      <button onClick={(e) => { e.stopPropagation(); onToggle(); }}
        className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors">
        <MoreHorizontal className="h-3.5 w-3.5" />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 w-36 rounded-2xl bg-white border border-border shadow-xl py-1.5">
          <button onClick={(e) => { e.stopPropagation(); onEdit(); }}
            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-foreground hover:bg-slate-50 transition-colors">
            <Pencil className="h-3.5 w-3.5 text-purple-500" /> Edit
          </button>
          <button onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors">
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </button>
        </div>
      )}
    </div>
  );
}
