import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Save, Bell } from "lucide-react";
import { motion } from "framer-motion";

const TOGGLES = [
  { key: "notif_email_alerts", label: "Email Alerts", desc: "Receive email notifications for important events" },
  { key: "notif_compliance_reminders", label: "Compliance Reminders", desc: "Get reminded when staff certifications are expiring" },
  { key: "notif_shift_notifications", label: "Shift Notifications", desc: "Alerts for new shift assignments and changes" },
  { key: "notif_incident_alerts", label: "Incident Alerts", desc: "Immediate notification when incidents are reported" },
  { key: "notif_timesheet_reminders", label: "Timesheet Reminders", desc: "Weekly reminders for pending timesheet approvals" },
];

export function NotificationSettings() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<Record<string, string>>({});
  const [dirty, setDirty] = useState(false);

  const allKeys = [...TOGGLES.map((t) => t.key), "notif_reminder_days_before"];

  const { data: settings = [], isLoading } = useQuery({
    queryKey: ["notif-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("organisation_settings")
        .select("*")
        .in("key", allKeys);
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (settings.length > 0) {
      const obj: Record<string, string> = {};
      settings.forEach((s: any) => { obj[s.key] = s.value || ""; });
      setForm(obj);
      setDirty(false);
    }
  }, [settings]);

  const mutation = useMutation({
    mutationFn: async (data: Record<string, string>) => {
      const promises = Object.entries(data).map(([key, value]) =>
        supabase
          .from("organisation_settings")
          .update({ value, updated_at: new Date().toISOString() })
          .eq("key", key)
      );
      const results = await Promise.all(promises);
      const err = results.find((r) => r.error);
      if (err?.error) throw err.error;
    },
    onSuccess: () => {
      toast.success("Notification preferences saved");
      queryClient.invalidateQueries({ queryKey: ["notif-settings"] });
      setDirty(false);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const toggleValue = (key: string) => {
    const current = form[key] === "true";
    setForm({ ...form, [key]: current ? "false" : "true" });
    setDirty(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(form);
  };

  if (isLoading) {
    return <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="rounded-xl bg-card p-6 shadow-card border border-border/50 space-y-1">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Bell className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-card-foreground">Notification Preferences</h3>
              <p className="text-xs text-muted-foreground">Choose which alerts and reminders to receive</p>
            </div>
          </div>

          {TOGGLES.map((t) => (
            <div
              key={t.key}
              className="flex items-center justify-between py-3 border-b last:border-0 border-border/50"
            >
              <div>
                <p className="text-sm font-medium text-card-foreground">{t.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{t.desc}</p>
              </div>
              <button
                type="button"
                onClick={() => toggleValue(t.key)}
                className={`relative h-6 w-11 rounded-full transition-colors shrink-0 ${
                  form[t.key] === "true" ? "bg-primary" : "bg-muted"
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                    form[t.key] === "true" ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          ))}
        </div>

        <div className="rounded-xl bg-card p-6 shadow-card border border-border/50">
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
            Compliance reminder lead time (days before expiry)
          </label>
          <input
            type="number"
            min="1"
            max="90"
            value={form["notif_reminder_days_before"] || "14"}
            onChange={(e) => { setForm({ ...form, notif_reminder_days_before: e.target.value }); setDirty(true); }}
            className="w-32 h-9 rounded-lg border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={!dirty || mutation.isPending}
            className="h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium flex items-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Preferences
          </button>
        </div>
      </form>
    </motion.div>
  );
}
