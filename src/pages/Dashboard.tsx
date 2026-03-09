import { AppLayout } from "@/components/AppLayout";
import { MetricCard } from "@/components/MetricCard";
import { Users, UserCircle, CalendarDays, DollarSign, AlertTriangle, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getPerthGreeting, getPerthDate, formatPerthTime } from "@/lib/perth-time";

export default function Dashboard() {
  const { user } = useAuth();

  const { data: greeting } = useQuery({
    queryKey: ["dashboard-greeting", user?.id],
    enabled: !!user,
    queryFn: async () => {
      // Get profile → staff link to find preferred_name
      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name, staff_id")
        .eq("user_id", user!.id)
        .single();

      if (profile?.staff_id) {
        const { data: staff } = await supabase
          .from("staff")
          .select("preferred_name, first_name")
          .eq("id", profile.staff_id)
          .single();
        if (staff?.preferred_name) return staff.preferred_name;
        if (staff?.first_name) return staff.first_name;
      }

      return profile?.display_name || user!.email?.split("@")[0] || "there";
    },
  });

  const { data: staffCount = 0 } = useQuery({
    queryKey: ["dashboard-staff-count"],
    queryFn: async () => {
      const { count } = await supabase.from("staff").select("*", { count: "exact", head: true }).eq("status", "active");
      return count ?? 0;
    },
  });

  const { data: clientCount = 0 } = useQuery({
    queryKey: ["dashboard-client-count"],
    queryFn: async () => {
      const { count } = await supabase.from("clients").select("*", { count: "exact", head: true }).eq("status", "active");
      return count ?? 0;
    },
  });

  const { data: todayCheckins = 0 } = useQuery({
    queryKey: ["dashboard-checkins-today"],
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];
      const { count } = await supabase.from("shift_checkins").select("*", { count: "exact", head: true }).eq("shift_date", today);
      return count ?? 0;
    },
  });

  const { data: openIncidents = 0 } = useQuery({
    queryKey: ["dashboard-incidents"],
    queryFn: async () => {
      const { count } = await supabase.from("incidents").select("*", { count: "exact", head: true }).in("status", ["open", "investigating"]);
      return count ?? 0;
    },
  });

  const { data: complianceAlerts = 0 } = useQuery({
    queryKey: ["dashboard-compliance-alerts"],
    queryFn: async () => {
      const { count } = await supabase.from("compliance_records").select("*", { count: "exact", head: true }).in("status", ["expiring_soon", "expired"]);
      return count ?? 0;
    },
  });

  const { data: recentCheckins = [], isLoading } = useQuery({
    queryKey: ["dashboard-recent-checkins"],
    queryFn: async () => {
      const { data } = await supabase.from("shift_checkins").select("*").order("created_at", { ascending: false }).limit(5);
      return data ?? [];
    },
  });

  const metrics = [
    { title: "Active Staff", value: staffCount, change: "", changeType: "neutral" as const, icon: Users, iconColor: "bg-primary/10 text-primary", href: "/staff" },
    { title: "Active Clients", value: clientCount, change: "", changeType: "neutral" as const, icon: UserCircle, iconColor: "bg-info/10 text-info", href: "/clients" },
    { title: "Check-Ins Today", value: todayCheckins, change: "", changeType: "neutral" as const, icon: CalendarDays, iconColor: "bg-warning/10 text-warning", href: "/check-in" },
    { title: "Open Incidents", value: openIncidents, change: openIncidents > 0 ? "Requires attention" : "All clear", changeType: openIncidents > 0 ? "negative" as const : "positive" as const, icon: AlertTriangle, iconColor: "bg-destructive/10 text-destructive", href: "/incidents" },
    { title: "Compliance Alerts", value: complianceAlerts, change: complianceAlerts > 0 ? "Action needed" : "All current", changeType: complianceAlerts > 0 ? "negative" as const : "positive" as const, icon: ShieldCheck, iconColor: "bg-warning/10 text-warning", href: "/compliance" },
  ];

  return (
    <AppLayout title="Dashboard">
      <div className="space-y-6">
        <motion.h2
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xl font-semibold text-foreground"
        >
          {getTimeGreeting()}, {greeting ?? "..."}
        </motion.h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {metrics.map((m, i) => (
            <MetricCard key={i} {...m} />
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-xl bg-card p-5 shadow-card border border-border/50"
        >
          <h2 className="text-sm font-semibold text-card-foreground mb-4">Recent Activity</h2>
          {isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : recentCheckins.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No recent activity. Check-ins will appear here.</p>
          ) : (
            <div className="space-y-3">
              {recentCheckins.map((c: any) => (
                <div key={c.id} className="flex items-center justify-between py-2.5 px-3 rounded-lg bg-secondary/50">
                  <div>
                    <p className="text-sm font-medium text-card-foreground">{c.staff_name}</p>
                    <p className="text-xs text-muted-foreground">{c.client_name || "No client"} · {c.check_in_time ? new Date(c.check_in_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}</p>
                  </div>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                    c.status === "checked_in" ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"
                  }`}>{c.status === "checked_in" ? "Active" : "Completed"}</span>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </AppLayout>
  );
}
