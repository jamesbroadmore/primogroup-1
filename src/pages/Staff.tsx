import { AppLayout } from "@/components/AppLayout";
import { Plus, Search, MoreHorizontal, CheckCircle, XCircle } from "lucide-react";
import { motion } from "framer-motion";

const staffData = [
  { name: "Sarah Mitchell", role: "Support Worker", type: "Full-time", rate: "$32/hr", status: "Active", compliance: "Complete" },
  { name: "James Robertson", role: "Support Worker", type: "Part-time", rate: "$32/hr", status: "Active", compliance: "Complete" },
  { name: "Emily Watson", role: "Team Leader", type: "Full-time", rate: "$42/hr", status: "Active", compliance: "Complete" },
  { name: "David Lee", role: "Support Worker", type: "Casual", rate: "$35/hr", status: "Active", compliance: "Expiring" },
  { name: "Priya Sharma", role: "Support Coordinator", type: "Full-time", rate: "$45/hr", status: "Active", compliance: "Complete" },
  { name: "Tom Andrews", role: "Support Worker", type: "Part-time", rate: "$32/hr", status: "Inactive", compliance: "Expired" },
];

export default function Staff() {
  return (
    <AppLayout title="Staff Management">
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              className="w-full h-9 pl-9 pr-3 rounded-lg border bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Search staff..."
            />
          </div>
          <button className="h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium flex items-center gap-2 hover:opacity-90 transition-opacity">
            <Plus className="h-4 w-4" />
            Add Staff
          </button>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-xl bg-card shadow-card border border-border/50 overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-secondary/50">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Name</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Role</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Type</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Rate</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Compliance</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {staffData.map((s, i) => (
                  <tr key={i} className="border-b last:border-0 hover:bg-secondary/30 transition-colors">
                    <td className="px-4 py-3 font-medium text-card-foreground">{s.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{s.role}</td>
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{s.type}</td>
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{s.rate}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                        s.status === "Active" ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"
                      }`}>
                        {s.status === "Active" ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                        {s.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        s.compliance === "Complete" ? "bg-success/10 text-success" :
                        s.compliance === "Expiring" ? "bg-warning/10 text-warning" :
                        "bg-destructive/10 text-destructive"
                      }`}>
                        {s.compliance}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button className="text-muted-foreground hover:text-foreground transition-colors">
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
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
