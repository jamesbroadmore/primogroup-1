import { AppLayout } from "@/components/AppLayout";
import { AlertTriangle, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

function StatusBadge({ status }: { status: string }) {
  const styles = status === "current" ? "bg-success/10 text-success" :
    status === "expiring_soon" ? "bg-warning/10 text-warning" : "bg-destructive/10 text-destructive";
  const Icon = status === "current" ? CheckCircle : status === "expiring_soon" ? AlertTriangle : XCircle;
  const label = status === "current" ? "Valid" : status === "expiring_soon" ? "Expiring" : status === "expired" ? "Expired" : status;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${styles}`}>
      <Icon className="h-3 w-3" />{label}
    </span>
  );
}

export default function Compliance() {
  const { data: records = [], isLoading } = useQuery({
    queryKey: ["compliance"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("compliance_records")
        .select("*, staff:staff_id(first_name, last_name)")
        .order("expiry_date", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const alerts = records.filter((r: any) => r.status === "expiring_soon" || r.status === "expired");

  return (
    <AppLayout title="Compliance">
      <div className="space-y-4">
        {alerts.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl bg-warning/5 border border-warning/20 p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-warning" />
              <h3 className="text-sm font-semibold text-warning">{alerts.length} Compliance Alert{alerts.length > 1 ? "s" : ""}</h3>
            </div>
            <ul className="space-y-1">
              {alerts.map((a: any) => (
                <li key={a.id} className="text-xs text-warning/80">
                  • {a.staff ? `${a.staff.first_name} ${a.staff.last_name}` : "Unknown"}: {a.record_name} — {a.status === "expired" ? "Expired" : "Expiring soon"}
                </li>
              ))}
            </ul>
          </motion.div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : records.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl bg-card p-12 shadow-card border border-border/50 text-center">
            <p className="text-muted-foreground text-sm">No compliance records yet. Add staff and their certifications to track compliance.</p>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl bg-card shadow-card border border-border/50 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-secondary/50">
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Staff</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Record</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Type</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Expiry</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((r: any) => (
                    <tr key={r.id} className="border-b last:border-0 hover:bg-secondary/30 transition-colors">
                      <td className="px-4 py-3 font-medium text-card-foreground">
                        {r.staff ? `${r.staff.first_name} ${r.staff.last_name}` : "—"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{r.record_name}</td>
                      <td className="px-4 py-3 text-muted-foreground hidden md:table-cell capitalize">{r.record_type.replace("_", " ")}</td>
                      <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{r.expiry_date || "N/A"}</td>
                      <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
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
