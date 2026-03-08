import { AppLayout } from "@/components/AppLayout";
import { Plus, FileText, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

export default function CaseNotes() {
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
          <button className="h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium flex items-center gap-2 hover:opacity-90 transition-opacity">
            <Plus className="h-4 w-4" /> New Note
          </button>
        </div>

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
