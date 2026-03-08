import { AppLayout } from "@/components/AppLayout";
import { Plus, AlertTriangle, AlertCircle, Shield, Pill, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

const typeIcons: Record<string, any> = {
  medication_error: Pill,
  behavior: AlertCircle,
  injury: AlertTriangle,
  safeguarding: Shield,
};

export default function Incidents() {
  const { data: incidents = [], isLoading } = useQuery({
    queryKey: ["incidents"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("incidents")
        .select("*, reporter:reported_by(first_name, last_name), client:client_id(first_name, last_name)")
        .order("incident_date", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
  });

  return (
    <AppLayout title="Incident Reports">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{incidents.length} incidents</p>
          <button className="h-9 px-4 rounded-lg bg-destructive text-destructive-foreground text-sm font-medium flex items-center gap-2 hover:opacity-90 transition-opacity">
            <Plus className="h-4 w-4" /> Report Incident
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : incidents.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl bg-card p-12 shadow-card border border-border/50 text-center">
            <p className="text-muted-foreground text-sm">No incidents reported. Use "Report Incident" to log one.</p>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {incidents.map((inc: any, i: number) => {
              const Icon = typeIcons[inc.incident_type] || AlertTriangle;
              return (
                <motion.div key={inc.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  className="rounded-xl bg-card p-5 shadow-card border border-border/50">
                  <div className="flex items-start gap-3">
                    <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${
                      inc.severity === "critical" || inc.severity === "high" ? "bg-destructive/10" : inc.severity === "medium" ? "bg-warning/10" : "bg-muted"
                    }`}>
                      <Icon className={`h-4 w-4 ${
                        inc.severity === "critical" || inc.severity === "high" ? "text-destructive" : inc.severity === "medium" ? "text-warning" : "text-muted-foreground"
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <div>
                          <p className="text-sm font-semibold text-card-foreground capitalize">{inc.incident_type.replace("_", " ")}</p>
                          <p className="text-xs text-muted-foreground">
                            {inc.client ? `${inc.client.first_name} ${inc.client.last_name}` : "N/A"} ·{" "}
                            {inc.reporter ? `${inc.reporter.first_name} ${inc.reporter.last_name}` : "N/A"} ·{" "}
                            {format(new Date(inc.incident_date), "MMM d, yyyy")}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                            inc.severity === "critical" || inc.severity === "high" ? "bg-destructive/10 text-destructive" :
                            inc.severity === "medium" ? "bg-warning/10 text-warning" : "bg-muted text-muted-foreground"
                          }`}>{inc.severity}</span>
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                            inc.status === "resolved" || inc.status === "closed" ? "bg-success/10 text-success" :
                            inc.status === "open" ? "bg-destructive/10 text-destructive" : "bg-warning/10 text-warning"
                          }`}>{inc.status}</span>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">{inc.description}</p>
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
