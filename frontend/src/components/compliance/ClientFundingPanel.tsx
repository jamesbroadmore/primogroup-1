import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Loader2, X, DollarSign } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface Props {
  clientId: string;
  clientName: string;
}

export function ClientFundingPanel({ clientId, clientName }: Props) {
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);

  const { data: funding = [], isLoading } = useQuery({
    queryKey: ["client-funding", clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("client_funding")
        .select("*")
        .eq("client_id", clientId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: carePlans = [] } = useQuery({
    queryKey: ["care-plans", clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("care_plans")
        .select("*")
        .eq("client_id", clientId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: agreements = [] } = useQuery({
    queryKey: ["service-agreements", clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_agreements")
        .select("*")
        .eq("client_id", clientId)
        .order("agreement_date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="space-y-4">
      {/* Funding Allocations */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Funding Allocations</p>
          <button onClick={() => setShowAdd(true)} className="text-xs text-primary hover:underline flex items-center gap-1">
            <Plus className="h-3 w-3" /> Add
          </button>
        </div>
        {funding.length === 0 ? (
          <p className="text-xs text-muted-foreground py-2">No funding allocations. Add one to enable compliant billing.</p>
        ) : (
          <div className="space-y-2">
            {funding.map((f: any) => {
              const budgetPct = f.total_budget ? Math.min(((f.budget_used || 0) / f.total_budget) * 100, 100) : 0;
              return (
                <div key={f.id} className="rounded-lg border p-3 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-card-foreground capitalize">{f.funding_program.replace("_", " ")}</span>
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full capitalize ${
                      f.status === "active" ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"
                    }`}>{f.status}</span>
                  </div>
                  {f.plan_number && <p className="text-[10px] text-muted-foreground">Plan: {f.plan_number}</p>}
                  {f.plan_start_date && (
                    <p className="text-[10px] text-muted-foreground">
                      {format(new Date(f.plan_start_date), "dd/MM/yyyy")} – {f.plan_end_date ? format(new Date(f.plan_end_date), "dd/MM/yyyy") : "Ongoing"}
                    </p>
                  )}
                  {f.total_budget && (
                    <div>
                      <div className="flex justify-between text-[10px] text-muted-foreground">
                        <span>Budget: ${Number(f.total_budget).toLocaleString()}</span>
                        <span>Used: ${Number(f.budget_used || 0).toLocaleString()} ({budgetPct.toFixed(0)}%)</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted mt-1 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${budgetPct > 90 ? "bg-destructive" : budgetPct > 70 ? "bg-warning" : "bg-success"}`}
                          style={{ width: `${budgetPct}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Care Plans */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Care Plans</p>
        {carePlans.length === 0 ? (
          <p className="text-xs text-muted-foreground py-2">No care plans recorded.</p>
        ) : (
          <div className="space-y-1">
            {carePlans.map((cp: any) => (
              <div key={cp.id} className="rounded-lg border p-2 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-card-foreground">{cp.plan_name}</p>
                  {cp.goals && cp.goals.length > 0 && (
                    <p className="text-[10px] text-muted-foreground">{cp.goals.length} goal(s)</p>
                  )}
                </div>
                <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full capitalize ${
                  cp.status === "active" ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"
                }`}>{cp.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Service Agreements */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Service Agreements</p>
        {agreements.length === 0 ? (
          <p className="text-xs text-warning py-2">⚠ No service agreement on file. Required for billing.</p>
        ) : (
          <div className="space-y-1">
            {agreements.map((a: any) => (
              <div key={a.id} className="rounded-lg border p-2 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-card-foreground">
                    Agreement — {format(new Date(a.agreement_date), "dd/MM/yyyy")}
                  </p>
                  <p className="text-[10px] text-muted-foreground">{a.signed ? "✓ Signed" : "⏳ Unsigned"}</p>
                </div>
                <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full capitalize ${
                  a.status === "active" ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"
                }`}>{a.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {showAdd && <AddFundingDialog clientId={clientId} onClose={() => setShowAdd(false)} />}
    </div>
  );
}

function AddFundingDialog({ clientId, onClose }: { clientId: string; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    funding_program: "ndis",
    plan_number: "",
    plan_start_date: "",
    plan_end_date: "",
    total_budget: "",
    notes: "",
  });

  const mutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("client_funding").insert({
        client_id: clientId,
        funding_program: form.funding_program,
        plan_number: form.plan_number.trim() || null,
        plan_start_date: form.plan_start_date || null,
        plan_end_date: form.plan_end_date || null,
        total_budget: form.total_budget ? parseFloat(form.total_budget) : null,
        notes: form.notes.trim() || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-funding", clientId] });
      toast.success("Funding allocation added");
      onClose();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-xl bg-card shadow-xl border p-5 space-y-3" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-card-foreground">Add Funding Allocation</p>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
        </div>
        <div>
          <label className="text-[10px] font-medium text-muted-foreground">Funding Program</label>
          <select value={form.funding_program} onChange={e => setForm({ ...form, funding_program: e.target.value })}
            className="mt-1 w-full h-8 rounded border bg-background px-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring">
            <option value="ndis">NDIS</option>
            <option value="aged_care">My Aged Care / Support at Home</option>
            <option value="private">Private</option>
          </select>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] font-medium text-muted-foreground">Plan Number</label>
            <input value={form.plan_number} onChange={e => setForm({ ...form, plan_number: e.target.value })}
              className="mt-1 w-full h-8 rounded border bg-background px-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring" />
          </div>
          <div>
            <label className="text-[10px] font-medium text-muted-foreground">Total Budget ($)</label>
            <input value={form.total_budget} onChange={e => setForm({ ...form, total_budget: e.target.value })} type="number"
              className="mt-1 w-full h-8 rounded border bg-background px-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] font-medium text-muted-foreground">Start Date</label>
            <input type="date" value={form.plan_start_date} onChange={e => setForm({ ...form, plan_start_date: e.target.value })}
              className="mt-1 w-full h-8 rounded border bg-background px-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring" />
          </div>
          <div>
            <label className="text-[10px] font-medium text-muted-foreground">End Date</label>
            <input type="date" value={form.plan_end_date} onChange={e => setForm({ ...form, plan_end_date: e.target.value })}
              className="mt-1 w-full h-8 rounded border bg-background px-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring" />
          </div>
        </div>
        <button onClick={() => mutation.mutate()} disabled={mutation.isPending}
          className="w-full h-9 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-1.5">
          {mutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Add Funding
        </button>
      </div>
    </div>
  );
}
