import { AppLayout } from "@/components/AppLayout";
import { Users, UserCircle, CalendarDays, AlertTriangle, ShieldCheck, FileText, Loader2, ChevronRight, Clock, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { getPerthGreeting, getPerthDate, formatPerthTime } from "@/lib/perth-time";
import { useNavigate } from "react-router-dom";

// Generate avatar initials + color from name
function getAvatarProps(name: string) {
  const colors = [
    "linear-gradient(135deg, #f472b6, #ec4899)",
    "linear-gradient(135deg, #fb923c, #f97316)",
    "linear-gradient(135deg, #fbbf24, #f59e0b)",
    "linear-gradient(135deg, #4ade80, #22c55e)",
    "linear-gradient(135deg, #60a5fa, #3b82f6)",
    "linear-gradient(135deg, #a78bfa, #8b5cf6)",
    "linear-gradient(135deg, #2dd4bf, #14b8a6)",
  ];
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  const colorIdx = name.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) % colors.length;
  return { initials, color: colors[colorIdx] };
}

function StatCard({
  label,
  value,
  sub,
  gradient,
  icon: Icon,
  href,
}: {
  label: string;
  value: number | string;
  sub?: string;
  gradient: string;
  icon: any;
  href?: string;
}) {
  const navigate = useNavigate();
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={href ? () => navigate(href) : undefined}
      className={`relative overflow-hidden rounded-2xl bg-white p-5 shadow-sm border border-border/50 flex items-center gap-4 ${href ? "cursor-pointer hover:shadow-md hover:border-primary/20 transition-all" : ""}`}
    >
      {/* Icon box */}
      <div
        className="h-14 w-14 rounded-2xl flex items-center justify-center shrink-0 shadow-md"
        style={{ background: gradient }}
      >
        <Icon className="h-6 w-6 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[26px] font-bold text-foreground leading-tight">{value}</p>
        <p className="text-sm font-semibold text-foreground/70">{label}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
      {href && (
        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
      )}
    </motion.div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: greeting } = useQuery({
    queryKey: ["dashboard-greeting", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data: profile } = await supabase
        .from("profiles").select("display_name, staff_id").eq("user_id", user!.id).single();
      if (profile?.staff_id) {
        const { data: staff } = await supabase.from("staff").select("preferred_name, first_name").eq("id", profile.staff_id).single();
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
      const today = getPerthDate();
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

  const { data: todayNotes = 0 } = useQuery({
    queryKey: ["dashboard-notes-today"],
    queryFn: async () => {
      const today = getPerthDate();
      const { count } = await supabase.from("case_notes").select("*", { count: "exact", head: true }).gte("note_date", `${today}T00:00:00`).lte("note_date", `${today}T23:59:59`);
      return count ?? 0;
    },
  });

  const { data: recentCheckins = [], isLoading: checkinsLoading } = useQuery({
    queryKey: ["dashboard-recent-checkins"],
    queryFn: async () => {
      const { data } = await supabase
        .from("shift_checkins")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(6);
      return data ?? [];
    },
  });

  const { data: upcomingShifts = [], isLoading: shiftsLoading } = useQuery({
    queryKey: ["dashboard-upcoming-shifts"],
    queryFn: async () => {
      const today = getPerthDate();
      const { data } = await supabase
        .from("timesheets")
        .select("*, staff:staff_id(first_name, last_name, preferred_name), client:client_id(first_name, last_name)")
        .gte("shift_date", today)
        .order("shift_date")
        .order("start_time")
        .limit(5);
      return data ?? [];
    },
  });

  const totalAlerts = openIncidents + complianceAlerts;

  return (
    <AppLayout title="Dashboard">
      <div className="space-y-6 max-w-6xl">
        {/* Greeting Header */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h2 className="text-2xl font-bold text-foreground">
              <span style={{ fontWeight: 800 }}>Your</span>{" "}
              <span className="text-muted-foreground font-normal">Dashboard</span>
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {getPerthGreeting()}, {greeting ?? "..."} · Welcome back
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-right hidden sm:block">
              <p className="text-xs text-muted-foreground">Today</p>
              <p className="text-sm font-semibold text-foreground">
                {new Date().toLocaleDateString("en-AU", { weekday: "short", day: "numeric", month: "short" })}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Top Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard
            label="Staff on Shift"
            value={todayCheckins}
            sub="Active check-ins today"
            gradient="linear-gradient(135deg, #a78bfa, #8b5cf6)"
            icon={Users}
            href="/check-in"
          />
          <StatCard
            label="Active Staff"
            value={staffCount}
            sub="Registered care workers"
            gradient="linear-gradient(135deg, #60a5fa, #3b82f6)"
            icon={UserCircle}
            href="/staff"
          />
          <StatCard
            label={`Alert${totalAlerts !== 1 ? "s" : ""}`}
            value={totalAlerts}
            sub={totalAlerts > 0 ? "Requires attention" : "All clear"}
            gradient={totalAlerts > 0 ? "linear-gradient(135deg, #fb923c, #f97316)" : "linear-gradient(135deg, #4ade80, #22c55e)"}
            icon={totalAlerts > 0 ? AlertTriangle : ShieldCheck}
            href="/compliance"
          />
        </div>

        {/* Secondary Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            onClick={() => navigate("/clients")}
            className="rounded-2xl bg-white border border-border/50 shadow-sm p-4 flex items-center gap-3 cursor-pointer hover:shadow-md hover:border-primary/20 transition-all"
          >
            <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #2dd4bf, #14b8a6)" }}>
              <UserCircle className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-xl font-bold text-foreground">{clientCount}</p>
              <p className="text-xs text-muted-foreground font-medium">Active Clients</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            onClick={() => navigate("/case-notes")}
            className="rounded-2xl bg-white border border-border/50 shadow-sm p-4 flex items-center gap-3 cursor-pointer hover:shadow-md hover:border-primary/20 transition-all"
          >
            <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #fbbf24, #f59e0b)" }}>
              <FileText className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-xl font-bold text-foreground">{todayNotes}</p>
              <p className="text-xs text-muted-foreground font-medium">Notes Today</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            onClick={() => navigate("/incidents")}
            className="rounded-2xl bg-white border border-border/50 shadow-sm p-4 flex items-center gap-3 cursor-pointer hover:shadow-md hover:border-primary/20 transition-all"
          >
            <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ background: openIncidents > 0 ? "linear-gradient(135deg, #f87171, #ef4444)" : "linear-gradient(135deg, #4ade80, #22c55e)" }}>
              <AlertTriangle className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-xl font-bold text-foreground">{openIncidents}</p>
              <p className="text-xs text-muted-foreground font-medium">Open Incidents</p>
            </div>
          </motion.div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {/* Upcoming Shifts - wider */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
            className="lg:col-span-3 rounded-2xl bg-white border border-border/50 shadow-sm overflow-hidden"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-border/40">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, #fb923c, #f97316)" }}>
                  <CalendarDays className="h-3.5 w-3.5 text-white" />
                </div>
                <h3 className="text-sm font-semibold text-foreground">Upcoming Shifts</h3>
              </div>
              <button
                onClick={() => navigate("/roster")}
                className="text-xs text-primary font-medium hover:underline flex items-center gap-1"
              >
                View Roster <ChevronRight className="h-3 w-3" />
              </button>
            </div>

            {shiftsLoading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : upcomingShifts.length === 0 ? (
              <div className="py-10 text-center">
                <CalendarDays className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No upcoming shifts scheduled</p>
              </div>
            ) : (
              <div className="divide-y divide-border/30">
                {upcomingShifts.map((shift: any, i: number) => {
                  const staffName = shift.staff
                    ? `${shift.staff.preferred_name || shift.staff.first_name} ${shift.staff.last_name}`
                    : "Unknown";
                  const clientName = shift.client
                    ? `${shift.client.first_name} ${shift.client.last_name}`
                    : "No client";
                  const avatarProps = getAvatarProps(staffName);
                  const shiftDate = new Date(shift.shift_date + "T00:00:00");
                  const isToday = shift.shift_date === getPerthDate();

                  return (
                    <div key={shift.id || i} className="flex items-center gap-4 px-5 py-3.5 hover:bg-secondary/30 transition-colors">
                      {/* Avatar */}
                      <div
                        className="h-9 w-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm"
                        style={{ background: avatarProps.color }}
                      >
                        {avatarProps.initials}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{staffName}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {clientName}
                          {isToday ? "" : ` · ${shiftDate.toLocaleDateString("en-AU", { weekday: "short", day: "numeric", month: "short" })}`}
                        </p>
                      </div>

                      {/* Time */}
                      <div className="text-right shrink-0">
                        <p className="text-sm font-semibold text-foreground">
                          {shift.start_time ? shift.start_time.slice(0, 5) : "—"}
                        </p>
                        {isToday && (
                          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
                            Today
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>

          {/* Recent Activity - narrower */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="lg:col-span-2 rounded-2xl bg-white border border-border/50 shadow-sm overflow-hidden"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-border/40">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, #4ade80, #22c55e)" }}>
                  <Clock className="h-3.5 w-3.5 text-white" />
                </div>
                <h3 className="text-sm font-semibold text-foreground">Recent Activity</h3>
              </div>
              <button
                onClick={() => navigate("/check-in")}
                className="text-xs text-primary font-medium hover:underline flex items-center gap-1"
              >
                All <ChevronRight className="h-3 w-3" />
              </button>
            </div>

            {checkinsLoading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : recentCheckins.length === 0 ? (
              <div className="py-10 text-center">
                <TrendingUp className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No recent activity</p>
              </div>
            ) : (
              <div className="divide-y divide-border/30">
                {recentCheckins.map((c: any) => {
                  const avatarProps = getAvatarProps(c.staff_name || "UN");
                  return (
                    <div key={c.id} className="flex items-center gap-3 px-4 py-3 hover:bg-secondary/30 transition-colors">
                      <div
                        className="h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                        style={{ background: avatarProps.color }}
                      >
                        {avatarProps.initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-foreground truncate">{c.staff_name}</p>
                        <p className="text-[10px] text-muted-foreground truncate">
                          {c.client_name || "No client"} · {c.check_in_time ? formatPerthTime(c.check_in_time) : "—"}
                        </p>
                      </div>
                      <span
                        className={`text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0 ${
                          c.status === "checked_in"
                            ? "bg-success/10 text-success"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {c.status === "checked_in" ? "Active" : "Done"}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </AppLayout>
  );
}
