import { AppLayout } from "@/components/AppLayout";
import { Download, CheckCircle, Clock } from "lucide-react";
import { motion } from "framer-motion";

const timesheets = [
  { staff: "Sarah Mitchell", client: "Maria Torres", date: "Mar 3", start: "9:00 AM", end: "1:00 PM", hours: 4, category: "Core Support", status: "Approved" },
  { staff: "James Robertson", client: "Robert Kim", date: "Mar 3", start: "10:00 AM", end: "2:00 PM", hours: 4, category: "Core Support", status: "Pending" },
  { staff: "Emily Watson", client: "Helen Smith", date: "Mar 3", start: "1:00 PM", end: "5:00 PM", hours: 4, category: "Capacity Building", status: "Approved" },
  { staff: "David Lee", client: "Frank Pearson", date: "Mar 4", start: "8:00 AM", end: "2:00 PM", hours: 6, category: "Core Support", status: "Pending" },
  { staff: "Priya Sharma", client: "Linda Chen", date: "Mar 4", start: "9:00 AM", end: "1:00 PM", hours: 4, category: "Support Coordination", status: "Approved" },
];

export default function Timesheets() {
  return (
    <AppLayout title="Timesheets">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Week ending March 9, 2026</p>
          <button className="h-9 px-4 rounded-lg border bg-card text-sm font-medium text-foreground flex items-center gap-2 hover:bg-secondary transition-colors">
            <Download className="h-4 w-4" /> Export CSV
          </button>
        </div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl bg-card shadow-card border border-border/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-secondary/50">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Staff</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Client</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Date</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Time</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Hours</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Category</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {timesheets.map((t, i) => (
                  <tr key={i} className="border-b last:border-0 hover:bg-secondary/30 transition-colors">
                    <td className="px-4 py-3 font-medium text-card-foreground">{t.staff}</td>
                    <td className="px-4 py-3 text-muted-foreground">{t.client}</td>
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{t.date}</td>
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{t.start} – {t.end}</td>
                    <td className="px-4 py-3 text-card-foreground font-medium">{t.hours}h</td>
                    <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">{t.category}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                        t.status === "Approved" ? "bg-success/10 text-success" : "bg-warning/10 text-warning"
                      }`}>
                        {t.status === "Approved" ? <CheckCircle className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                        {t.status}
                      </span>
                    </td>
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
