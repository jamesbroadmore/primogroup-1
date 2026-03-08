import { AppLayout } from "@/components/AppLayout";
import { Plus, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfWeek, endOfWeek, addWeeks } from "date-fns";

const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const hours = Array.from({ length: 12 }, (_, i) => `${i + 7}:00`);

export default function Roster() {
  const [weekOffset, setWeekOffset] = useState(0);
  const currentWeekStart = startOfWeek(addWeeks(new Date(), weekOffset), { weekStartsOn: 1 });
  const currentWeekEnd = endOfWeek(addWeeks(new Date(), weekOffset), { weekStartsOn: 1 });

  const { data: checkins = [], isLoading } = useQuery({
    queryKey: ["roster-checkins", weekOffset],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shift_checkins")
        .select("*")
        .gte("shift_date", format(currentWeekStart, "yyyy-MM-dd"))
        .lte("shift_date", format(currentWeekEnd, "yyyy-MM-dd"))
        .order("check_in_time");
      if (error) throw error;
      return data;
    },
  });

  return (
    <AppLayout title="Roster">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={() => setWeekOffset(w => w - 1)} className="h-8 w-8 rounded-lg border bg-card flex items-center justify-center text-muted-foreground hover:bg-secondary transition-colors">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm font-medium text-foreground">
              {format(currentWeekStart, "MMM d")} – {format(currentWeekEnd, "MMM d, yyyy")}
            </span>
            <button onClick={() => setWeekOffset(w => w + 1)} className="h-8 w-8 rounded-lg border bg-card flex items-center justify-center text-muted-foreground hover:bg-secondary transition-colors">
              <ChevronRight className="h-4 w-4" />
            </button>
            {weekOffset !== 0 && (
              <button onClick={() => setWeekOffset(0)} className="text-xs text-primary hover:underline font-medium ml-2">Today</button>
            )}
          </div>
          <button className="h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium flex items-center gap-2 hover:opacity-90 transition-opacity">
            <Plus className="h-4 w-4" /> New Shift
          </button>
        </div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl bg-card shadow-card border border-border/50 overflow-hidden">
          {isLoading ? (
            <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : (
            <div className="overflow-x-auto">
              <div className="min-w-[700px]">
                <div className="grid grid-cols-8 border-b">
                  <div className="px-3 py-2 text-xs text-muted-foreground font-medium">Time</div>
                  {daysOfWeek.map((d) => (
                    <div key={d} className="px-3 py-2 text-xs text-muted-foreground font-medium text-center">{d}</div>
                  ))}
                </div>
                <div className="relative">
                  {hours.map((h) => (
                    <div key={h} className="grid grid-cols-8 border-b last:border-0">
                      <div className="px-3 py-3 text-[10px] text-muted-foreground">{h}</div>
                      {daysOfWeek.map((_, di) => (
                        <div key={di} className="px-1 py-1 relative min-h-[44px]" />
                      ))}
                    </div>
                  ))}
                </div>
                {checkins.length === 0 && (
                  <div className="py-8 text-center text-sm text-muted-foreground">
                    No shifts scheduled this week
                  </div>
                )}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AppLayout>
  );
}
