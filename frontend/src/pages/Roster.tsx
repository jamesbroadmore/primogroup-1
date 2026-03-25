import { AppLayout } from "@/components/AppLayout";
import { ChevronLeft, ChevronRight, Loader2, Plus } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfWeek, endOfWeek, addWeeks, addDays } from "date-fns";
import { NewRosterDialog } from "@/components/roster/NewRosterDialog";
import { EditShiftDialog } from "@/components/roster/EditShiftDialog";
import { useAuth } from "@/contexts/AuthContext";
import { extractPerthHour, formatPerthTime, getPerthDate } from "@/lib/perth-time";
import { shortName, fullName } from "@/lib/display-names";

const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const hours = Array.from({ length: 14 }, (_, i) => i + 6);

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
        .select("*, staff:staff_id(first_name, last_name, preferred_name), client:client_id(first_name, last_name, preferred_name)")
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

  return (
    <AppLayout title="Roster">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={() => setWeekOffset((w) => w - 1)} className="h-8 w-8 rounded-lg border bg-card flex items-center justify-center text-muted-foreground hover:bg-secondary transition-colors">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm font-medium text-foreground">
              {format(currentWeekStart, "MMM d")} – {format(currentWeekEnd, "MMM d, yyyy")}
            </span>
            <button onClick={() => setWeekOffset((w) => w + 1)} className="h-8 w-8 rounded-lg border bg-card flex items-center justify-center text-muted-foreground hover:bg-secondary transition-colors">
              <ChevronRight className="h-4 w-4" />
            </button>
            {weekOffset !== 0 && (
              <button onClick={() => setWeekOffset(0)} className="text-xs text-primary hover:underline font-medium ml-2">Today</button>
            )}
          </div>
          {isAdmin && (
            <button
              onClick={() => setRosterDialog({ date: getPerthDate(), hour: new Date().getHours() })}
              className="h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium flex items-center gap-2 hover:opacity-90 transition-opacity"
            >
              <Plus className="h-4 w-4" /> New Roster
            </button>
          )}
        </div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl bg-card shadow-card border border-border/50 overflow-hidden">
          {isLoading ? (
            <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : (
            <div className="overflow-x-auto">
              <div className="min-w-[700px]">
                <div className="grid grid-cols-8 border-b">
                  <div className="px-3 py-2 text-xs text-muted-foreground font-medium">Time</div>
                  {daysOfWeek.map((d, i) => (
                    <div key={d} className="px-3 py-2 text-center">
                      <span className="text-xs text-muted-foreground font-medium">{d}</span>
                      <span className="block text-[10px] text-muted-foreground/60">{format(weekDates[i], "d MMM")}</span>
                    </div>
                  ))}
                </div>
                <div className="relative">
                  {hours.map((h) => (
                    <div key={h} className="grid grid-cols-8 border-b last:border-0">
                      <div className="px-3 py-3 text-[10px] text-muted-foreground">{`${h}:00`}</div>
                      {daysOfWeek.map((_, di) => {
                        const key = `${di}-${h}`;
                        const shifts = shiftsByCell[key] || [];
                        return (
                          <div
                            key={di}
                            onClick={() => handleCellClick(di, h)}
                            className={`px-1 py-1 relative min-h-[48px] transition-colors border-l ${
                              isAdmin ? "cursor-pointer hover:bg-primary/5" : "cursor-default"
                            }`}
                          >
                            {shifts.map((s: any) => (
                              <div
                                key={s.id}
                                className="rounded-md bg-primary/10 border border-primary/20 px-1.5 py-1 mb-0.5 text-[10px] leading-tight cursor-pointer hover:bg-primary/20 transition-colors"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedShift(s);
                                }}
                              >
                                <p className="font-semibold text-primary truncate">
                                  {shortName(s.staff)}
                                </p>
                                {s.client && (
                                  <p className="text-muted-foreground truncate">
                                    → {shortName(s.client)}
                                  </p>
                                )}
                                <p className="text-muted-foreground/60">
                                  {formatPerthTime(s.start_time)}
                                </p>
                              </div>
                            ))}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
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
