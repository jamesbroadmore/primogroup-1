import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AlertTriangle, CheckCircle, Info, Shield, X } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

const SEVERITY_STYLES: Record<string, string> = {
  critical: "bg-destructive/10 text-destructive border-destructive/20",
  warning: "bg-warning/10 text-warning border-warning/20",
  info: "bg-info/10 text-info border-info/20",
};

const SEVERITY_ICONS: Record<string, any> = {
  critical: AlertTriangle,
  warning: AlertTriangle,
  info: Info,
};

export function ComplianceFlagsPanel() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>("open");

  const { data: flags = [], isLoading } = useQuery({
    queryKey: ["compliance-flags", statusFilter],
    queryFn: async () => {
      let query = supabase
        .from("compliance_flags")
        .select("*")
        .order("created_at", { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const { data, error } = await query.limit(50);
      if (error) throw error;
      return data;
    },
  });

  const resolveMutation = useMutation({
    mutationFn: async ({ id, action }: { id: string; action: "resolved" | "dismissed" | "acknowledged" }) => {
      const { error } = await supabase
        .from("compliance_flags")
        .update({ status: action, resolved_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["compliance-flags"] });
      toast.success("Flag updated");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const counts = {
    critical: flags.filter((f: any) => f.severity === "critical").length,
    warning: flags.filter((f: any) => f.severity === "warning").length,
    info: flags.filter((f: any) => f.severity === "info").length,
  };

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl bg-destructive/5 border border-destructive/20 p-4 text-center">
          <p className="text-2xl font-bold text-destructive">{counts.critical}</p>
          <p className="text-xs text-destructive/80">Critical</p>
        </div>
        <div className="rounded-xl bg-warning/5 border border-warning/20 p-4 text-center">
          <p className="text-2xl font-bold text-warning">{counts.warning}</p>
          <p className="text-xs text-warning/80">Warnings</p>
        </div>
        <div className="rounded-xl bg-info/5 border border-info/20 p-4 text-center">
          <p className="text-2xl font-bold text-info">{counts.info}</p>
          <p className="text-xs text-info/80">Info</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-1 rounded-lg bg-secondary/50 p-1 w-fit">
        {["open", "acknowledged", "resolved", "dismissed", "all"].map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-all ${
              statusFilter === s ? "bg-card text-card-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Flags list */}
      {flags.length === 0 ? (
        <div className="rounded-xl bg-card p-8 border border-border/50 text-center">
          <Shield className="h-8 w-8 text-success/40 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            {statusFilter === "open" ? "No open compliance flags. System is compliant." : "No flags match this filter."}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {flags.map((flag: any) => {
            const Icon = SEVERITY_ICONS[flag.severity] || Info;
            return (
              <div
                key={flag.id}
                className={`rounded-lg border p-3 ${SEVERITY_STYLES[flag.severity] || SEVERITY_STYLES.info}`}
              >
                <div className="flex items-start gap-2">
                  <Icon className="h-4 w-4 mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold capitalize">{flag.flag_type.replace(/_/g, " ")}</span>
                      <span className="text-[10px] opacity-60">{flag.resource_type}</span>
                    </div>
                    <p className="text-xs opacity-80 mt-0.5">{flag.description}</p>
                    <p className="text-[10px] opacity-50 mt-1">{format(new Date(flag.created_at), "dd MMM yyyy HH:mm")}</p>
                  </div>
                  {flag.status === "open" && (
                    <div className="flex gap-1 shrink-0">
                      <button
                        onClick={() => resolveMutation.mutate({ id: flag.id, action: "acknowledged" })}
                        className="h-6 px-2 rounded text-[10px] font-medium bg-card/50 hover:bg-card transition-colors"
                      >
                        Acknowledge
                      </button>
                      <button
                        onClick={() => resolveMutation.mutate({ id: flag.id, action: "resolved" })}
                        className="h-6 px-2 rounded text-[10px] font-medium bg-card/50 hover:bg-card transition-colors"
                      >
                        Resolve
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
