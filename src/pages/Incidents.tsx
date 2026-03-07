import { AppLayout } from "@/components/AppLayout";
import { Plus, AlertTriangle, AlertCircle, Shield, Pill } from "lucide-react";
import { motion } from "framer-motion";

const incidents = [
  { type: "Medication Error", icon: Pill, client: "Robert Kim", date: "Mar 3, 2026", staff: "James Robertson", severity: "Low", status: "Resolved", desc: "Incorrect dosage administered. Corrected immediately. No adverse effects." },
  { type: "Behaviour Event", icon: AlertCircle, client: "Frank Pearson", date: "Mar 2, 2026", staff: "David Lee", severity: "Medium", status: "Under Review", desc: "Client displayed agitation during community outing. De-escalation techniques applied." },
  { type: "Injury", icon: AlertTriangle, client: "Maria Torres", date: "Feb 28, 2026", staff: "Sarah Mitchell", severity: "Low", status: "Resolved", desc: "Minor slip in bathroom. No injury sustained. Incident documented per protocol." },
  { type: "Safeguarding", icon: Shield, client: "Helen Smith", date: "Feb 25, 2026", staff: "Emily Watson", severity: "High", status: "Escalated", desc: "Concern raised regarding potential financial exploitation. Referred to safeguarding team." },
];

export default function Incidents() {
  return (
    <AppLayout title="Incident Reports">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{incidents.length} incidents this month</p>
          <button className="h-9 px-4 rounded-lg bg-destructive text-destructive-foreground text-sm font-medium flex items-center gap-2 hover:opacity-90 transition-opacity">
            <Plus className="h-4 w-4" /> Report Incident
          </button>
        </div>

        <div className="space-y-3">
          {incidents.map((inc, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-xl bg-card p-5 shadow-card border border-border/50"
            >
              <div className="flex items-start gap-3">
                <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${
                  inc.severity === "High" ? "bg-destructive/10" : inc.severity === "Medium" ? "bg-warning/10" : "bg-muted"
                }`}>
                  <inc.icon className={`h-4 w-4 ${
                    inc.severity === "High" ? "text-destructive" : inc.severity === "Medium" ? "text-warning" : "text-muted-foreground"
                  }`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div>
                      <p className="text-sm font-semibold text-card-foreground">{inc.type}</p>
                      <p className="text-xs text-muted-foreground">{inc.client} · {inc.staff} · {inc.date}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        inc.severity === "High" ? "bg-destructive/10 text-destructive" :
                        inc.severity === "Medium" ? "bg-warning/10 text-warning" : "bg-muted text-muted-foreground"
                      }`}>{inc.severity}</span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        inc.status === "Resolved" ? "bg-success/10 text-success" :
                        inc.status === "Escalated" ? "bg-destructive/10 text-destructive" : "bg-warning/10 text-warning"
                      }`}>{inc.status}</span>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">{inc.desc}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
