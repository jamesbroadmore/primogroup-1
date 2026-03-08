import { Loader2, Plus, Trash2, X, Copy } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ShiftEntry {
  id: string;
  staffId: string;
  clientId: string;
  date: string;
  startHour: string;
  endHour: string;
  notes: string;
}

interface NewRosterDialogProps {
  open: boolean;
  onClose: () => void;
  defaultDate: string;
  defaultHour: number;
  staffList: { id: string; first_name: string; last_name: string }[];
  clientList: { id: string; first_name: string; last_name: string }[];
}

const createEntry = (date: string, hour: number): ShiftEntry => ({
  id: crypto.randomUUID(),
  staffId: "",
  clientId: "",
  date,
  startHour: `${String(hour).padStart(2, "0")}:00`,
  endHour: `${String(Math.min(hour + 2, 20)).padStart(2, "0")}:00`,
  notes: "",
});

export function NewRosterDialog({ open, onClose, defaultDate, defaultHour, staffList, clientList }: NewRosterDialogProps) {
  const queryClient = useQueryClient();
  const [entries, setEntries] = useState<ShiftEntry[]>([createEntry(defaultDate, defaultHour)]);

  const mutation = useMutation({
    mutationFn: async (shifts: ShiftEntry[]) => {
      const rows = shifts.map((s) => ({
        staff_id: s.staffId,
        client_id: s.clientId || null,
        shift_date: s.date,
        start_time: `${s.date}T${s.startHour}:00`,
        end_time: `${s.date}T${s.endHour}:00`,
        notes: s.notes || null,
        status: "pending",
      }));
      const { error } = await supabase.from("timesheets").insert(rows);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(`${entries.length} shift${entries.length > 1 ? "s" : ""} created!`);
      queryClient.invalidateQueries({ queryKey: ["roster-timesheets"] });
      onClose();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const updateEntry = (id: string, patch: Partial<ShiftEntry>) => {
    setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  };

  const removeEntry = (id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  };

  const duplicateEntry = (entry: ShiftEntry) => {
    setEntries((prev) => [...prev, { ...entry, id: crypto.randomUUID() }]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const missing = entries.some((s) => !s.staffId);
    if (missing) {
      toast.error("Every shift must have a staff member assigned");
      return;
    }
    mutation.mutate(entries);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg max-h-[85vh] flex flex-col rounded-xl bg-card shadow-xl border border-border"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b shrink-0">
          <h2 className="text-lg font-semibold text-card-foreground">
            New Roster {entries.length > 1 && <span className="text-muted-foreground text-sm font-normal">({entries.length} shifts)</span>}
          </h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="overflow-y-auto flex-1 p-5 space-y-4">
            {entries.map((entry, idx) => (
              <div key={entry.id} className="rounded-lg border border-border bg-background p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Shift {idx + 1}</span>
                  <div className="flex items-center gap-1">
                    <button type="button" onClick={() => duplicateEntry(entry)} className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground hover:bg-secondary transition-colors" title="Duplicate">
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                    {entries.length > 1 && (
                      <button type="button" onClick={() => removeEntry(entry.id)} className="h-7 w-7 rounded-md flex items-center justify-center text-destructive hover:bg-destructive/10 transition-colors" title="Remove">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[10px] font-medium text-muted-foreground mb-1 block">Date</label>
                    <input type="date" value={entry.date} onChange={(e) => updateEntry(entry.id, { date: e.target.value })}
                      className="w-full h-8 rounded-md border bg-background px-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
                  </div>
                  <div>
                    <label className="text-[10px] font-medium text-muted-foreground mb-1 block">Start</label>
                    <input type="time" value={entry.startHour} onChange={(e) => updateEntry(entry.id, { startHour: e.target.value })}
                      className="w-full h-8 rounded-md border bg-background px-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
                  </div>
                  <div>
                    <label className="text-[10px] font-medium text-muted-foreground mb-1 block">End</label>
                    <input type="time" value={entry.endHour} onChange={(e) => updateEntry(entry.id, { endHour: e.target.value })}
                      className="w-full h-8 rounded-md border bg-background px-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-medium text-muted-foreground mb-1 block">Staff *</label>
                    <select value={entry.staffId} onChange={(e) => updateEntry(entry.id, { staffId: e.target.value })}
                      className="w-full h-8 rounded-md border bg-background px-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
                      <option value="">Select staff...</option>
                      {staffList.map((s) => <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-medium text-muted-foreground mb-1 block">Client</label>
                    <select value={entry.clientId} onChange={(e) => updateEntry(entry.id, { clientId: e.target.value })}
                      className="w-full h-8 rounded-md border bg-background px-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
                      <option value="">Optional...</option>
                      {clientList.map((c) => <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-medium text-muted-foreground mb-1 block">Notes</label>
                  <input type="text" value={entry.notes} onChange={(e) => updateEntry(entry.id, { notes: e.target.value })}
                    placeholder="Optional shift notes..."
                    className="w-full h-8 rounded-md border bg-background px-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={() => setEntries((prev) => [...prev, createEntry(defaultDate, defaultHour)])}
              className="w-full h-9 rounded-lg border border-dashed border-border text-sm font-medium text-muted-foreground flex items-center justify-center gap-2 hover:bg-secondary hover:text-foreground transition-colors"
            >
              <Plus className="h-4 w-4" /> Add Another Shift
            </button>
          </div>

          <div className="flex justify-end gap-2 p-5 border-t shrink-0">
            <button type="button" onClick={onClose} className="h-9 px-4 rounded-lg border text-sm font-medium text-foreground hover:bg-secondary transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={mutation.isPending} className="h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium flex items-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50">
              {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Create {entries.length > 1 ? `${entries.length} Shifts` : "Shift"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
