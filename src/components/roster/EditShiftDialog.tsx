import { Loader2, Save, Trash2, X } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { extractPerthTime, perthToISO, formatPerthTime } from "@/lib/perth-time";

interface ShiftData {
  id: string;
  shift_date: string;
  start_time: string;
  end_time: string | null;
  notes: string | null;
  status: string;
  staff_id: string;
  client_id: string | null;
  staff?: { first_name: string; last_name: string } | null;
  client?: { first_name: string; last_name: string } | null;
}

interface EditShiftDialogProps {
  shift: ShiftData;
  onClose: () => void;
  staffList: { id: string; first_name: string; last_name: string }[];
  clientList: { id: string; first_name: string; last_name: string }[];
}

export function EditShiftDialog({ shift, onClose, staffList, clientList }: EditShiftDialogProps) {
  const queryClient = useQueryClient();
  const { isAdmin } = useAuth();

  const [form, setForm] = useState({
    staffId: shift.staff_id,
    clientId: shift.client_id || "",
    date: shift.shift_date,
    startTime: extractPerthTime(shift.start_time),
    endTime: extractPerthTime(shift.end_time),
    notes: shift.notes || "",
    status: shift.status,
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("timesheets")
        .update({
          staff_id: form.staffId,
          client_id: form.clientId || null,
          shift_date: form.date,
          start_time: perthToISO(form.date, form.startTime),
          end_time: form.endTime ? perthToISO(form.date, form.endTime) : null,
          notes: form.notes || null,
          status: form.status,
        })
        .eq("id", shift.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Shift updated");
      queryClient.invalidateQueries({ queryKey: ["roster-timesheets"] });
      queryClient.invalidateQueries({ queryKey: ["timesheets"] });
      onClose();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("timesheets").delete().eq("id", shift.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Shift deleted");
      queryClient.invalidateQueries({ queryKey: ["roster-timesheets"] });
      queryClient.invalidateQueries({ queryKey: ["timesheets"] });
      onClose();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.staffId) {
      toast.error("Staff member is required");
      return;
    }
    updateMutation.mutate();
  };

  const isPending = updateMutation.isPending || deleteMutation.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md rounded-xl bg-card shadow-xl border border-border"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b">
          <div>
            <h2 className="text-lg font-semibold text-card-foreground">Shift Details</h2>
            <p className="text-[10px] text-muted-foreground mt-0.5">Times shown in Perth AWST (UTC+8)</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Status badge */}
          <div className="flex items-center gap-2">
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
              form.status === "approved" ? "bg-success/10 text-success" :
              form.status === "pending" ? "bg-warning/10 text-warning" :
              "bg-muted text-muted-foreground"
            }`}>
              {form.status.charAt(0).toUpperCase() + form.status.slice(1)}
            </span>
            {isAdmin && form.status === "pending" && (
              <button
                type="button"
                onClick={() => setForm({ ...form, status: "approved" })}
                className="text-[10px] text-success hover:underline font-medium"
              >
                Approve
              </button>
            )}
          </div>

          {/* Date */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Date</label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              disabled={!isAdmin}
              className="w-full h-9 rounded-lg border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60"
            />
          </div>

          {/* Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Start Time</label>
              <input
                type="time"
                value={form.startTime}
                onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                disabled={!isAdmin}
                className="w-full h-9 rounded-lg border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">End Time</label>
              <input
                type="time"
                value={form.endTime}
                onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                disabled={!isAdmin}
                className="w-full h-9 rounded-lg border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60"
              />
            </div>
          </div>

          {/* Staff */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Staff Member *</label>
            <select
              value={form.staffId}
              onChange={(e) => setForm({ ...form, staffId: e.target.value })}
              disabled={!isAdmin}
              className="w-full h-9 rounded-lg border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60"
            >
              <option value="">Select staff...</option>
              {staffList.map((s) => (
                <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>
              ))}
            </select>
          </div>

          {/* Client */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Client</label>
            <select
              value={form.clientId}
              onChange={(e) => setForm({ ...form, clientId: e.target.value })}
              disabled={!isAdmin}
              className="w-full h-9 rounded-lg border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60"
            >
              <option value="">No client</option>
              {clientList.map((c) => (
                <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>
              ))}
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Shift notes..."
              rows={2}
              disabled={!isAdmin}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none disabled:opacity-60"
            />
          </div>

          {isAdmin && (
            <div className="flex justify-between pt-2">
              <button
                type="button"
                onClick={() => {
                  if (confirm("Delete this shift?")) deleteMutation.mutate();
                }}
                disabled={isPending}
                className="h-9 px-4 rounded-lg border border-destructive/30 text-sm font-medium text-destructive flex items-center gap-2 hover:bg-destructive/10 transition-colors disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" /> Delete
              </button>
              <div className="flex gap-2">
                <button type="button" onClick={onClose} className="h-9 px-4 rounded-lg border text-sm font-medium text-foreground hover:bg-secondary transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={isPending} className="h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium flex items-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50">
                  {updateMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  <Save className="h-4 w-4" /> Save
                </button>
              </div>
            </div>
          )}

          {!isAdmin && (
            <div className="flex justify-end pt-2">
              <button type="button" onClick={onClose} className="h-9 px-4 rounded-lg border text-sm font-medium text-foreground hover:bg-secondary transition-colors">
                Close
              </button>
            </div>
          )}
        </form>
      </motion.div>
    </div>
  );
}
