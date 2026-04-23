import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  CalendarDays, Clock, MapPin, User, ChevronLeft, ChevronRight,
  CheckCircle, AlertCircle, Play,
} from "lucide-react";
import { format, startOfWeek, addDays, isSameDay, isToday } from "date-fns";

export default function MyRoster() {
  const { user } = useAuth();
  const [currentWeek, setCurrentWeek] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeek, i));

  const { data: shifts = [], isLoading } = useQuery({
    queryKey: ["my-roster", user?.id, format(currentWeek, "yyyy-MM-dd")],
    queryFn: async () => {
      // Mock shift data for demo
      return [
        {
          id: "1",
          date: format(addDays(currentWeek, 0), "yyyy-MM-dd"),
          start_time: "08:00",
          end_time: "14:00",
          client_name: "Margaret Johnson",
          location: "123 Care Street, Sydney",
          status: "completed",
        },
        {
          id: "2",
          date: format(addDays(currentWeek, 1), "yyyy-MM-dd"),
          start_time: "09:00",
          end_time: "15:00",
          client_name: "Robert Williams",
          location: "456 Support Ave, Sydney",
          status: "upcoming",
        },
        {
          id: "3",
          date: format(addDays(currentWeek, 2), "yyyy-MM-dd"),
          start_time: "07:00",
          end_time: "13:00",
          client_name: "Patricia Brown",
          location: "789 Health Rd, Sydney",
          status: "upcoming",
        },
        {
          id: "4",
          date: format(addDays(currentWeek, 3), "yyyy-MM-dd"),
          start_time: "10:00",
          end_time: "16:00",
          client_name: "James Davis",
          location: "321 Wellness Lane, Sydney",
          status: "upcoming",
        },
      ];
    },
  });

  const getShiftsForDay = (date: Date) => {
    return shifts.filter((s: any) => s.date === format(date, "yyyy-MM-dd"));
  };

  const totalHours = shifts.reduce((acc: number, s: any) => {
    const start = parseInt(s.start_time.split(":")[0]);
    const end = parseInt(s.end_time.split(":")[0]);
    return acc + (end - start);
  }, 0);

  return (
    <AppLayout title="My Roster">
      <div className="space-y-5">
        {/* Week Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl bg-white border border-border/50 shadow-sm p-4 flex items-center gap-3"
          >
            <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm icon-blue">
              <CalendarDays className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-xl font-bold text-foreground">{shifts.length}</p>
              <p className="text-xs text-muted-foreground">Shifts This Week</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="rounded-2xl bg-white border border-border/50 shadow-sm p-4 flex items-center gap-3"
          >
            <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm icon-purple">
              <Clock className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-xl font-bold text-foreground">{totalHours}h</p>
              <p className="text-xs text-muted-foreground">Total Hours</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl bg-white border border-border/50 shadow-sm p-4 flex items-center gap-3"
          >
            <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm icon-green">
              <CheckCircle className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-xl font-bold text-foreground">{shifts.filter((s: any) => s.status === "completed").length}</p>
              <p className="text-xs text-muted-foreground">Completed</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="rounded-2xl bg-white border border-border/50 shadow-sm p-4 flex items-center gap-3"
          >
            <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm icon-orange">
              <AlertCircle className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-xl font-bold text-foreground">{shifts.filter((s: any) => s.status === "upcoming").length}</p>
              <p className="text-xs text-muted-foreground">Upcoming</p>
            </div>
          </motion.div>
        </div>

        {/* Week Navigation */}
        <div className="bg-white rounded-2xl border border-border/50 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-border/50">
            <button
              onClick={() => setCurrentWeek(addDays(currentWeek, -7))}
              className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-slate-100 transition-colors"
            >
              <ChevronLeft className="h-5 w-5 text-slate-600" />
            </button>
            <h3 className="font-semibold text-foreground">
              {format(currentWeek, "d MMM")} - {format(addDays(currentWeek, 6), "d MMM yyyy")}
            </h3>
            <button
              onClick={() => setCurrentWeek(addDays(currentWeek, 7))}
              className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-slate-100 transition-colors"
            >
              <ChevronRight className="h-5 w-5 text-slate-600" />
            </button>
          </div>

          {/* Week Grid */}
          <div className="grid grid-cols-7 border-b border-border/50">
            {weekDays.map((day) => (
              <div
                key={day.toISOString()}
                className={`p-3 text-center border-r border-border/50 last:border-r-0 ${
                  isToday(day) ? "bg-purple-50" : ""
                }`}
              >
                <p className="text-xs text-muted-foreground">{format(day, "EEE")}</p>
                <p className={`text-lg font-bold ${isToday(day) ? "text-purple-600" : "text-foreground"}`}>
                  {format(day, "d")}
                </p>
              </div>
            ))}
          </div>

          {/* Shifts */}
          <div className="divide-y divide-border/50">
            {weekDays.map((day) => {
              const dayShifts = getShiftsForDay(day);
              if (dayShifts.length === 0) return null;

              return (
                <div key={day.toISOString()} className="p-4">
                  <p className="text-xs font-semibold text-muted-foreground mb-3">
                    {format(day, "EEEE, d MMMM")}
                    {isToday(day) && <span className="ml-2 text-purple-600">(Today)</span>}
                  </p>
                  <div className="space-y-3">
                    {dayShifts.map((shift: any) => (
                      <div
                        key={shift.id}
                        className={`rounded-xl border p-4 ${
                          shift.status === "completed"
                            ? "bg-emerald-50 border-emerald-200"
                            : "bg-white border-border/50"
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <div
                              className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
                                shift.status === "completed" ? "bg-emerald-100" : "icon-blue"
                              }`}
                            >
                              {shift.status === "completed" ? (
                                <CheckCircle className="h-5 w-5 text-emerald-600" />
                              ) : (
                                <User className="h-5 w-5 text-white" />
                              )}
                            </div>
                            <div>
                              <p className="font-semibold text-foreground">{shift.client_name}</p>
                              <div className="flex items-center gap-3 mt-1">
                                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Clock className="h-3 w-3" />
                                  {shift.start_time} - {shift.end_time}
                                </span>
                                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <MapPin className="h-3 w-3" />
                                  {shift.location}
                                </span>
                              </div>
                            </div>
                          </div>
                          {shift.status === "upcoming" && isToday(day) && (
                            <button className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-purple-100 text-purple-600 hover:bg-purple-200 transition-colors flex items-center gap-1">
                              <Play className="h-3 w-3" /> Start
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            {shifts.length === 0 && (
              <div className="p-8 text-center">
                <CalendarDays className="h-12 w-12 text-slate-200 mx-auto mb-3" />
                <p className="text-muted-foreground">No shifts scheduled this week</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
