import { AppLayout } from "@/components/AppLayout";
import { Download, CheckCircle, Clock, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState } from "react";
import { formatPerthDate, formatPerthTime, extractPerthTime } from "@/lib/perth-time";
import { TimesheetDetailDialog } from "@/components/timesheets/TimesheetDetailDialog";

export default function Timesheets() {
  const [selectedTimesheet, setSelectedTimesheet] = useState<any>(null);

  const { data: timesheets = [], isLoading } = useQuery({
    queryKey: ["timesheets"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("timesheets")
        .select("*, staff:staff_id(first_name, last_name), client:client_id(first_name, last_name)")
        .order("shift_date", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
  });

  const handleExport = () => {
    if (timesheets.length === 0) {
      toast.info("No timesheets to export");
      return;
    }
    const headers = ["Staff", "Client", "Date", "Start (AWST)", "End (AWST)", "Hours", "Break (min)", "Status"];
    const rows = timesheets.map((t: any) => [
      t.staff ? `${t.staff.first_name} ${t.staff.last_name}` : "",
      t.client ? `${t.client.first_name} ${t.client.last_name}` : "",
      t.shift_date,
      t.start_time ? extractPerthTime(t.start_time) : "",
      t.end_time ? extractPerthTime(t.end_time) : "",
      t.total_hours ?? "",
      t.break_minutes ?? 0,
      t.status,
    ]);
    const csv = [headers.join(","), ...rows.map(r => r.map(v => `"${v}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `timesheets_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Timesheets exported");
  };

  return (
    <AppLayout title="Timesheets">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{timesheets.length} timesheet entries</p>
          <button
            onClick={handleExport}
            className="h-9 px-4 rounded-lg border bg-card text-sm font-medium text-foreground flex items-center gap-2 hover:bg-secondary transition-colors"
          >
            <Download className="h-4 w-4" /> Export CSV
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : timesheets.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl bg-card p-12 shadow-card border border-border/50 text-center">
            <p className="text-muted-foreground text-sm">No timesheets yet. Timesheets will appear as staff complete shifts.</p>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl bg-card shadow-card border border-border/50 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-secondary/50">
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Staff</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Client</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Date</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Time (AWST)</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Hours</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {timesheets.map((t: any) => (
                    <tr
                      key={t.id}
                      onClick={() => setSelectedTimesheet(t)}
                      className="border-b last:border-0 hover:bg-secondary/30 transition-colors cursor-pointer"
                    >
                      <td className="px-4 py-3 font-medium text-card-foreground">
                        {t.staff ? `${t.staff.first_name} ${t.staff.last_name}` : "—"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {t.client ? `${t.client.first_name} ${t.client.last_name}` : "—"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                        {formatPerthDate(t.shift_date)}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">
                        {t.start_time ? formatPerthTime(t.start_time) : "—"}
                        {t.end_time ? ` – ${formatPerthTime(t.end_time)}` : ""}
                      </td>
                      <td className="px-4 py-3 text-card-foreground font-medium">{t.total_hours ? `${t.total_hours}h` : "—"}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                          t.status === "approved" ? "bg-success/10 text-success" :
                          t.status === "paid" ? "bg-info/10 text-info" :
                          "bg-warning/10 text-warning"
                        }`}>
                          {t.status === "approved" || t.status === "paid" ? <CheckCircle className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                          {t.status}
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

      {selectedTimesheet && (
        <TimesheetDetailDialog
          timesheet={selectedTimesheet}
          onClose={() => setSelectedTimesheet(null)}
        />
      )}
    </AppLayout>
  );
}
