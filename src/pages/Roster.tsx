import { AppLayout } from "@/components/AppLayout";
import { Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";

const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const hours = Array.from({ length: 12 }, (_, i) => `${i + 7}:00`);

const shifts = [
  { day: 0, startHour: 9, duration: 4, staff: "Sarah M.", client: "Maria T.", color: "bg-primary/15 border-primary/30 text-primary" },
  { day: 1, startHour: 10, duration: 4, staff: "James R.", client: "Robert K.", color: "bg-info/15 border-info/30 text-info" },
  { day: 2, startHour: 13, duration: 4, staff: "Emily W.", client: "Helen S.", color: "bg-warning/15 border-warning/30 text-warning" },
  { day: 3, startHour: 8, duration: 6, staff: "David L.", client: "Frank P.", color: "bg-success/15 border-success/30 text-success" },
  { day: 4, startHour: 9, duration: 4, staff: "Priya S.", client: "Linda C.", color: "bg-primary/15 border-primary/30 text-primary" },
];

export default function Roster() {
  const [weekOffset] = useState(0);

  return (
    <AppLayout title="Roster">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button className="h-8 w-8 rounded-lg border bg-card flex items-center justify-center text-muted-foreground hover:bg-secondary transition-colors">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm font-medium text-foreground">This Week — March 3–9, 2026</span>
            <button className="h-8 w-8 rounded-lg border bg-card flex items-center justify-center text-muted-foreground hover:bg-secondary transition-colors">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <button className="h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium flex items-center gap-2 hover:opacity-90 transition-opacity">
            <Plus className="h-4 w-4" /> New Shift
          </button>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-xl bg-card shadow-card border border-border/50 overflow-hidden"
        >
          <div className="overflow-x-auto">
            <div className="min-w-[700px]">
              {/* Header */}
              <div className="grid grid-cols-8 border-b">
                <div className="px-3 py-2 text-xs text-muted-foreground font-medium">Time</div>
                {daysOfWeek.map((d) => (
                  <div key={d} className="px-3 py-2 text-xs text-muted-foreground font-medium text-center">{d}</div>
                ))}
              </div>
              {/* Grid */}
              <div className="relative">
                {hours.map((h, hi) => (
                  <div key={h} className="grid grid-cols-8 border-b last:border-0">
                    <div className="px-3 py-3 text-[10px] text-muted-foreground">{h}</div>
                    {daysOfWeek.map((_, di) => {
                      const shift = shifts.find((s) => s.day === di && s.startHour === hi + 7);
                      return (
                        <div key={di} className="px-1 py-1 relative min-h-[44px]">
                          {shift && (
                            <div className={`absolute inset-x-1 rounded-md border px-2 py-1.5 text-[10px] leading-tight ${shift.color}`}
                              style={{ height: `${shift.duration * 44}px`, zIndex: 1 }}
                            >
                              <p className="font-semibold">{shift.staff}</p>
                              <p className="opacity-70">{shift.client}</p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AppLayout>
  );
}
