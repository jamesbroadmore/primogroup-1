import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Plus, Search, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AddStaffDialog } from "@/components/AddStaffDialog";
import { EditStaffDialog } from "@/components/EditStaffDialog";

export default function Staff() {
  const [showAdd, setShowAdd] = useState(false);
  const [editStaff, setEditStaff] = useState<any>(null);
  const { data: staffData = [], isLoading } = useQuery({
    queryKey: ["staff"],
    queryFn: async () => {
      const { data, error } = await supabase.from("staff").select("*").order("first_name");
      if (error) throw error;
      return data;
    },
  });

  return (
    <AppLayout title="Staff Management">
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input className="w-full h-9 pl-9 pr-3 rounded-lg border bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" placeholder="Search staff..." />
          </div>
          <button onClick={() => setShowAdd(true)} className="h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium flex items-center gap-2 hover:opacity-90 transition-opacity">
            <Plus className="h-4 w-4" /> Add Staff
          </button>
        </div>

        <AddStaffDialog open={showAdd} onClose={() => setShowAdd(false)} />
        <EditStaffDialog open={!!editStaff} onClose={() => setEditStaff(null)} staff={editStaff} />

        {isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : staffData.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl bg-card p-12 shadow-card border border-border/50 text-center">
            <p className="text-muted-foreground text-sm">No staff members yet. Click "Add Staff" to get started.</p>
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
                  </tr>
                </thead>
                <tbody>
                  {staffData.map((s) => (
                    <tr
                      key={s.id}
                      onClick={() => setEditStaff(s)}
                      className="border-b last:border-0 hover:bg-secondary/30 transition-colors cursor-pointer"
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
