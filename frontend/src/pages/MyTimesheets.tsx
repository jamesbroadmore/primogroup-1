import { useState, useMemo } from "react";
import { AppLayout } from "@/components/AppLayout";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  Clock, Calendar, DollarSign, FileText, Download,
  CheckCircle, AlertCircle, Send, Loader2, User,
} from "lucide-react";
import { format, startOfMonth, endOfMonth, subMonths, differenceInMinutes, parseISO } from "date-fns";
import { EmptyState } from "@/components/ui-kit";

export default function MyTimesheets() {
  const { user } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState<"current" | "previous">("current");

  // Get staff profile
  const { data: staffProfile } = useQuery({
    queryKey: ["my-staff-profile-ts", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data: profile } = await supabase
        .from("profiles")
        .select("staff_id")
        .eq("user_id", user.id)
        .single();
      return profile?.staff_id || null;
    },
    enabled: !!user,
  });

  // Calculate date ranges
  const currentMonth = new Date();
  const previousMonth = subMonths(currentMonth, 1);
  
  const dateRanges = {
    current: {
      start: startOfMonth(currentMonth),
      end: endOfMonth(currentMonth),
      label: format(currentMonth, "MMMM yyyy"),
    },
    previous: {
      start: startOfMonth(previousMonth),
      end: endOfMonth(previousMonth),
      label: format(previousMonth, "MMMM yyyy"),
    },
  };

  const activeRange = dateRanges[selectedPeriod];

  // Fetch real check-ins data
  const { data: checkIns = [], isLoading } = useQuery({
    queryKey: ["my-timesheets", staffProfile, selectedPeriod],
    queryFn: async () => {
      if (!staffProfile) return [];
      
      const { data, error } = await supabase
        .from("shift_checkins")
        .select("*")
        .eq("staff_id", staffProfile)
        .gte("check_in_time", activeRange.start.toISOString())
        .lte("check_in_time", activeRange.end.toISOString())
        .order("check_in_time", { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!staffProfile,
  });

  // Calculate statistics from real data
  const stats = useMemo(() => {
    let totalMinutes = 0;
    let completedShifts = 0;
    let pendingShifts = 0;

    checkIns.forEach((checkin: any) => {
      if (checkin.check_out_time) {
        const minutes = differenceInMinutes(
          parseISO(checkin.check_out_time),
          parseISO(checkin.check_in_time)
        );
        totalMinutes += minutes;
        completedShifts++;
      } else {
        pendingShifts++;
      }
    });

    const totalHours = Math.round(totalMinutes / 60 * 10) / 10;
    const approvedHours = totalHours; // In a real system, this would check approval status
    
    return {
      totalHours,
      approvedHours,
      pendingHours: 0, // Would need approval status field
      completedShifts,
      pendingShifts,
      totalShifts: checkIns.length,
    };
  }, [checkIns]);

  // Format timesheet entries
  const entries = useMemo(() => {
    return checkIns.map((checkin: any) => {
      const checkInTime = parseISO(checkin.check_in_time);
      const checkOutTime = checkin.check_out_time ? parseISO(checkin.check_out_time) : null;
      
      let hours = 0;
      if (checkOutTime) {
        hours = Math.round(differenceInMinutes(checkOutTime, checkInTime) / 60 * 10) / 10;
      }

      return {
        id: checkin.id,
        date: format(checkInTime, "yyyy-MM-dd"),
        client: checkin.client_name || "N/A",
        checkIn: format(checkInTime, "HH:mm"),
        checkOut: checkOutTime ? format(checkOutTime, "HH:mm") : "Active",
        hours,
        status: checkin.status === "checked_out" ? "completed" : "in_progress",
        notes: checkin.notes,
      };
    });
  }, [checkIns]);

  return (
    <AppLayout title="My Timesheets">
      <div className="space-y-5">
        {/* Period Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl bg-white border border-border/50 shadow-sm p-4 flex items-center gap-3"
          >
            <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm icon-purple">
              <Clock className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-xl font-bold text-foreground">{stats.totalHours}h</p>
              <p className="text-xs text-muted-foreground">Total Hours</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="rounded-2xl bg-white border border-border/50 shadow-sm p-4 flex items-center gap-3"
          >
            <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm icon-green">
              <CheckCircle className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-xl font-bold text-foreground">{stats.completedShifts}</p>
              <p className="text-xs text-muted-foreground">Completed</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl bg-white border border-border/50 shadow-sm p-4 flex items-center gap-3"
          >
            <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm icon-orange">
              <AlertCircle className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-xl font-bold text-foreground">{stats.pendingShifts}</p>
              <p className="text-xs text-muted-foreground">In Progress</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="rounded-2xl bg-white border border-border/50 shadow-sm p-4 flex items-center gap-3"
          >
            <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm icon-blue">
              <Calendar className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-xl font-bold text-foreground">{stats.totalShifts}</p>
              <p className="text-xs text-muted-foreground">Total Shifts</p>
            </div>
          </motion.div>
        </div>

        {/* Period Selector */}
        <div className="flex gap-2">
          <button
            onClick={() => setSelectedPeriod("current")}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
              selectedPeriod === "current"
                ? "bg-purple-100 text-purple-700"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {dateRanges.current.label}
          </button>
          <button
            onClick={() => setSelectedPeriod("previous")}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
              selectedPeriod === "previous"
                ? "bg-purple-100 text-purple-700"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {dateRanges.previous.label}
          </button>
        </div>

        {/* Timesheet Details */}
        <div className="bg-white rounded-2xl border border-border/50 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-border/50">
            <div>
              <h3 className="font-semibold text-foreground">{activeRange.label} Timesheet</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Auto-generated from your check-ins
              </p>
            </div>
            <div className="flex gap-2">
              <button className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-purple-100 text-purple-600 hover:bg-purple-200 transition-colors flex items-center gap-1">
                <Send className="h-3 w-3" /> Submit for Approval
              </button>
              <button className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors flex items-center gap-1">
                <Download className="h-3 w-3" /> Export
              </button>
            </div>
          </div>

          {/* Entries Table */}
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : entries.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-100/80 border-b">
                    <th className="text-left text-xs font-bold text-slate-700 uppercase tracking-wider px-4 py-3">Date</th>
                    <th className="text-left text-xs font-bold text-slate-700 uppercase tracking-wider px-4 py-3">Client</th>
                    <th className="text-left text-xs font-bold text-slate-700 uppercase tracking-wider px-4 py-3">Check In</th>
                    <th className="text-left text-xs font-bold text-slate-700 uppercase tracking-wider px-4 py-3">Check Out</th>
                    <th className="text-left text-xs font-bold text-slate-700 uppercase tracking-wider px-4 py-3">Hours</th>
                    <th className="text-left text-xs font-bold text-slate-700 uppercase tracking-wider px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {entries.map((entry: any) => (
                    <tr key={entry.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 text-sm text-foreground">
                        {format(new Date(entry.date), "EEE, d MMM")}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 rounded-full bg-purple-100 flex items-center justify-center">
                            <User className="h-3.5 w-3.5 text-purple-600" />
                          </div>
                          <span className="text-sm text-foreground">{entry.client}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-foreground">{entry.checkIn}</td>
                      <td className="px-4 py-3 text-sm font-medium text-foreground">
                        {entry.checkOut === "Active" ? (
                          <span className="text-orange-600">{entry.checkOut}</span>
                        ) : (
                          entry.checkOut
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm font-bold text-foreground">
                        {entry.hours > 0 ? `${entry.hours}h` : "-"}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          entry.status === "completed"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-orange-100 text-orange-700"
                        }`}>
                          {entry.status === "completed" ? "Completed" : "In Progress"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-50 border-t border-border">
                    <td colSpan={4} className="px-4 py-3 text-sm font-semibold text-foreground text-right">
                      Total Hours:
                    </td>
                    <td className="px-4 py-3 text-sm font-bold text-purple-600">{stats.totalHours}h</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          ) : (
            <div className="p-8">
              <EmptyState
                icon={<FileText className="h-10 w-10 text-slate-300" />}
                title="No timesheet entries"
                description="Your timesheet entries will appear here once you start checking in for shifts."
              />
            </div>
          )}
        </div>

        {/* Info Box */}
        <div className="bg-purple-50 rounded-2xl border border-purple-200 p-4">
          <div className="flex items-start gap-3">
            <div className="h-8 w-8 rounded-lg bg-purple-100 flex items-center justify-center shrink-0">
              <FileText className="h-4 w-4 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-purple-800">Auto-generated from Check-ins</p>
              <p className="text-xs text-purple-600 mt-0.5">
                Your timesheet is automatically populated from your shift check-ins. 
                Hours are calculated from check-in to check-out times. Submit for approval when ready.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
