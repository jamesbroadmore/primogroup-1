import { AppLayout } from "@/components/AppLayout";
import { ChevronLeft, ChevronRight, Loader2, Plus, CalendarDays } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfWeek, endOfWeek, addWeeks, addDays } from "date-fns";
import { NewRosterDialog } from "@/components/roster/NewRosterDialog";
import { EditShiftDialog } from "@/components/roster/EditShiftDialog";
import { useAuth } from "@/contexts/AuthContext";
import { extractPerthHour, formatPerthTime, getPerthDate } from "@/lib/perth-time";
import { shortName } from "@/lib/display-names";

const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const hours = Array.from({ length: 14 }, (_, i) => i + 6);

const SHIFT_COLORS = [
  { bg: "bg-purple-50 border-purple-200 hover:bg-purple-100", text: "text-purple-700", dot: "bg-purple-400" },
  { bg: "bg-blue-50 border-blue-200 hover:bg-blue-100", text: "text-blue-700", dot: "bg-blue-400" },
  { bg: "bg-teal-50 border-teal-200 hover:bg-teal-100", text: "text-teal-700", dot: "bg-teal-400" },
  { bg: "bg-emerald-50 border-emerald-200 hover:bg-emerald-100", text: "text-emerald-700", dot: "bg-emerald-400" },
  { bg: "bg-orange-50 border-orange-200 hover:bg-orange-100", text: "text-orange-700", dot: "bg-orange-400" },
  { bg: "bg-pink-50 border-pink-200 hover:bg-pink-100", text: "text-pink-700", dot: "bg-pink-400" },
];

function getShiftColor(staffId: string, staffList: any[]) {
  const idx = staffList.findIndex((s: any) => s.id === staffId);
  return SHIFT_COLORS[Math.max(idx, 0) % SHIFT_COLORS.length];
}

export default function Roster() {
  const { isAdmin } = useAuth();
  const [weekOffset, setWeekOffset] = useState(0);
  const [rosterDialog, setRosterDialog] = useState<{ date: string; hour: number } | null>(null);
  const [selectedShift, setSelectedShift] = useState<any>(null);

  const currentWeekStart = startOfWeek(addWeeks(new Date(), weekOffset), { weekStartsOn: 1 });
  const currentWeekEnd = endOfWeek(addWeeks(new Date(), weekOffset), { weekStartsOn: 1 });

  const weekDates = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i)),
    [currentWeekStart]
  );

  const { data: timesheets = [], isLoading } = useQuery({
    queryKey: ["roster-timesheets", weekOffset],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("timesheets")
        .select("*, staff:staff_id(id, first_name, last_name, preferred_name), client:client_id(first_name, last_name, preferred_name)")
        .gte("shift_date", format(currentWeekStart, "yyyy-MM-dd"))
        .lte("shift_date", format(currentWeekEnd, "yyyy-MM-dd"))
        .order("start_time");
      if (error) throw error;
      return data;
    },
  });

  const { data: staffList = [] } = useQuery({
    queryKey: ["staff-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("staff")
        .select("id, first_name, last_name, preferred_name")
        .eq("status", "active")
        .order("first_name");
      if (error) throw error;
      return data;
    },
  });

  const { data: clientList = [] } = useQuery({
    queryKey: ["client-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("id, first_name, last_name, preferred_name")
        .eq("status", "active")
        .order("first_name");
      if (error) throw error;
      return data;
    },
  });

  const handleCellClick = (dayIndex: number, hour: number) => {
    if (!isAdmin) return;
    const date = format(weekDates[dayIndex], "yyyy-MM-dd");
    setRosterDialog({ date, hour });
  };

  const shiftsByCell = useMemo(() => {
    const map: Record<string, typeof timesheets> = {};
    timesheets.forEach((t) => {
      const dayIdx = weekDates.findIndex(
        (d) => format(d, "yyyy-MM-dd") === t.shift_date
      );
      if (dayIdx < 0) return;
      const startHour = t.start_time ? extractPerthHour(t.start_time) : null;
      if (startHour === null) return;
      const key = `${dayIdx}-${startHour}`;
      if (!map[key]) map[key] = [];
      map[key].push(t);
    });
    return map;
  }, [timesheets, weekDates]);

  const today = getPerthDate();

  return (
    <AppLayout title="Roster">
      <div className="space-y-4">
        {/* Week navigator */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setWeekOffset((w) => w - 1)}
              className="h-9 w-9 rounded-xl border bg-white flex items-center justify-center text-muted-foreground hover:bg-secondary transition-colors shadow-sm"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="bg-white border border-border rounded-xl px-4 py-2 shadow-sm">
              <span className="text-sm font-semibold text-foreground">
                {format(currentWeekStart, "MMM d")} – {format(currentWeekEnd, "MMM d, yyyy")}
              </span>
            </div>
            <button
              onClick={() => setWeekOffset((w) => w + 1)}
              className="h-9 w-9 rounded-xl border bg-white flex items-center justify-center text-muted-foreground hover:bg-secondary transition-colors shadow-sm"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            {weekOffset !== 0 && (
              <button
                onClick={() => setWeekOffset(0)}
                className="h-9 px-3 rounded-xl text-xs font-semibold text-purple-600 bg-purple-50 border border-purple-200 hover:bg-purple-100 transition-colors"
              >
                Today
              </button>
            )}
          </div>
          {isAdmin && (
            <button
              onClick={() => setRosterDialog({ date: getPerthDate(), hour: new Date().getHours() })}
              className="h-9 px-4 rounded-xl text-sm font-semibold text-white flex items-center gap-2 shadow-md transition-all hover:opacity-90"
              style={{ background: "linear-gradient(135deg, #fb923c, #f97316)" }}
            >
              <Plus className="h-4 w-4" /> New Shift
            </button>
          )}
        </div>

        {/* Roster Grid */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-2xl bg-white border border-border/50 shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : (
            <div className="overflow-x-auto">
              <div className="min-w-[720px]">
                {/* Header row */}
                <div className="grid grid-cols-8 border-b bg-slate-50/80">
                  <div className="px-3 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Time</div>
                  {daysOfWeek.map((d, i) => {
                    const dateStr = format(weekDates[i], "yyyy-MM-dd");
                    const isToday = dateStr === today;
                    return (
                      <div key={d} className={`px-2 py-3 text-center ${isToday ? "bg-purple-50" : ""}`}>
                        <span className={`text-xs font-bold uppercase ${isToday ? "text-purple-600" : "text-slate-500"}`}>{d}</span>
                        <div className={`mt-0.5 mx-auto w-7 h-7 rounded-xl flex items-center justify-center text-[11px] font-bold ${
                          isToday ? "text-white" : "text-slate-400"
                        }`}
                          style={isToday ? { background: "linear-gradient(135deg, #a78bfa, #8b5cf6)" } : {}}
                        >
                          {format(weekDates[i], "d")}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Time rows */}
                {hours.map((h) => (
                  <div key={h} className="grid grid-cols-8 border-b last:border-0 group">
                    <div className="px-3 py-3 text-[11px] text-slate-400 font-medium">{`${h}:00`}</div>
                    {daysOfWeek.map((_, di) => {
                      const key = `${di}-${h}`;
                      const shifts = shiftsByCell[key] || [];
                      const dateStr = format(weekDates[di], "yyyy-MM-dd");
                      const isToday = dateStr === today;
                      return (
                        <div
                          key={di}
                          onClick={() => handleCellClick(di, h)}
                          className={`px-1 py-1 relative min-h-[48px] border-l transition-all ${
                            isToday ? "bg-purple-50/30" : ""
                          } ${
                            isAdmin ? "cursor-pointer hover:bg-purple-50/50" : "cursor-default"
                          }`}
                        >
                          {shifts.map((s: any) => {
                            const color = getShiftColor(s.staff_id, staffList);
                            return (
                              <div
                                key={s.id}
                                className={`rounded-xl border px-2 py-1.5 mb-1 text-[10px] leading-tight cursor-pointer transition-all ${color.bg}`}
                                onClick={(e) => { e.stopPropagation(); setSelectedShift(s); }}
                              >
                                <div className="flex items-center gap-1 mb-0.5">
                                  <div className={`w-1.5 h-1.5 rounded-full ${color.dot}`} />
                                  <p className={`font-bold truncate ${color.text}`}>{shortName(s.staff)}</p>
                                </div>
                                {s.client && (
                                  <p className="text-slate-500 truncate">→ {shortName(s.client)}</p>
                                )}
                                <p className="text-slate-400">{formatPerthTime(s.start_time)}</p>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>

        <p className="text-[10px] text-muted-foreground text-center">All times shown in Perth AWST (UTC+8)</p>
      </div>

      {isAdmin && (
        <NewRosterDialog
          open={!!rosterDialog}
          onClose={() => setRosterDialog(null)}
          defaultDate={rosterDialog?.date ?? getPerthDate()}
          defaultHour={rosterDialog?.hour ?? 8}
          staffList={staffList}
          clientList={clientList}
        />
      )}
      {selectedShift && (
        <EditShiftDialog
          shift={selectedShift}
          onClose={() => setSelectedShift(null)}
          staffList={staffList}
          clientList={clientList}
        />
      )}
    </AppLayout>
  );
}
