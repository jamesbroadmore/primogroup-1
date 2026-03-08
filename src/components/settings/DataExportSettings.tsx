import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Save, Database, Download, FileDown } from "lucide-react";
import { motion } from "framer-motion";

const EXPORT_TABLES = [
  { key: "staff", label: "Staff" },
  { key: "clients", label: "Clients" },
  { key: "timesheets", label: "Timesheets" },
  { key: "case_notes", label: "Case Notes" },
  { key: "incidents", label: "Incidents" },
  { key: "compliance_records", label: "Compliance Records" },
  { key: "shift_checkins", label: "Shift Check-Ins" },
];

export function DataExportSettings() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<Record<string, string>>({});
  const [dirty, setDirty] = useState(false);
  const [exporting, setExporting] = useState<string | null>(null);

  const { data: settings = [], isLoading } = useQuery({
    queryKey: ["data-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("organisation_settings")
        .select("*")
        .in("key", ["data_retention_months", "data_auto_backup"]);
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
      toast.success("Data settings saved");
      queryClient.invalidateQueries({ queryKey: ["data-settings"] });
      setDirty(false);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const handleExport = async (tableKey: string) => {
    setExporting(tableKey);
    try {
      const { data, error } = await supabase.from(tableKey as any).select("*");
      if (error) throw error;
      if (!data || data.length === 0) {
        toast.info("No data to export");
        setExporting(null);
        return;
      }

      const headers = Object.keys(data[0]);
      const csvRows = [
        headers.join(","),
        ...data.map((row: any) =>
          headers.map((h) => {
            const val = row[h];
            if (val === null || val === undefined) return "";
            const str = String(val).replace(/"/g, '""');
            return str.includes(",") || str.includes('"') || str.includes("\n") ? `"${str}"` : str;
          }).join(",")
        ),
      ];

      const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${tableKey}_export_${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`${tableKey} exported successfully`);
    } catch (err: any) {
      toast.error(err.message || "Export failed");
    }
    setExporting(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(form);
  };

  if (isLoading) {
    return <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl space-y-4">
      {/* Retention & Backup */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="rounded-xl bg-card p-6 shadow-card border border-border/50 space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Database className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-card-foreground">Data Settings</h3>
              <p className="text-xs text-muted-foreground">Retention policies and backup preferences</p>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
              Data retention period (months)
            </label>
            <input
              type="number"
              min="12"
              max="120"
              value={form["data_retention_months"] || "84"}
              onChange={(e) => { setForm({ ...form, data_retention_months: e.target.value }); setDirty(true); }}
              className="w-32 h-9 rounded-lg border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <p className="text-[10px] text-muted-foreground mt-1">NDIS requires minimum 7 years (84 months) record keeping</p>
          </div>

          <div className="flex items-center justify-between py-3 border-t border-border/50">
            <div>
              <p className="text-sm font-medium text-card-foreground">Automatic Backups</p>
              <p className="text-xs text-muted-foreground mt-0.5">Regularly back up your data</p>
            </div>
            <button
              type="button"
              onClick={() => {
                const current = form["data_auto_backup"] === "true";
                setForm({ ...form, data_auto_backup: current ? "false" : "true" });
                setDirty(true);
              }}
              className={`relative h-6 w-11 rounded-full transition-colors shrink-0 ${
                form["data_auto_backup"] === "true" ? "bg-primary" : "bg-muted"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                  form["data_auto_backup"] === "true" ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={!dirty || mutation.isPending}
            className="h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium flex items-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Settings
          </button>
        </div>
      </form>

      {/* Export */}
      <div className="rounded-xl bg-card p-6 shadow-card border border-border/50 space-y-1">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Download className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-card-foreground">Export Data</h3>
            <p className="text-xs text-muted-foreground">Download your data as CSV files</p>
          </div>
        </div>

        {EXPORT_TABLES.map((t) => (
          <div
            key={t.key}
            className="flex items-center justify-between py-3 border-b last:border-0 border-border/50"
          >
            <p className="text-sm font-medium text-card-foreground">{t.label}</p>
            <button
              onClick={() => handleExport(t.key)}
              disabled={exporting === t.key}
              className="h-8 px-3 rounded-lg border bg-background text-xs font-medium text-foreground hover:bg-secondary transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              {exporting === t.key ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <FileDown className="h-3.5 w-3.5" />
              )}
              Export CSV
            </button>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
