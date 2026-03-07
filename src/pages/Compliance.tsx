import { AppLayout } from "@/components/AppLayout";
import { ShieldCheck, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { motion } from "framer-motion";

const complianceData = [
  { staff: "Sarah Mitchell", policeCheck: "Valid", ndisScreen: "Valid", firstAid: "Valid", manualHandling: "Valid" },
  { staff: "James Robertson", policeCheck: "Valid", ndisScreen: "Valid", firstAid: "Valid", manualHandling: "Expiring" },
  { staff: "Emily Watson", policeCheck: "Valid", ndisScreen: "Valid", firstAid: "Valid", manualHandling: "Valid" },
  { staff: "David Lee", policeCheck: "Expiring", ndisScreen: "Valid", firstAid: "Expired", manualHandling: "Valid" },
  { staff: "Priya Sharma", policeCheck: "Valid", ndisScreen: "Valid", firstAid: "Valid", manualHandling: "Valid" },
  { staff: "Tom Andrews", policeCheck: "Expired", ndisScreen: "Expired", firstAid: "Expired", manualHandling: "Expired" },
];

function StatusBadge({ status }: { status: string }) {
  const styles = status === "Valid" ? "bg-success/10 text-success" :
    status === "Expiring" ? "bg-warning/10 text-warning" : "bg-destructive/10 text-destructive";
  const Icon = status === "Valid" ? CheckCircle : status === "Expiring" ? AlertTriangle : XCircle;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${styles}`}>
      <Icon className="h-3 w-3" />{status}
    </span>
  );
}

export default function Compliance() {
  const alerts = complianceData.flatMap(s =>
    [
      s.policeCheck !== "Valid" && `${s.staff}: Police Check ${s.policeCheck}`,
      s.firstAid !== "Valid" && `${s.staff}: First Aid ${s.firstAid}`,
      s.ndisScreen !== "Valid" && `${s.staff}: NDIS Screening ${s.ndisScreen}`,
      s.manualHandling !== "Valid" && `${s.staff}: Manual Handling ${s.manualHandling}`,
    ].filter(Boolean)
  );

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
              {alerts.map((a, i) => <li key={i} className="text-xs text-warning/80">• {a}</li>)}
            </ul>
          </motion.div>
        )}

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl bg-card shadow-card border border-border/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-secondary/50">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Staff</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Police Check</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">NDIS Screening</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">First Aid</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Manual Handling</th>
                </tr>
              </thead>
              <tbody>
                {complianceData.map((s, i) => (
                  <tr key={i} className="border-b last:border-0 hover:bg-secondary/30 transition-colors">
                    <td className="px-4 py-3 font-medium text-card-foreground">{s.staff}</td>
                    <td className="px-4 py-3"><StatusBadge status={s.policeCheck} /></td>
                    <td className="px-4 py-3"><StatusBadge status={s.ndisScreen} /></td>
                    <td className="px-4 py-3 hidden md:table-cell"><StatusBadge status={s.firstAid} /></td>
                    <td className="px-4 py-3 hidden md:table-cell"><StatusBadge status={s.manualHandling} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </AppLayout>
  );
}
