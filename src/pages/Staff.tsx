import { useState, useMemo, useRef, useEffect } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Plus, Search, CheckCircle, XCircle, Loader2, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AddStaffDialog } from "@/components/AddStaffDialog";
import { EditStaffDialog } from "@/components/EditStaffDialog";
import { toast } from "sonner";

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
      toast.success("Staff member deleted");
      queryClient.invalidateQueries({ queryKey: ["staff"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-staff-count"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const handleDelete = (staff: any) => {
    if (confirm(`Are you sure you want to delete ${staff.first_name} ${staff.last_name}?`)) {
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

  return (
    <AppLayout title="Staff Management">
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-9 pl-9 pr-3 rounded-lg border bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Search staff..."
            />
          </div>
          <button onClick={() => setShowAdd(true)} className="h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium flex items-center gap-2 hover:opacity-90 transition-opacity">
            <Plus className="h-4 w-4" /> Add Staff
          </button>
        </div>

        <AddStaffDialog open={showAdd} onClose={() => setShowAdd(false)} />
        <EditStaffDialog open={!!editStaff} onClose={() => setEditStaff(null)} staff={editStaff} />

        {isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : filteredStaff.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl bg-card p-12 shadow-card border border-border/50 text-center">
            <p className="text-muted-foreground text-sm">
              {staffData.length === 0 ? 'No staff members yet. Click "Add Staff" to get started.' : "No staff match your search."}
            </p>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl bg-card shadow-card border border-border/50 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-secondary/50">
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">First Name</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Surname</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Preferred Name</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Role</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Type</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Email</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                    <th className="w-12 px-2 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {staffData.map((s) => (
                    <tr
                      key={s.id}
                      className="border-b last:border-0 hover:bg-secondary/30 transition-colors"
                    >
                      <td className="px-4 py-3 font-medium text-card-foreground">{s.first_name}</td>
                      <td className="px-4 py-3 text-card-foreground">{s.last_name}</td>
                      <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">{(s as any).preferred_name || "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground capitalize">{s.role.replace("_", " ")}</td>
                      <td className="px-4 py-3 text-muted-foreground hidden md:table-cell capitalize">{s.employment_type.replace("_", " ")}</td>
                      <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{s.email}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                          s.status === "active" ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"
                        }`}>
                          {s.status === "active" ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                          {s.status}
                        </span>
                      </td>
                      <td className="px-2 py-3 relative">
                        <ActionMenu
                          open={menuOpen === s.id}
                          onToggle={() => setMenuOpen(menuOpen === s.id ? null : s.id)}
                          onClose={() => setMenuOpen(null)}
                          onEdit={() => { setEditStaff(s); setMenuOpen(null); }}
                          onDelete={() => handleDelete(s)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
        className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 w-36 rounded-lg bg-popover border border-border shadow-lg py-1">
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(); }}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-popover-foreground hover:bg-secondary transition-colors"
          >
            <Pencil className="h-3.5 w-3.5" /> Edit
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </button>
        </div>
      )}
    </div>
  );
}
