import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Download, FileText, BarChart3, Users, DollarSign, ShieldCheck, Loader2, AlertTriangle, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { fullName } from "@/lib/display-names";

const reports = [
  { name: "Worker Compliance Report", desc: "Worker name, document status, training status, compliance state", icon: ShieldCheck, category: "Compliance", key: "compliance", gradient: "linear-gradient(135deg, #4ade80, #22c55e)" },
  { name: "Staff Utilisation Report", desc: "Hours worked vs available hours by staff member", icon: Users, category: "Operations", key: "timesheets", gradient: "linear-gradient(135deg, #a78bfa, #8b5cf6)" },
  { name: "Client Service Summary", desc: "Services delivered per client with NDIS line items", icon: FileText, category: "NDIS", key: "client-service", gradient: "linear-gradient(135deg, #60a5fa, #3b82f6)" },
  { name: "Incident Report", desc: "All incidents with type, severity, client, and worker", icon: AlertTriangle, category: "Compliance", key: "incidents", gradient: "linear-gradient(135deg, #f87171, #ef4444)" },
  { name: "Case Note Report", desc: "All case notes with client, worker, date, and category", icon: FileText, category: "Records", key: "case-notes", gradient: "linear-gradient(135deg, #2dd4bf, #14b8a6)" },
  { name: "Payroll Export", desc: "Timesheet data formatted for Xero/MYOB import", icon: DollarSign, category: "Financial", key: "payroll", gradient: "linear-gradient(135deg, #fbbf24, #f59e0b)" },
  { name: "Training Records", desc: "Staff training completion and expiry tracking", icon: Clock, category: "Compliance", key: "training", gradient: "linear-gradient(135deg, #fb923c, #f97316)" },
  { name: "Revenue by Category", desc: "Revenue breakdown by NDIS support category", icon: DollarSign, category: "Financial", key: "revenue", gradient: "linear-gradient(135deg, #a78bfa, #6366f1)" },
];

const CATEGORY_COLORS: Record<string, string> = {
  Compliance: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  Operations: "bg-purple-50 text-purple-700 border border-purple-200",
  NDIS: "bg-blue-50 text-blue-700 border border-blue-200",
  Records: "bg-teal-50 text-teal-700 border border-teal-200",
  Financial: "bg-amber-50 text-amber-700 border border-amber-200",
};

function escapeCsv(val: any): string {
  if (val === null || val === undefined) return "";
  const str = String(val).replace(/"/g, '""');
  return str.includes(",") || str.includes('"') || str.includes("\n") ? `"${str}"` : str;
}

function downloadCsv(headers: string[], rows: string[][], filename: string) {
  const csv = [headers.join(","), ...rows.map(r => r.map(escapeCsv).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}_${format(new Date(), "yyyy-MM-dd")}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function Reports() {
  const [generating, setGenerating] = useState<string | null>(null);

  const handleGenerate = async (report: typeof reports[0]) => {
    setGenerating(report.key);
    try {
      switch (report.key) {
        case "compliance": {
          const { data: staff } = await supabase.from("staff").select("id, first_name, last_name, preferred_name, status").eq("status", "active");
          const { data: records } = await supabase.from("compliance_records").select("*");
          const { data: training } = await supabase.from("training_records").select("*");
          if (!staff || staff.length === 0) { toast.info("No active staff"); break; }
          const required = ["worker_screening", "wwcc", "police_check", "first_aid", "cpr"];
          const headers = ["Staff Name", "Status", ...required.map(r => r.replace(/_/g, " ")), "Training Count", "Compliance Status"];
          const rows = staff.map(s => {
            const staffRecs = (records || []).filter((r: any) => r.staff_id === s.id);
            const trainingCount = (training || []).filter((t: any) => t.staff_id === s.id).length;
            const statuses = required.map(r => { const rec = staffRecs.find((sr: any) => sr.record_type === r); return rec ? rec.status : "missing"; });
            const isCompliant = statuses.every(s => s === "current");
            return [fullName(s), s.status, ...statuses, String(trainingCount), isCompliant ? "compliant" : "non_compliant"];
          });
          downloadCsv(headers, rows, "worker_compliance_report");
          toast.success("Worker Compliance Report exported");
          break;
        }
        case "incidents": {
          const { data } = await supabase.from("incidents")
            .select("*, reporter:reported_by(first_name, last_name, preferred_name), client:client_id(first_name, last_name, preferred_name)")
            .order("incident_date", { ascending: false }).limit(1000);
          if (!data || data.length === 0) { toast.info("No incidents"); break; }
          const headers = ["Date", "Type", "Severity", "Client", "Reported By", "Location", "Description", "Injury", "Medical", "Status"];
          const rows = data.map((d: any) => [
            format(new Date(d.incident_date), "yyyy-MM-dd"), d.incident_type, d.severity,
            fullName(d.client), fullName(d.reporter), d.location || "", d.description,
            d.injury_occurred ? "Yes" : "No", d.medical_attention_required ? "Yes" : "No", d.status,
          ]);
          downloadCsv(headers, rows, "incident_report");
          toast.success("Incident Report exported");
          break;
        }
        case "case-notes": {
          const { data } = await supabase.from("case_notes")
            .select("*, staff:staff_id(first_name, last_name, preferred_name), client:client_id(first_name, last_name, preferred_name)")
            .order("note_date", { ascending: false }).limit(1000);
          if (!data || data.length === 0) { toast.info("No case notes"); break; }
          const headers = ["Date", "Client", "Worker", "Category", "Content", "Confidential"];
          const rows = data.map((d: any) => [
            format(new Date(d.note_date), "yyyy-MM-dd HH:mm"), fullName(d.client), fullName(d.staff),
            d.category || "", d.content, d.is_confidential ? "Yes" : "No",
          ]);
          downloadCsv(headers, rows, "case_note_report");
          toast.success("Case Note Report exported");
          break;
        }
        case "training": {
          const { data } = await supabase.from("training_records")
            .select("*, staff:staff_id(first_name, last_name, preferred_name)")
            .order("expiry_date", { ascending: true }).limit(1000);
          if (!data || data.length === 0) { toast.info("No training records"); break; }
          const headers = ["Staff", "Training", "Type", "Provider", "Completed", "Expiry", "Status"];
          const rows = data.map((d: any) => [
            fullName(d.staff), d.training_name, d.training_type, d.provider || "",
            d.completion_date || "", d.expiry_date || "", d.status,
          ]);
          downloadCsv(headers, rows, "training_records");
          toast.success("Training Records exported");
          break;
        }
        default: {
          const { data, error } = await supabase.from("timesheets")
            .select("*, staff:staff_id(first_name, last_name, preferred_name), client:client_id(first_name, last_name, preferred_name)")
            .order("shift_date", { ascending: false }).limit(1000);
          if (error) throw error;
          if (!data || data.length === 0) { toast.info("No data available"); break; }
          const headers = ["Staff", "Client", "Date", "Start", "End", "Hours", "Break (min)", "Rate", "Status"];
          const rows = data.map((d: any) => [
            fullName(d.staff), fullName(d.client), d.shift_date,
            d.start_time || "", d.end_time || "", d.total_hours ?? "", d.break_minutes ?? 0,
            d.rate_per_hour ?? "", d.status,
          ]);
          downloadCsv(headers, rows, report.name.replace(/\s+/g, "_").toLowerCase());
          toast.success(`${report.name} exported`);
        }
      }
    } catch (err: any) {
      toast.error(err.message || "Export failed");
    }
    setGenerating(null);
  };

  return (
    <AppLayout title="Reports">
      <div className="space-y-5">
        <p className="text-sm text-muted-foreground">Generate and download audit-ready compliance and operational reports.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reports.map((r, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="rounded-2xl bg-white border border-border/50 shadow-sm hover:shadow-md transition-shadow p-5 flex items-start gap-4"
            >
              <div className="h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 shadow-md" style={{ background: r.gradient }}>
                <r.icon className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p className="text-sm font-bold text-foreground">{r.name}</p>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${CATEGORY_COLORS[r.category] || "bg-slate-100 text-slate-600"}`}>
                    {r.category}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">{r.desc}</p>
                <button
                  onClick={() => handleGenerate(r)}
                  disabled={generating === r.key}
                  className="mt-3 h-8 px-4 rounded-xl text-xs font-bold text-white flex items-center gap-1.5 hover:opacity-90 transition-all disabled:opacity-50 shadow-sm"
                  style={{ background: r.gradient }}
                >
                  {generating === r.key ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />}
                  Export CSV
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
