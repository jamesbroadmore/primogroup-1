import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Plus, AlertTriangle, AlertCircle, Shield, Pill, Loader2, X } from "lucide-react";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { toast } from "sonner";

const typeIcons: Record<string, any> = {
  medication_error: Pill,
  behavior: AlertCircle,
  injury: AlertTriangle,
  safeguarding: Shield,
};

const INCIDENT_TYPES = [
  { value: "injury", label: "Injury" },
  { value: "medication_error", label: "Medication Error" },
  { value: "behavior", label: "Behavioural Incident" },
  { value: "safeguarding", label: "Safeguarding Concern" },
  { value: "property_damage", label: "Property Damage" },
  { value: "other", label: "Other" },
];

export default function Incidents() {
  const [showAdd, setShowAdd] = useState(false);

  const { data: incidents = [], isLoading } = useQuery({
    queryKey: ["incidents"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("incidents")
        .select("*, reporter:reported_by(first_name, last_name), client:client_id(first_name, last_name)")
        .order("incident_date", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
  });

  return (
    <AppLayout title="Incident Reports">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{incidents.length} incidents</p>
          <button
            onClick={() => setShowAdd(true)}
            className="h-9 px-4 rounded-lg bg-destructive text-destructive-foreground text-sm font-medium flex items-center gap-2 hover:opacity-90 transition-opacity"
          >
            <Plus className="h-4 w-4" /> Report Incident
          </button>
        </div>

        {showAdd && <AddIncidentDialog onClose={() => setShowAdd(false)} />}

        {isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : incidents.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl bg-card p-12 shadow-card border border-border/50 text-center">
            <p className="text-muted-foreground text-sm">No incidents reported. Use "Report Incident" to log one.</p>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {incidents.map((inc: any, i: number) => {
              const Icon = typeIcons[inc.incident_type] || AlertTriangle;
              return (
                <motion.div key={inc.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  className="rounded-xl bg-card p-5 shadow-card border border-border/50">
                  <div className="flex items-start gap-3">
                    <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${
                      inc.severity === "critical" || inc.severity === "high" ? "bg-destructive/10" : inc.severity === "medium" ? "bg-warning/10" : "bg-muted"
                    }`}>
                      <Icon className={`h-4 w-4 ${
                        inc.severity === "critical" || inc.severity === "high" ? "text-destructive" : inc.severity === "medium" ? "text-warning" : "text-muted-foreground"
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <div>
                          <p className="text-sm font-semibold text-card-foreground capitalize">{inc.incident_type.replace("_", " ")}</p>
                          <p className="text-xs text-muted-foreground">
                            {inc.client ? `${inc.client.first_name} ${inc.client.last_name}` : "N/A"} ·{" "}
                            {inc.reporter ? `${inc.reporter.first_name} ${inc.reporter.last_name}` : "N/A"} ·{" "}
                            {format(new Date(inc.incident_date), "MMM d, yyyy")}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                            inc.severity === "critical" || inc.severity === "high" ? "bg-destructive/10 text-destructive" :
                            inc.severity === "medium" ? "bg-warning/10 text-warning" : "bg-muted text-muted-foreground"
                          }`}>{inc.severity}</span>
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                            inc.status === "resolved" || inc.status === "closed" ? "bg-success/10 text-success" :
                            inc.status === "open" ? "bg-destructive/10 text-destructive" : "bg-warning/10 text-warning"
                          }`}>{inc.status}</span>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">{inc.description}</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}

function AddIncidentDialog({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: staffProfile } = useQuery({
    queryKey: ["my-staff-id", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase.from("profiles").select("staff_id").eq("user_id", user.id).single();
      return data?.staff_id || null;
    },
    enabled: !!user,
  });

  const { data: clientList = [] } = useQuery({
    queryKey: ["client-list-incidents"],
    queryFn: async () => {
      const { data, error } = await supabase.from("clients").select("id, first_name, last_name").eq("status", "active").order("first_name");
      if (error) throw error;
      return data;
    },
  });

  const [form, setForm] = useState({
    incident_type: "injury",
    severity: "low",
    client_id: "",
    description: "",
    location: "",
    immediate_action: "",
    incident_date: new Date().toISOString().split("T")[0],
  });

  const mutation = useMutation({
    mutationFn: async () => {
      if (!form.description.trim()) throw new Error("Description is required");
      if (!staffProfile) throw new Error("Your account is not linked to a staff record");
      const { error } = await supabase.from("incidents").insert({
        incident_type: form.incident_type,
        severity: form.severity,
        client_id: form.client_id || null,
        description: form.description.trim(),
        location: form.location.trim() || null,
        immediate_action: form.immediate_action.trim() || null,
        incident_date: form.incident_date,
        reported_by: staffProfile,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Incident reported");
      queryClient.invalidateQueries({ queryKey: ["incidents"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-incidents"] });
      queryClient.invalidateQueries({ queryKey: ["notif-incidents"] });
      onClose();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-xl bg-card shadow-xl border border-border"
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-lg font-semibold text-card-foreground">Report Incident</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Type</label>
              <select value={form.incident_type} onChange={(e) => setForm({ ...form, incident_type: e.target.value })}
                className="w-full h-9 rounded-lg border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
                {INCIDENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Severity</label>
              <select value={form.severity} onChange={(e) => setForm({ ...form, severity: e.target.value })}
                className="w-full h-9 rounded-lg border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Client</label>
            <select value={form.client_id} onChange={(e) => setForm({ ...form, client_id: e.target.value })}
              className="w-full h-9 rounded-lg border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
              <option value="">Select client (optional)...</option>
              {clientList.map((c: any) => <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Date</label>
            <input type="date" value={form.incident_date} onChange={(e) => setForm({ ...form, incident_date: e.target.value })}
              className="w-full h-9 rounded-lg border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Location</label>
            <input type="text" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Where did it happen?"
              className="w-full h-9 rounded-lg border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Description *</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Describe what happened..." rows={3}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Immediate Action Taken</label>
            <textarea value={form.immediate_action} onChange={(e) => setForm({ ...form, immediate_action: e.target.value })} placeholder="What was done immediately?" rows={2}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="h-9 px-4 rounded-lg border text-sm font-medium text-foreground hover:bg-secondary transition-colors">Cancel</button>
            <button type="submit" disabled={mutation.isPending} className="h-9 px-4 rounded-lg bg-destructive text-destructive-foreground text-sm font-medium flex items-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50">
              {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Report Incident
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
