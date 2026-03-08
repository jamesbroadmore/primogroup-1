import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Download, FileText, BarChart3, Users, DollarSign, ShieldCheck, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";

const reports = [
  { name: "Staff Utilisation Report", desc: "Hours worked vs available hours by staff member", icon: Users, category: "Operations", table: "timesheets" as const },
  { name: "Client Service Summary", desc: "Services delivered per client with NDIS line items", icon: FileText, category: "NDIS", table: "timesheets" as const },
  { name: "Revenue by Category", desc: "Revenue breakdown by NDIS support category", icon: DollarSign, category: "Financial", table: "timesheets" as const },
  { name: "Compliance Overview", desc: "Staff certification status and upcoming expiries", icon: ShieldCheck, category: "Compliance", table: "compliance_records" as const },
  { name: "Incident Summary", desc: "Monthly incident report with trends and outcomes", icon: BarChart3, category: "Compliance", table: "incidents" as const },
  { name: "Payroll Export", desc: "Timesheet data formatted for Xero/MYOB import", icon: DollarSign, category: "Financial", table: "timesheets" as const },
];

export default function Reports() {
  const [generating, setGenerating] = useState<string | null>(null);

  const handleGenerate = async (report: typeof reports[0]) => {
    setGenerating(report.name);
    try {
      const { data, error } = await supabase.from(report.table).select("*").limit(1000);
      if (error) throw error;
      if (!data || data.length === 0) {
        toast.info("No data available for this report");
        setGenerating(null);
        return;
      }
      const headers = Object.keys(data[0]);
      const csv = [
        headers.join(","),
        ...data.map((row: any) =>
          headers.map(h => {
            const val = row[h];
            if (val === null || val === undefined) return "";
            const str = String(val).replace(/"/g, '""');
            return str.includes(",") || str.includes('"') || str.includes("\n") ? `"${str}"` : str;
          }).join(",")
        ),
      ].join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${report.name.replace(/\s+/g, "_").toLowerCase()}_${format(new Date(), "yyyy-MM-dd")}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`${report.name} exported`);
    } catch (err: any) {
      toast.error(err.message || "Export failed");
    }
    setGenerating(null);
  };

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
              <button
                onClick={() => handleGenerate(r)}
                disabled={generating === r.name}
                className="mt-3 h-8 px-3 rounded-lg border bg-card text-xs font-medium text-foreground flex items-center gap-1.5 hover:bg-secondary transition-colors disabled:opacity-50"
              >
                {generating === r.name ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />}
                Generate
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </AppLayout>
  );
}
