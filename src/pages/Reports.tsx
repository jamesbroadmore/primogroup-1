import { AppLayout } from "@/components/AppLayout";
import { Download, FileText, BarChart3, Users, DollarSign, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";

const reports = [
  { name: "Staff Utilisation Report", desc: "Hours worked vs available hours by staff member", icon: Users, category: "Operations" },
  { name: "Client Service Summary", desc: "Services delivered per client with NDIS line items", icon: FileText, category: "NDIS" },
  { name: "Revenue by Category", desc: "Revenue breakdown by NDIS support category", icon: DollarSign, category: "Financial" },
  { name: "Compliance Overview", desc: "Staff certification status and upcoming expiries", icon: ShieldCheck, category: "Compliance" },
  { name: "Incident Summary", desc: "Monthly incident report with trends and outcomes", icon: BarChart3, category: "Compliance" },
  { name: "Payroll Export", desc: "Timesheet data formatted for Xero/MYOB import", icon: DollarSign, category: "Financial" },
];

export default function Reports() {
  return (
    <AppLayout title="Reports">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reports.map((r, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="rounded-xl bg-card p-5 shadow-card border border-border/50 flex items-start gap-4"
          >
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <r.icon className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-card-foreground">{r.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{r.desc}</p>
                </div>
                <span className="text-[10px] font-medium text-muted-foreground bg-secondary px-2 py-0.5 rounded-full shrink-0">{r.category}</span>
              </div>
              <button className="mt-3 h-8 px-3 rounded-lg border bg-card text-xs font-medium text-foreground flex items-center gap-1.5 hover:bg-secondary transition-colors">
                <Download className="h-3 w-3" /> Generate
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </AppLayout>
  );
}
