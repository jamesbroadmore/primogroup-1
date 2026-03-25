import { useState, useMemo, useRef, useEffect } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Plus, CheckCircle, XCircle, Loader2, MoreHorizontal, Pencil, Trash2, Users } from "lucide-react";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AddStaffDialog } from "@/components/AddStaffDialog";
import { EditStaffDialog } from "@/components/EditStaffDialog";
import { toast } from "sonner";
import { Avatar, SearchInput, TableContainer, TableHead, Th, Td, PrimaryButton, StatusBadge, EmptyState } from "@/components/ui-kit";

export default function Staff() {
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [editStaff, setEditStaff] = useState<any>(null);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const { data: staffData = [], isLoading } = useQuery({
    queryKey: ["staff"],
    queryFn: async () => {
      const { data, error } = await supabase.from("staff").select("*").order("first_name");
      if (error) throw error;
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("staff").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Staff member removed");
      queryClient.invalidateQueries({ queryKey: ["staff"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-staff-count"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const handleDelete = (staff: any) => {
    if (confirm(`Remove ${staff.first_name} ${staff.last_name}?`)) {
      deleteMutation.mutate(staff.id);
    }
    setMenuOpen(null);
  };

  const filteredStaff = useMemo(() => {
    if (!search.trim()) return staffData;
    const q = search.toLowerCase();
    return staffData.filter(
      (s) =>
        s.first_name.toLowerCase().includes(q) ||
        s.last_name.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        ((s as any).preferred_name && (s as any).preferred_name.toLowerCase().includes(q))
    );
  }, [staffData, search]);

  const activeCount = staffData.filter((s: any) => s.status === "active").length;
  const inactiveCount = staffData.filter((s: any) => s.status !== "active").length;

  return (
    <AppLayout title="Staff">
      <div className="space-y-5">
        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl bg-white border border-border/50 shadow-sm p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm" style={{ background: "linear-gradient(135deg, #a78bfa, #8b5cf6)" }}>
              <Users className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-xl font-bold text-foreground">{staffData.length}</p>
              <p className="text-xs text-muted-foreground">Total Staff</p>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="rounded-2xl bg-white border border-border/50 shadow-sm p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm" style={{ background: "linear-gradient(135deg, #4ade80, #22c55e)" }}>
              <CheckCircle className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-xl font-bold text-foreground">{activeCount}</p>
              <p className="text-xs text-muted-foreground">Active</p>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-2xl bg-white border border-border/50 shadow-sm p-4 flex items-center gap-3 hidden sm:flex">
            <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm" style={{ background: "linear-gradient(135deg, #94a3b8, #64748b)" }}>
              <XCircle className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-xl font-bold text-foreground">{inactiveCount}</p>
              <p className="text-xs text-muted-foreground">Inactive</p>
            </div>
          </motion.div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <SearchInput value={search} onChange={setSearch} placeholder="Search staff..." className="w-full sm:w-72" />
          <PrimaryButton onClick={() => setShowAdd(true)} variant="purple">
            <Plus className="h-4 w-4" /> Add Staff
          </PrimaryButton>
        </div>

        <AddStaffDialog open={showAdd} onClose={() => setShowAdd(false)} />
        <EditStaffDialog open={!!editStaff} onClose={() => setEditStaff(null)} staff={editStaff} />

        {isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : filteredStaff.length === 0 ? (
          <div className="rounded-2xl bg-white border border-border/50 shadow-sm">
            <EmptyState
              icon={Users}
              title={staffData.length === 0 ? "No staff members yet" : "No results found"}
              description={staffData.length === 0 ? 'Click "Add Staff" to add your first staff member.' : "Try adjusting your search terms."}
            />
          </div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <TableContainer>
              <TableHead>
                <Th>Staff Member</Th>
                <Th>Role</Th>
                <Th className="hidden md:table-cell">Type</Th>
                <Th className="hidden md:table-cell">Email</Th>
                <Th>Status</Th>
                <Th className="w-12"></Th>
              </TableHead>
              <tbody className="divide-y divide-slate-100">
                {filteredStaff.map((s: any) => (
                  <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                    <Td>
                      <div className="flex items-center gap-3">
                        <Avatar name={`${s.first_name} ${s.last_name}`} size="sm" />
                        <div>
                          <p className="text-sm font-semibold text-foreground">{s.first_name} {s.last_name}</p>
                          {s.preferred_name && s.preferred_name !== s.first_name && (
                            <p className="text-[11px] text-muted-foreground">Goes by: {s.preferred_name}</p>
                          )}
                        </div>
                      </div>
                    </Td>
                    <Td><span className="text-sm text-foreground capitalize">{s.role?.replace(/_/g, " ") || "—"}</span></Td>
                    <Td className="hidden md:table-cell"><span className="text-sm text-muted-foreground capitalize">{s.employment_type?.replace(/_/g, " ") || "—"}</span></Td>
                    <Td className="hidden md:table-cell"><span className="text-sm text-muted-foreground">{s.email}</span></Td>
                    <Td><StatusBadge status={s.status} /></Td>
                    <Td>
                      <ActionMenu
                        open={menuOpen === s.id}
                        onToggle={() => setMenuOpen(menuOpen === s.id ? null : s.id)}
                        onClose={() => setMenuOpen(null)}
                        onEdit={() => { setEditStaff(s); setMenuOpen(null); }}
                        onDelete={() => handleDelete(s)}
                      />
                    </Td>
                  </tr>
                ))}
              </tbody>
            </TableContainer>
          </motion.div>
        )}
      </div>
    </AppLayout>
  );
}

function ActionMenu({ open, onToggle, onClose, onEdit, onDelete }: {
  open: boolean; onToggle: () => void; onClose: () => void; onEdit: () => void; onDelete: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, onClose]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={(e) => { e.stopPropagation(); onToggle(); }}
        className="h-8 w-8 rounded-xl flex items-center justify-center text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 w-40 rounded-2xl bg-white border border-border shadow-xl py-1.5 overflow-hidden">
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(); }}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-foreground hover:bg-slate-50 transition-colors"
          >
            <Pencil className="h-3.5 w-3.5 text-purple-500" /> Edit
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </button>
        </div>
      )}
    </div>
  );
}
