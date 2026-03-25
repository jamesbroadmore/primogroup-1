import { AppLayout } from "@/components/AppLayout";
import { Download, CheckCircle, Clock, Loader2, Receipt } from "lucide-react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState } from "react";
import { formatPerthDate, formatPerthTime, extractPerthTime } from "@/lib/perth-time";
import { TimesheetDetailDialog } from "@/components/timesheets/TimesheetDetailDialog";
import { fullName } from "@/lib/display-names";
import { Avatar, TableContainer, TableHead, Th, Td, OutlineButton, StatusBadge, EmptyState } from "@/components/ui-kit";

export default function Timesheets() {
  const [selectedTimesheet, setSelectedTimesheet] = useState<any>(null);

  const { data: timesheets = [], isLoading } = useQuery({
    queryKey: ["timesheets"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("timesheets")
        .select("*, staff:staff_id(first_name, last_name, preferred_name), client:client_id(first_name, last_name, preferred_name)")
        .order("shift_date", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
  });

  const handleExport = () => {
    if (timesheets.length === 0) { toast.info("No timesheets to export"); return; }
    const headers = ["Staff", "Client", "Date", "Start (AWST)", "End (AWST)", "Hours", "Break (min)", "Status"];
    const rows = timesheets.map((t: any) => [
      fullName(t.staff), fullName(t.client), t.shift_date,
      t.start_time ? extractPerthTime(t.start_time) : "",
      t.end_time ? extractPerthTime(t.end_time) : "",
      t.total_hours ?? "", t.break_minutes ?? 0, t.status,
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

  const totalHours = timesheets.reduce((sum: number, t: any) => sum + (t.total_hours || 0), 0);
  const approvedCount = timesheets.filter((t: any) => t.status === "approved" || t.status === "paid").length;

  return (
    <AppLayout title="Timesheets">
      <div className="space-y-5">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Total Entries", value: timesheets.length, gradient: "linear-gradient(135deg, #a78bfa, #8b5cf6)", icon: Receipt },
            { label: "Total Hours", value: `${totalHours.toFixed(1)}h`, gradient: "linear-gradient(135deg, #60a5fa, #3b82f6)", icon: Clock },
            { label: "Approved", value: approvedCount, gradient: "linear-gradient(135deg, #4ade80, #22c55e)", icon: CheckCircle },
          ].map((stat, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="rounded-2xl bg-white border border-border/50 shadow-sm p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm" style={{ background: stat.gradient }}>
                <stat.icon className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-xl font-bold text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{timesheets.length} timesheet entries</p>
          <OutlineButton onClick={handleExport}>
            <Download className="h-4 w-4" /> Export CSV
          </OutlineButton>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : timesheets.length === 0 ? (
          <div className="rounded-2xl bg-white border border-border/50 shadow-sm">
            <EmptyState
              icon={Clock}
              title="No timesheets yet"
              description="Timesheets will appear as staff complete shifts."
            />
          </div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <TableContainer>
              <TableHead>
                <Th>Staff</Th>
                <Th>Client</Th>
                <Th className="hidden md:table-cell">Date</Th>
                <Th className="hidden lg:table-cell">Time (AWST)</Th>
                <Th>Hours</Th>
                <Th>Status</Th>
              </TableHead>
              <tbody className="divide-y divide-slate-100">
                {timesheets.map((t: any) => (
                  <tr key={t.id} onClick={() => setSelectedTimesheet(t)}
                    className="hover:bg-slate-50/50 transition-colors cursor-pointer">
                    <Td>
                      <div className="flex items-center gap-2.5">
                        <Avatar name={fullName(t.staff)} size="sm" />
                        <span className="text-sm font-semibold text-foreground">{fullName(t.staff)}</span>
                      </div>
                    </Td>
                    <Td><span className="text-sm text-muted-foreground">{fullName(t.client)}</span></Td>
                    <Td className="hidden md:table-cell"><span className="text-sm text-muted-foreground">{formatPerthDate(t.shift_date)}</span></Td>
                    <Td className="hidden lg:table-cell">
                      <span className="text-sm text-muted-foreground">
                        {t.start_time ? formatPerthTime(t.start_time) : "—"}
                        {t.end_time ? ` – ${formatPerthTime(t.end_time)}` : ""}
                      </span>
                    </Td>
                    <Td>
                      <span className="text-sm font-bold text-foreground">{t.total_hours ? `${t.total_hours}h` : "—"}</span>
                    </Td>
                    <Td><StatusBadge status={t.status} /></Td>
                  </tr>
                ))}
              </tbody>
            </TableContainer>
          </motion.div>
        )}
      </div>

      {selectedTimesheet && (
        <TimesheetDetailDialog timesheet={selectedTimesheet} onClose={() => setSelectedTimesheet(null)} />
      )}
    </AppLayout>
  );
}
