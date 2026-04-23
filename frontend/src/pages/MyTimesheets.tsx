import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  Clock, Calendar, DollarSign, FileText, ChevronRight, Download,
  CheckCircle, AlertCircle, Send,
} from "lucide-react";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";

export default function MyTimesheets() {
  const { user } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState("current");

  // Mock timesheet data
  const timesheetData = {
    current: {
      period: format(new Date(), "MMMM yyyy"),
      status: "in_progress",
      totalHours: 87.5,
      approvedHours: 64,
      pendingHours: 23.5,
      shifts: 14,
      entries: [
        { date: "2025-04-21", client: "Margaret Johnson", hours: 6, status: "approved" },
        { date: "2025-04-20", client: "Robert Williams", hours: 5.5, status: "approved" },
        { date: "2025-04-19", client: "Patricia Brown", hours: 6, status: "pending" },
        { date: "2025-04-18", client: "James Davis", hours: 6, status: "pending" },
        { date: "2025-04-17", client: "Margaret Johnson", hours: 6, status: "approved" },
      ],
    },
    previous: {
      period: format(subMonths(new Date(), 1), "MMMM yyyy"),
      status: "approved",
      totalHours: 152,
      approvedHours: 152,
      pendingHours: 0,
      shifts: 24,
      entries: [],
    },
  };

  const currentData = selectedPeriod === "current" ? timesheetData.current : timesheetData.previous;

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
              <p className="text-xl font-bold text-foreground">{currentData.totalHours}h</p>
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
              <p className="text-xl font-bold text-foreground">{currentData.approvedHours}h</p>
              <p className="text-xs text-muted-foreground">Approved</p>
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
              <p className="text-xl font-bold text-foreground">{currentData.pendingHours}h</p>
              <p className="text-xs text-muted-foreground">Pending</p>
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
              <p className="text-xl font-bold text-foreground">{currentData.shifts}</p>
              <p className="text-xs text-muted-foreground">Shifts</p>
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
            {timesheetData.current.period}
          </button>
          <button
            onClick={() => setSelectedPeriod("previous")}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
              selectedPeriod === "previous"
                ? "bg-purple-100 text-purple-700"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {timesheetData.previous.period}
          </button>
        </div>

        {/* Timesheet Details */}
        <div className="bg-white rounded-2xl border border-border/50 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-border/50">
            <div>
              <h3 className="font-semibold text-foreground">{currentData.period} Timesheet</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Status: <span className={currentData.status === "approved" ? "text-emerald-600" : "text-orange-600"}>
                  {currentData.status === "approved" ? "Approved" : "In Progress"}
                </span>
              </p>
            </div>
            <div className="flex gap-2">
              {currentData.status === "in_progress" && (
                <button className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-purple-100 text-purple-600 hover:bg-purple-200 transition-colors flex items-center gap-1">
                  <Send className="h-3 w-3" /> Submit
                </button>
              )}
              <button className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors flex items-center gap-1">
                <Download className="h-3 w-3" /> Export
              </button>
            </div>
          </div>

          {/* Entries Table */}
          {currentData.entries.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Date</th>
                    <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Client</th>
                    <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Hours</th>
                    <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {currentData.entries.map((entry, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 text-sm text-foreground">
                        {format(new Date(entry.date), "EEE, d MMM")}
                      </td>
                      <td className="px-4 py-3 text-sm text-foreground">{entry.client}</td>
                      <td className="px-4 py-3 text-sm font-medium text-foreground">{entry.hours}h</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          entry.status === "approved"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-orange-100 text-orange-700"
                        }`}>
                          {entry.status === "approved" ? "Approved" : "Pending"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center">
              <FileText className="h-12 w-12 text-slate-200 mx-auto mb-3" />
              <p className="text-muted-foreground">No entries to display</p>
            </div>
          )}
        </div>

        {/* Auto-generated Note */}
        <div className="bg-purple-50 rounded-2xl border border-purple-200 p-4">
          <div className="flex items-start gap-3">
            <div className="h-8 w-8 rounded-lg bg-purple-100 flex items-center justify-center shrink-0">
              <FileText className="h-4 w-4 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-purple-800">Auto-generated from Check-ins</p>
              <p className="text-xs text-purple-600 mt-0.5">
                Your timesheet is automatically populated from your shift check-ins and case notes. 
                Review and submit for approval.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
