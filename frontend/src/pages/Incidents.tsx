import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Plus, AlertTriangle, AlertCircle, Shield, Pill, Loader2, Lock, X } from "lucide-react";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { toast } from "sonner";
import { fullName } from "@/lib/display-names";
import { Avatar, EmptyState, DialogOverlay, DialogHeader, FormField, FormSelect, FormInput, FormTextarea } from "@/components/ui-kit";

const typeIcons: Record<string, any> = {
  medication_error: Pill,
  behavior: AlertCircle,
  injury: AlertTriangle,
  safeguarding: Shield,
  near_miss: AlertCircle,
};

const INCIDENT_TYPES = [
  { value: "injury", label: "Injury" },
  { value: "medication_error", label: "Medication Error" },
  { value: "behavior", label: "Behavioural Incident" },
  { value: "safeguarding", label: "Safeguarding Concern" },
  { value: "property_damage", label: "Property Damage" },
  { value: "near_miss", label: "Near Miss" },
  { value: "other", label: "Other" },
];

const SEVERITY_CONFIG: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  critical: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200", dot: "bg-red-500" },
  high: { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200", dot: "bg-orange-500" },
  medium: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", dot: "bg-amber-500" },
  low: { bg: "bg-slate-50", text: "text-slate-600", border: "border-slate-200", dot: "bg-slate-400" },
};

export default function Incidents() {
  const [showAdd, setShowAdd] = useState(false);

  const { data: incidents = [], isLoading } = useQuery({
    queryKey: ["incidents"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("incidents")
        .select("*, reporter:reported_by(first_name, last_name, preferred_name), client:client_id(first_name, last_name, preferred_name)")
        .order("incident_date", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
  });

  const openCount = incidents.filter((i: any) => i.status === "open" || i.status === "investigating").length;

  return (
    <AppLayout title="Incident Reports">
      <div className="space-y-5">
        {/* Top stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Total", value: incidents.length, gradient: "linear-gradient(135deg, #a78bfa, #8b5cf6)" },
            { label: "Open", value: openCount, gradient: openCount > 0 ? "linear-gradient(135deg, #f87171, #ef4444)" : "linear-gradient(135deg, #4ade80, #22c55e)" },
            { label: "Critical", value: incidents.filter((i: any) => i.severity === "critical").length, gradient: "linear-gradient(135deg, #fb923c, #f97316)" },
            { label: "Resolved", value: incidents.filter((i: any) => i.status === "resolved" || i.status === "closed").length, gradient: "linear-gradient(135deg, #4ade80, #22c55e)" },
          ].map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="rounded-2xl bg-white border border-border/50 shadow-sm p-4">
              <div className="h-8 w-8 rounded-xl mb-2" style={{ background: s.gradient }} />
              <p className="text-2xl font-bold text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </motion.div>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <p className="text-sm text-muted-foreground">{incidents.length} incidents</p>
            <span className="text-xs text-muted-foreground bg-white border border-border px-2.5 py-1 rounded-xl flex items-center gap-1.5 shadow-sm">
              <Lock className="h-3 w-3" /> Immutable after submission
            </span>
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="h-9 px-4 rounded-xl text-white text-sm font-bold flex items-center gap-2 shadow-md hover:opacity-90 transition-all"
            style={{ background: "linear-gradient(135deg, #f87171, #ef4444)" }}
          >
            <Plus className="h-4 w-4" /> Report Incident
          </button>
        </div>

        {showAdd && <AddIncidentDialog onClose={() => setShowAdd(false)} />}

        {isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : incidents.length === 0 ? (
          <div className="rounded-2xl bg-white border border-border/50 shadow-sm">
            <EmptyState
              icon={AlertTriangle}
              title="No incidents reported"
              description='Use "Report Incident" to log a new incident.'
            />
          </div>
        ) : (
          <div className="space-y-3">
            {incidents.map((inc: any, i: number) => {
              const Icon = typeIcons[inc.incident_type] || AlertTriangle;
              const sev = SEVERITY_CONFIG[inc.severity] || SEVERITY_CONFIG.low;
              return (
                <motion.div
                  key={inc.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="rounded-2xl bg-white border border-border/50 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
                >
                  <div className={`h-1 ${sev.dot}`} style={{ background: sev.dot.replace("bg-", "") }} />
                  <div className="p-5">
                    <div className="flex items-start gap-4">
                      <div className={`h-10 w-10 rounded-2xl flex items-center justify-center shrink-0 ${sev.bg} border ${sev.border}`}>
                        <Icon className={`h-5 w-5 ${sev.text}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 flex-wrap mb-2">
                          <div>
                            <p className="text-sm font-bold text-foreground capitalize">{inc.incident_type.replace(/_/g, " ")}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {fullName(inc.client)} · Reported by {fullName(inc.reporter)} · {format(new Date(inc.incident_date), "MMM d, yyyy")}
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {inc.injury_occurred && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200">Injury</span>
                            )}
                            {inc.medical_attention_required && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200">Medical</span>
                            )}
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border capitalize ${sev.bg} ${sev.text} ${sev.border}`}>
                              {inc.severity}
                            </span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                              inc.status === "resolved" || inc.status === "closed" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                              inc.status === "open" ? "bg-red-50 text-red-700 border border-red-200" :
                              "bg-amber-50 text-amber-700 border border-amber-200"
                            }`}>{inc.status}</span>
                          </div>
                        </div>
                        <p className="text-sm text-slate-600 leading-relaxed">{inc.description}</p>
                        {inc.immediate_action && (
                          <p className="text-xs text-muted-foreground mt-2">
                            <strong className="text-foreground">Action taken: </strong>{inc.immediate_action}
                          </p>
                        )}
                        {inc.location && (
                          <p className="text-xs text-muted-foreground mt-1">
                            <strong className="text-foreground">Location: </strong>{inc.location}
                          </p>
                        )}
                      </div>
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
      const { data, error } = await supabase.from("clients").select("id, first_name, last_name, preferred_name").eq("status", "active").order("first_name");
      if (error) throw error;
      return data;
    },
  });

  const [incidentCategory, setIncidentCategory] = useState<"client" | "work">("client");
  const [form, setForm] = useState({
    incident_type: "injury", severity: "low", client_id: "",
    description: "", location: "", immediate_action: "",
    incident_date: new Date().toISOString().split("T")[0],
    injury_occurred: false, medical_attention_required: false,
  });

  const mutation = useMutation({
    mutationFn: async () => {
      if (!form.description.trim()) throw new Error("Description is required");
      if (!staffProfile) throw new Error("Your account is not linked to a staff record");
      if (incidentCategory === "client" && !form.client_id) throw new Error("Please select a client for client-related incidents");
      
      const { error } = await supabase.from("incidents").insert({
        incident_type: form.incident_type, severity: form.severity,
        client_id: incidentCategory === "client" ? form.client_id : null, 
        description: form.description.trim(),
        location: form.location.trim() || null, immediate_action: form.immediate_action.trim() || null,
        incident_date: form.incident_date, reported_by: staffProfile, created_by: user?.id,
        injury_occurred: form.injury_occurred, medical_attention_required: form.medical_attention_required,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Incident reported — immutable record created");
      queryClient.invalidateQueries({ queryKey: ["incidents"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-incidents"] });
      queryClient.invalidateQueries({ queryKey: ["notif-incidents"] });
      onClose();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <DialogOverlay onClose={onClose}>
      <DialogHeader title="Report Incident" onClose={onClose} gradient="linear-gradient(90deg, #f87171, #ef4444)" />
      <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }} className="p-6 space-y-4">
        {/* Incident Category Toggle */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Incident Category</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setIncidentCategory("client")}
              data-testid="incident-category-client"
              className={`flex-1 h-12 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
                incidentCategory === "client"
                  ? "bg-purple-100 text-purple-700 border-2 border-purple-300"
                  : "bg-slate-100 text-slate-600 border-2 border-transparent hover:bg-slate-200"
              }`}
            >
              <AlertTriangle className="h-4 w-4" />
              Client Incident
            </button>
            <button
              type="button"
              onClick={() => { setIncidentCategory("work"); setForm({ ...form, client_id: "" }); }}
              data-testid="incident-category-work"
              className={`flex-1 h-12 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
                incidentCategory === "work"
                  ? "bg-orange-100 text-orange-700 border-2 border-orange-300"
                  : "bg-slate-100 text-slate-600 border-2 border-transparent hover:bg-slate-200"
              }`}
            >
              <Shield className="h-4 w-4" />
              Work Incident
            </button>
          </div>
          <p className="text-xs text-muted-foreground">
            {incidentCategory === "client" 
              ? "Incident involving or affecting a client" 
              : "Workplace incident not directly involving a client (e.g., vehicle accident, staff injury)"}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Type">
            <FormSelect value={form.incident_type} onChange={(v) => setForm({ ...form, incident_type: v })}>
              {INCIDENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </FormSelect>
          </FormField>
          <FormField label="Severity">
            <FormSelect value={form.severity} onChange={(v) => setForm({ ...form, severity: v })}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </FormSelect>
          </FormField>
        </div>

        {/* Client Selector - Only show for client incidents */}
        {incidentCategory === "client" && (
          <FormField label="Client" required>
            <FormSelect value={form.client_id} onChange={(v) => setForm({ ...form, client_id: v })} data-testid="incident-client-select">
              <option value="">Select client...</option>
              {clientList.map((c: any) => (
                <option key={c.id} value={c.id}>{c.preferred_name ? `${c.preferred_name} ${c.last_name}` : `${c.first_name} ${c.last_name}`}</option>
              ))}
            </FormSelect>
          </FormField>
        )}

        <FormField label="Date">
          <FormInput type="date" value={form.incident_date} onChange={(v) => setForm({ ...form, incident_date: v })} />
        </FormField>
        <FormField label="Location">
          <FormInput value={form.location} onChange={(v) => setForm({ ...form, location: v })} placeholder="Where did it happen?" />
        </FormField>
        <FormField label="Description" required>
          <FormTextarea value={form.description} onChange={(v) => setForm({ ...form, description: v })} placeholder="Describe what happened..." rows={3} />
        </FormField>
        <FormField label="Immediate Action Taken">
          <FormTextarea value={form.immediate_action} onChange={(v) => setForm({ ...form, immediate_action: v })} placeholder="What was done immediately?" rows={2} />
        </FormField>
        <div className="flex gap-6">
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input type="checkbox" checked={form.injury_occurred} onChange={(e) => setForm({ ...form, injury_occurred: e.target.checked })} className="rounded" />
            <span className="text-sm text-muted-foreground">Injury occurred</span>
          </label>
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input type="checkbox" checked={form.medical_attention_required} onChange={(e) => setForm({ ...form, medical_attention_required: e.target.checked })} className="rounded" />
            <span className="text-sm text-muted-foreground">Medical attention required</span>
          </label>
        </div>
        <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 flex items-center gap-2">
          <Lock className="h-4 w-4 text-amber-500 shrink-0" />
          <p className="text-xs text-amber-700">Once submitted, this incident report cannot be modified.</p>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="h-10 px-4 rounded-xl border text-sm font-medium text-foreground hover:bg-secondary transition-colors">Cancel</button>
          <button type="submit" disabled={mutation.isPending}
            className="h-10 px-5 rounded-xl text-white text-sm font-bold flex items-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50 shadow-md"
            style={{ background: "linear-gradient(135deg, #f87171, #ef4444)" }}>
            {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Report Incident
          </button>
        </div>
      </form>
    </DialogOverlay>
  );
}
