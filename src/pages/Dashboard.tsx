import { AppLayout } from "@/components/AppLayout";
import { MetricCard } from "@/components/MetricCard";
import {
  Users,
  UserCircle,
  CalendarDays,
  DollarSign,
  AlertTriangle,
  ShieldCheck,
  Clock,
  FileText,
} from "lucide-react";
import { motion } from "framer-motion";

const metrics = [
  { title: "Active Staff", value: 24, change: "+2 this week", changeType: "positive" as const, icon: Users, iconColor: "bg-primary/10 text-primary" },
  { title: "Clients Today", value: 18, change: "3 new this month", changeType: "positive" as const, icon: UserCircle, iconColor: "bg-info/10 text-info" },
  { title: "Shifts Today", value: 12, change: "2 unassigned", changeType: "negative" as const, icon: CalendarDays, iconColor: "bg-warning/10 text-warning" },
  { title: "Revenue (Week)", value: "$14,280", change: "+8.2% vs last week", changeType: "positive" as const, icon: DollarSign, iconColor: "bg-success/10 text-success" },
  { title: "Incidents", value: 1, change: "Pending review", changeType: "negative" as const, icon: AlertTriangle, iconColor: "bg-destructive/10 text-destructive" },
  { title: "Compliance Alerts", value: 3, change: "Expiring soon", changeType: "negative" as const, icon: ShieldCheck, iconColor: "bg-warning/10 text-warning" },
];

const recentActivity = [
  { time: "2 min ago", text: "Sarah M. checked in for shift at Client #1042", icon: Clock },
  { time: "15 min ago", text: "Case note submitted by James R. for Maria T.", icon: FileText },
  { time: "1 hr ago", text: "New incident report: Medication error (resolved)", icon: AlertTriangle },
  { time: "2 hrs ago", text: "Timesheet approved: Week ending Mar 2", icon: Clock },
  { time: "3 hrs ago", text: "Police check expiring for David L. in 14 days", icon: ShieldCheck },
];

const upcomingShifts = [
  { staff: "Sarah M.", client: "Maria T.", time: "9:00 AM – 1:00 PM", status: "In Progress" },
  { staff: "James R.", client: "Robert K.", time: "10:00 AM – 2:00 PM", status: "Upcoming" },
  { staff: "Emily W.", client: "Helen S.", time: "1:00 PM – 5:00 PM", status: "Upcoming" },
  { staff: "David L.", client: "Frank P.", time: "2:00 PM – 6:00 PM", status: "Upcoming" },
];

export default function Dashboard() {
  return (
    <AppLayout title="Dashboard">
      <div className="space-y-6">
        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {metrics.map((m, i) => (
            <MetricCard key={i} {...m} />
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {/* Upcoming Shifts */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-3 rounded-xl bg-card p-5 shadow-card border border-border/50"
          >
            <h2 className="text-sm font-semibold text-card-foreground mb-4">Upcoming Shifts</h2>
            <div className="space-y-3">
              {upcomingShifts.map((shift, i) => (
                <div key={i} className="flex items-center justify-between py-2.5 px-3 rounded-lg bg-secondary/50">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-card-foreground truncate">{shift.staff}</p>
                    <p className="text-xs text-muted-foreground">{shift.client} · {shift.time}</p>
                  </div>
                  <span
                    className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                      shift.status === "In Progress"
                        ? "bg-success/10 text-success"
                        : "bg-primary/10 text-primary"
                    }`}
                  >
                    {shift.status}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Activity Feed */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="lg:col-span-2 rounded-xl bg-card p-5 shadow-card border border-border/50"
          >
            <h2 className="text-sm font-semibold text-card-foreground mb-4">Recent Activity</h2>
            <div className="space-y-4">
              {recentActivity.map((item, i) => (
                <div key={i} className="flex gap-3">
                  <div className="mt-0.5 h-7 w-7 rounded-full bg-secondary flex items-center justify-center shrink-0">
                    <item.icon className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-card-foreground leading-relaxed">{item.text}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{item.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </AppLayout>
  );
}
