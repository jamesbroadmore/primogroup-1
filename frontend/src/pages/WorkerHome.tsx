import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { getPerthGreeting, getPerthDate, formatPerthTime } from "@/lib/perth-time";
import {
  Home,
  Users,
  CalendarDays,
  Bell,
  UserCircle,
  ChevronRight,
  Clock,
  CheckCircle2,
  Circle,
  MessageSquare,
  LogOut,
  FileText,
  ShieldCheck,
  MapPinCheck,
} from "lucide-react";
import { toast } from "sonner";
import cartersIcon from "@/assets/icon.png";

// Flower/pinwheel SVG logo component
function FlowerLogo({ size = 28 }: { size?: number }) {
  return (
    <img src={cartersIcon} alt="Carter's Care" style={{ width: size, height: size }} className="rounded-lg" />
  );
}

// Bottom Nav Item
function BottomNavItem({
  icon: Icon,
  label,
  active,
  onClick,
  badge,
}: {
  icon: any;
  label: string;
  active: boolean;
  onClick: () => void;
  badge?: number;
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-0.5 px-3 py-2 relative transition-all"
    >
      <div
        className={`relative h-10 w-10 rounded-2xl flex items-center justify-center transition-all duration-200 ${
          active
            ? "shadow-md scale-110"
            : "bg-white/60"
        }`}
        style={active ? { background: "linear-gradient(135deg, #a78bfa, #8b5cf6)" } : {}}
      >
        <Icon className={`h-5 w-5 ${active ? "text-white" : "text-slate-500"}`} />
        {badge && badge > 0 ? (
          <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
            {badge > 9 ? "9+" : badge}
          </span>
        ) : null}
      </div>
      <span className={`text-[10px] font-medium ${active ? "text-purple-600" : "text-slate-400"}`}>
        {label}
      </span>
    </button>
  );
}

// Task item for shift tasks
function TaskItem({
  label,
  done,
  icon,
}: {
  label: string;
  done: boolean;
  icon?: any;
}) {
  const [checked, setChecked] = useState(done);
  return (
    <button
      onClick={() => setChecked(!checked)}
      className="flex items-center gap-3 w-full py-2 text-left group"
    >
      {checked ? (
        <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
      ) : (
        <Circle className="h-5 w-5 text-slate-300 shrink-0 group-hover:text-slate-400" />
      )}
      <span className={`text-sm font-medium ${checked ? "line-through text-slate-400" : "text-slate-700"}`}>
        {label}
      </span>
    </button>
  );
}

// Section Card component
function SectionCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`bg-white rounded-2xl shadow-sm border border-white/80 ${className}`}>
      {children}
    </div>
  );
}

type NavTab = "home" | "clients" | "roster" | "checkin" | "notes";

export default function WorkerHome() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<NavTab>("home");

  const handleNav = (tab: NavTab, path: string) => {
    setActiveTab(tab);
    navigate(path);
  };

  // Greeting name
  const { data: workerName } = useQuery({
    queryKey: ["worker-name", user?.id],
    enabled: !!user,
    queryFn: async () => {
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

  // Worker's staff profile
  const { data: staffProfile } = useQuery({
    queryKey: ["worker-staff-profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("staff_id")
        .eq("user_id", user!.id)
        .single();
      return profile?.staff_id || null;
    },
  });

  // Today's and upcoming shifts for this worker
  const { data: myShifts = [] } = useQuery({
    queryKey: ["worker-my-shifts", staffProfile],
    enabled: !!staffProfile,
    queryFn: async () => {
      const today = getPerthDate();
      const { data } = await supabase
        .from("timesheets")
        .select("*, client:client_id(first_name, last_name, preferred_name)")
        .eq("staff_id", staffProfile)
        .gte("shift_date", today)
        .order("shift_date")
        .order("start_time")
        .limit(5);
      return data ?? [];
    },
  });

  // My recent case notes
  const { data: myNotes = [] } = useQuery({
    queryKey: ["worker-my-notes", staffProfile],
    enabled: !!staffProfile,
    queryFn: async () => {
      const { data } = await supabase
        .from("case_notes")
        .select("*, client:client_id(first_name, last_name)")
        .eq("staff_id", staffProfile)
        .order("created_at", { ascending: false })
        .limit(3);
      return data ?? [];
    },
  });

  // My compliance items
  const { data: myCompliance = [] } = useQuery({
    queryKey: ["worker-compliance", staffProfile],
    enabled: !!staffProfile,
    queryFn: async () => {
      const { data } = await supabase
        .from("compliance_records")
        .select("*")
        .eq("staff_id", staffProfile)
        .in("status", ["expiring_soon", "expired"])
        .limit(3);
      return data ?? [];
    },
  });

  const nextShift = myShifts[0];
  const nextShiftClient = nextShift?.client
    ? `${nextShift.client.preferred_name || nextShift.client.first_name} ${nextShift.client.last_name}`
    : "No client assigned";

  const greeting = getPerthGreeting();

  return (
    <div className="min-h-screen flex flex-col worker-gradient">
      {/* Header */}
      <div className="pt-safe px-4 pt-4 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FlowerLogo size={32} />
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">Carter's Care</p>
          </div>
        </div>
        <button
          onClick={() => signOut()}
          className="h-8 w-8 rounded-full bg-white/70 backdrop-blur flex items-center justify-center text-slate-500 hover:text-red-500 transition-colors shadow-sm"
          title="Sign out"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>

      {/* Greeting Section */}
      <div className="px-4 pt-4 pb-2">
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <p className="text-slate-500 text-sm font-medium">{greeting},</p>
          <h1 className="text-2xl font-bold text-slate-800">{workerName ?? "..."}<span className="text-purple-500">!</span></h1>
        </motion.div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-4 pb-32 space-y-4 mt-2">

        {/* Next Shift Card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <SectionCard>
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-bold text-slate-700">Next Shift</h2>
                <button
                  onClick={() => navigate("/roster")}
                  className="text-xs text-purple-500 font-semibold flex items-center gap-0.5 hover:text-purple-700"
                >
                  View All <ChevronRight className="h-3 w-3" />
                </button>
              </div>

              {nextShift ? (
                <button
                  onClick={() => navigate("/roster")}
                  className="w-full flex items-center gap-3 rounded-xl p-3 hover:bg-slate-50 transition-colors text-left"
                  style={{ background: "linear-gradient(135deg, #f5f3ff, #ede9fe)" }}
                >
                  {/* Brand icon */}
                  <div
                    className="h-11 w-11 rounded-xl flex items-center justify-center shrink-0 shadow-md"
                    style={{ background: "linear-gradient(135deg, #a78bfa, #8b5cf6)" }}
                  >
                    <FlowerLogo size={22} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-800 truncate">{nextShiftClient}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {nextShift.start_time?.slice(0, 5) || "—"} – {nextShift.end_time?.slice(0, 5) || "—"}
                      {nextShift.shift_date !== getPerthDate() && (
                        <span className="ml-1 text-purple-500 font-medium">
                          · {new Date(nextShift.shift_date + "T00:00:00").toLocaleDateString("en-AU", { weekday: "short", day: "numeric", month: "short" })}
                        </span>
                      )}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-purple-400 shrink-0" />
                </button>
              ) : (
                <div className="rounded-xl p-4 text-center" style={{ background: "linear-gradient(135deg, #f5f3ff, #ede9fe)" }}>
                  <CalendarDays className="h-7 w-7 text-purple-300 mx-auto mb-1" />
                  <p className="text-sm text-slate-500">No upcoming shifts</p>
                  <p className="text-xs text-slate-400 mt-0.5">Check the roster for more details</p>
                </div>
              )}
            </div>
          </SectionCard>
        </motion.div>

        {/* Two-column quick actions */}
        <div className="grid grid-cols-2 gap-3">
          {/* Tasks / Check-In */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
          >
            <button
              onClick={() => navigate("/check-in")}
              className="w-full rounded-2xl p-4 flex flex-col items-start gap-2 transition-all hover:scale-[1.02] shadow-sm border border-white/80"
              style={{ background: "linear-gradient(135deg, #dcfce7, #bbf7d0)" }}
            >
              <div className="h-10 w-10 rounded-xl flex items-center justify-center shadow-sm" style={{ background: "linear-gradient(135deg, #4ade80, #22c55e)" }}>
                <MapPinCheck className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-emerald-800">Check In</p>
                <p className="text-[11px] text-emerald-600">Start your shift</p>
              </div>
            </button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <button
              onClick={() => navigate("/case-notes")}
              className="w-full rounded-2xl p-4 flex flex-col items-start gap-2 transition-all hover:scale-[1.02] shadow-sm border border-white/80"
              style={{ background: "linear-gradient(135deg, #dbeafe, #bfdbfe)" }}
            >
              <div className="h-10 w-10 rounded-xl flex items-center justify-center shadow-sm" style={{ background: "linear-gradient(135deg, #60a5fa, #3b82f6)" }}>
                <FileText className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-blue-800">Case Notes</p>
                <p className="text-[11px] text-blue-600">Write notes</p>
              </div>
            </button>
          </motion.div>
        </div>

        {/* Today's Tasks */}
        {nextShift && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
          >
            <SectionCard>
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-bold text-slate-700">Today's Tasks</h2>
                  <div
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
                    style={{ background: "linear-gradient(135deg, #a78bfa, #8b5cf6)" }}
                  >
                    Shift Tasks
                  </div>
                </div>
                <div className="space-y-1">
                  <TaskItem label="Medication Assistance" done={false} />
                  <TaskItem label="Help with Shopping" done={false} />
                  <TaskItem label="Complete Case Notes" done={false} />
                </div>
              </div>
            </SectionCard>
          </motion.div>
        )}

        {/* Recent Case Notes */}
        {myNotes.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.14 }}
          >
            <SectionCard>
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-bold text-slate-700">Recent Notes</h2>
                  <button
                    onClick={() => navigate("/case-notes")}
                    className="text-xs text-purple-500 font-semibold flex items-center gap-0.5 hover:text-purple-700"
                  >
                    All <ChevronRight className="h-3 w-3" />
                  </button>
                </div>
                <div className="space-y-2">
                  {myNotes.map((note: any) => (
                    <div key={note.id} className="flex items-start gap-3 py-1.5">
                      <div className="h-8 w-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: "linear-gradient(135deg, #dbeafe, #bfdbfe)" }}>
                        <FileText className="h-4 w-4 text-blue-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-700 truncate">
                          {note.client ? `${note.client.first_name} ${note.client.last_name}` : "General"}
                        </p>
                        <p className="text-[11px] text-slate-400 truncate">
                          {note.content?.slice(0, 60) || "No content"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </SectionCard>
          </motion.div>
        )}

        {/* Compliance Alerts */}
        {myCompliance.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.16 }}
          >
            <SectionCard className="border-orange-100">
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, #fb923c, #f97316)" }}>
                      <ShieldCheck className="h-3 w-3 text-white" />
                    </div>
                    <h2 className="text-sm font-bold text-slate-700">Compliance Alerts</h2>
                  </div>
                  <button
                    onClick={() => navigate("/my-compliance")}
                    className="text-xs text-orange-500 font-semibold flex items-center gap-0.5 hover:text-orange-700"
                  >
                    View <ChevronRight className="h-3 w-3" />
                  </button>
                </div>
                <div className="space-y-2">
                  {myCompliance.map((item: any) => (
                    <div key={item.id} className="flex items-center gap-3 py-1">
                      <div className={`h-2 w-2 rounded-full shrink-0 ${item.status === "expired" ? "bg-red-500" : "bg-orange-400"}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-700 truncate">{item.record_type || item.title}</p>
                        <p className="text-[11px] text-slate-400">{item.status === "expired" ? "Expired" : "Expiring soon"}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </SectionCard>
          </motion.div>
        )}

        {/* Upcoming Shifts List */}
        {myShifts.length > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18 }}
          >
            <SectionCard>
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-bold text-slate-700">Upcoming Shifts</h2>
                  <button
                    onClick={() => navigate("/roster")}
                    className="text-xs text-purple-500 font-semibold flex items-center gap-0.5 hover:text-purple-700"
                  >
                    Roster <ChevronRight className="h-3 w-3" />
                  </button>
                </div>
                <div className="space-y-2">
                  {myShifts.slice(1, 4).map((shift: any) => {
                    const clientName = shift.client
                      ? `${shift.client.preferred_name || shift.client.first_name} ${shift.client.last_name}`
                      : "No client";
                    return (
                      <div key={shift.id} className="flex items-center gap-3 py-1.5">
                        <div className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: "linear-gradient(135deg, #f5f3ff, #ede9fe)" }}>
                          <CalendarDays className="h-4 w-4 text-purple-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-slate-700 truncate">{clientName}</p>
                          <p className="text-[11px] text-slate-400">
                            {new Date(shift.shift_date + "T00:00:00").toLocaleDateString("en-AU", { weekday: "short", day: "numeric", month: "short" })}
                          </p>
                        </div>
                        <span className="text-xs font-semibold text-slate-600 shrink-0">
                          {shift.start_time?.slice(0, 5) || "—"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </SectionCard>
          </motion.div>
        )}
      </div>

      {/* Bottom Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-slate-100 shadow-xl pb-safe">
        <div className="flex items-center justify-around px-2 py-1.5">
          <BottomNavItem
            icon={Home}
            label="Home"
            active={activeTab === "home" && location.pathname === "/worker"}
            onClick={() => handleNav("home", "/worker")}
          />
          <BottomNavItem
            icon={UserCircle}
            label="Clients"
            active={activeTab === "clients" || location.pathname === "/clients"}
            onClick={() => handleNav("clients", "/clients")}
          />
          <BottomNavItem
            icon={CalendarDays}
            label="Roster"
            active={activeTab === "roster" || location.pathname === "/roster"}
            onClick={() => handleNav("roster", "/roster")}
          />
          <BottomNavItem
            icon={MapPinCheck}
            label="Check In"
            active={activeTab === "checkin" || location.pathname === "/check-in"}
            onClick={() => handleNav("checkin", "/check-in")}
          />
          <BottomNavItem
            icon={FileText}
            label="Notes"
            active={activeTab === "notes" || location.pathname === "/case-notes"}
            onClick={() => handleNav("notes", "/case-notes")}
          />
        </div>
      </div>
    </div>
  );
}
