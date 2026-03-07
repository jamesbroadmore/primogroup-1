import { AppLayout } from "@/components/AppLayout";
import { Plus, FileText } from "lucide-react";
import { motion } from "framer-motion";

const notes = [
  { staff: "Sarah Mitchell", client: "Maria Torres", date: "Mar 3, 2026", shift: "9:00 AM – 1:00 PM", summary: "Maria had a productive morning. Completed physiotherapy exercises and showed improved mobility. Mood was positive throughout." },
  { staff: "James Robertson", client: "Robert Kim", date: "Mar 3, 2026", shift: "10:00 AM – 2:00 PM", summary: "Robert attended community access program. Required minimal support with transport. Engaged well with peers." },
  { staff: "Emily Watson", client: "Helen Smith", date: "Mar 3, 2026", shift: "1:00 PM – 5:00 PM", summary: "Assisted Helen with meal preparation and household tasks. Discussed goals for the upcoming NDIS plan review." },
];

export default function CaseNotes() {
  return (
    <AppLayout title="Case Notes">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{notes.length} notes this week</p>
          <button className="h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium flex items-center gap-2 hover:opacity-90 transition-opacity">
            <Plus className="h-4 w-4" /> New Note
          </button>
        </div>

        <div className="space-y-3">
          {notes.map((n, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-xl bg-card p-5 shadow-card border border-border/50"
            >
              <div className="flex items-start gap-3">
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <FileText className="h-4 w-4 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-card-foreground">{n.client}</p>
                      <p className="text-xs text-muted-foreground">{n.staff} · {n.date} · {n.shift}</p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{n.summary}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
