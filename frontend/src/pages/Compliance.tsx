import { useState, useMemo } from "react";
import { AppLayout } from "@/components/AppLayout";
import { AlertTriangle, CheckCircle, XCircle, Loader2, Plus, X, Search, Shield, List, BarChart3 } from "lucide-react";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { ComplianceFlagsPanel } from "@/components/compliance/ComplianceFlagsPanel";
import { ServiceCategoriesPanel } from "@/components/compliance/ServiceCategoriesPanel";

const RECORD_TYPES = [
  { value: "worker_screening", label: "NDIS Worker Screening" },
  { value: "wwcc", label: "Working with Children Check" },
  { value: "police_check", label: "National Police Check" },
  { value: "first_aid", label: "First Aid Certificate" },
  { value: "cpr", label: "CPR Certificate" },
  { value: "manual_handling", label: "Manual Handling" },
  { value: "medication", label: "Medication Administration" },
  { value: "covid_vaccination", label: "COVID-19 Vaccination" },
  { value: "drivers_licence", label: "Driver's Licence" },
  { value: "other", label: "Other" },
];

function StatusBadge({ status }: { status: string }) {
  const styles = status === "current" ? "bg-success/10 text-success" :
    status === "expiring_soon" ? "bg-warning/10 text-warning" : "bg-destructive/10 text-destructive";
  const Icon = status === "current" ? CheckCircle : status === "expiring_soon" ? AlertTriangle : XCircle;
  const label = status === "current" ? "Valid" : status === "expiring_soon" ? "Expiring" : status === "expired" ? "Expired" : status;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${styles}`}>
      <Icon className="h-3 w-3" />{label}
    </span>
  );
}

const TABS = [
  { key: "records", label: "Staff Records", icon: CheckCircle },
  { key: "flags", label: "Billing Compliance", icon: Shield },
  { key: "services", label: "Service Categories", icon: List },
];

export default function Compliance() {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("records");
  const [showAdd, setShowAdd] = useState(false);
  const [staffFilter, setStaffFilter] = useState("all");
  const [search, setSearch] = useState("");

  const { data: records = [], isLoading } = useQuery({
    queryKey: ["compliance"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("compliance_records")
        .select("*, staff:staff_id(id, first_name, last_name)")
        .order("expiry_date", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const { data: staffList = [] } = useQuery({
    queryKey: ["staff-list-compliance"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("staff")
        .select("id, first_name, last_name, status")
        .order("first_name");
      if (error) throw error;
      return data;
    },
  });

  const filtered = useMemo(() => {
    let list = records;
    if (staffFilter !== "all") {
      list = list.filter((r: any) => r.staff_id === staffFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((r: any) =>
        r.record_name.toLowerCase().includes(q) ||
        r.record_type.toLowerCase().includes(q) ||
        (r.staff && `${r.staff.first_name} ${r.staff.last_name}`.toLowerCase().includes(q))
      );
    }
    return list;
  }, [records, staffFilter, search]);

  const alerts = records.filter((r: any) => r.status === "expiring_soon" || r.status === "expired");

  const staffComplianceStatus = useMemo(() => {
    const required = ["worker_screening", "wwcc", "police_check", "first_aid", "cpr"];
    return staffList.filter(s => s.status === "active").map((s) => {
      const staffRecords = records.filter((r: any) => r.staff_id === s.id);
      const missing = required.filter(
        (rt) => !staffRecords.some((r: any) => r.record_type === rt && r.status === "current")
      );
      return { ...s, missing, total: required.length, complete: required.length - missing.length };
    });
  }, [staffList, records]);

  return (
    <AppLayout title="Compliance & Governance">
      <div className="space-y-4">
        {/* Tab navigation */}
        <div className="flex flex-wrap gap-2">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const gradients: Record<string, string> = {
              records: "linear-gradient(135deg, #4ade80, #22c55e)",
              flags: "linear-gradient(135deg, #60a5fa, #3b82f6)",
              services: "linear-gradient(135deg, #a78bfa, #8b5cf6)",
            };
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`h-9 px-4 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all ${
                  activeTab === tab.key
                    ? "text-white shadow-md"
                    : "bg-white text-muted-foreground border border-border hover:bg-secondary"
                }`}
                style={activeTab === tab.key ? { background: gradients[tab.key] || gradients.records } : {}}
              >
                <Icon className="h-3.5 w-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {activeTab === "flags" && isAdmin && <ComplianceFlagsPanel />}
        {activeTab === "services" && isAdmin && <ServiceCategoriesPanel />}

        {activeTab === "records" && (
          <>
            {/* Staff compliance overview */}
            {staffComplianceStatus.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {staffComplianceStatus.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setStaffFilter(staffFilter === s.id ? "all" : s.id)}
                    className={`rounded-2xl p-3 border text-left transition-all ${
                      staffFilter === s.id
                        ? "border-purple-300 shadow-md"
                        : "bg-white border-border/50 hover:shadow-sm"
                    }`}
                    style={staffFilter === s.id ? { background: "linear-gradient(135deg, #f5f3ff, #ede9fe)" } : { background: "white" }}
                  >
                    <p className="text-xs font-semibold text-card-foreground truncate">{s.first_name} {s.last_name}</p>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            s.complete === s.total ? "bg-success" : s.missing.length > 2 ? "bg-destructive" : "bg-warning"
                          }`}
                          style={{ width: `${(s.complete / s.total) * 100}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-muted-foreground">{s.complete}/{s.total}</span>
                    </div>
                    {s.missing.length > 0 && (
                      <p className="text-[10px] text-destructive mt-1 truncate">
                        Missing: {s.missing.map(m => RECORD_TYPES.find(r => r.value === m)?.label || m).join(", ")}
                      </p>
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Alerts */}
            {alerts.length > 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-2xl border border-amber-200 bg-amber-50 p-4 overflow-hidden">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-7 w-7 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #fbbf24, #f59e0b)" }}>
                    <AlertTriangle className="h-3.5 w-3.5 text-white" />
                  </div>
                  <h3 className="text-sm font-bold text-amber-800">{alerts.length} Compliance Alert{alerts.length > 1 ? "s" : ""}</h3>
                </div>
                <ul className="space-y-1">
                  {alerts.slice(0, 5).map((a: any) => (
                    <li key={a.id} className="text-xs text-amber-700">
                      • {a.staff ? `${a.staff.first_name} ${a.staff.last_name}` : "Unknown"}: {a.record_name} — {a.status === "expired" ? "Expired" : "Expiring soon"}
                    </li>
                  ))}
                  {alerts.length > 5 && <li className="text-xs text-amber-600">...and {alerts.length - 5} more</li>}
                </ul>
              </motion.div>
            )}

            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3 flex-1">
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full h-9 pl-9 pr-3 rounded-lg border bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="Search records..."
                  />
                </div>
                {staffFilter !== "all" && (
                  <button
                    onClick={() => setStaffFilter("all")}
                    className="h-9 px-3 rounded-lg border bg-primary/10 text-primary text-xs font-medium flex items-center gap-1.5 hover:bg-primary/20 transition-colors"
                  >
                    {staffList.find(s => s.id === staffFilter)?.first_name} {staffList.find(s => s.id === staffFilter)?.last_name}
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
              <button
                onClick={() => setShowAdd(true)}
                className="h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium flex items-center gap-2 hover:opacity-90 transition-opacity"
              >
                <Plus className="h-4 w-4" /> Add Record
              </button>
            </div>

            {showAdd && (
              <AddComplianceDialog
                staffList={staffList}
                preselectedStaffId={staffFilter !== "all" ? staffFilter : undefined}
                onClose={() => setShowAdd(false)}
              />
            )}

            {/* Table */}
            {isLoading ? (
              <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
            ) : filtered.length === 0 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl bg-card p-12 shadow-card border border-border/50 text-center">
                <p className="text-muted-foreground text-sm">
                  {records.length === 0
                    ? 'No compliance records yet. Click "Add Record" to get started.'
                    : "No records match your filters."}
                </p>
              </motion.div>
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl bg-card shadow-card border border-border/50 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-secondary/50">
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">Staff</th>
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">Record</th>
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Type</th>
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Issue Date</th>
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Expiry</th>
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((r: any) => (
                        <tr key={r.id} className="border-b last:border-0 hover:bg-secondary/30 transition-colors">
                          <td className="px-4 py-3 font-medium text-card-foreground">
                            {r.staff ? `${r.staff.first_name} ${r.staff.last_name}` : "—"}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">{r.record_name}</td>
                          <td className="px-4 py-3 text-muted-foreground hidden md:table-cell capitalize">
                            {RECORD_TYPES.find(t => t.value === r.record_type)?.label || r.record_type.replace("_", " ")}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                            {r.issue_date ? format(new Date(r.issue_date), "d MMM yyyy") : "—"}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                            {r.expiry_date ? format(new Date(r.expiry_date), "d MMM yyyy") : "N/A"}
                          </td>
                          <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
}

/* ─── Add Compliance Record Dialog ─── */

function AddComplianceDialog({ staffList, preselectedStaffId, onClose }: {
  staffList: any[];
  preselectedStaffId?: string;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    staff_id: preselectedStaffId || "",
    record_type: "worker_screening",
    record_name: "",
    issue_date: "",
    expiry_date: "",
    status: "current",
    notes: "",
  });

  const handleTypeChange = (type: string) => {
    const label = RECORD_TYPES.find(t => t.value === type)?.label || type;
    setForm({ ...form, record_type: type, record_name: form.record_name || label });
  };

  const mutation = useMutation({
    mutationFn: async () => {
      if (!form.staff_id) throw new Error("Please select a staff member");
      if (!form.record_name.trim()) throw new Error("Record name is required");
      const { error } = await supabase.from("compliance_records").insert({
        staff_id: form.staff_id,
        record_type: form.record_type,
        record_name: form.record_name.trim(),
        issue_date: form.issue_date || null,
        expiry_date: form.expiry_date || null,
        status: form.status,
        notes: form.notes.trim() || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Compliance record added");
      queryClient.invalidateQueries({ queryKey: ["compliance"] });
      onClose();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md rounded-xl bg-card shadow-xl border border-border"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-lg font-semibold text-card-foreground">Add Compliance Record</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }} className="p-5 space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Staff Member *</label>
            <select
              value={form.staff_id}
              onChange={(e) => setForm({ ...form, staff_id: e.target.value })}
              className="w-full h-9 rounded-lg border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Select staff...</option>
              {staffList.map((s: any) => (
                <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Record Type</label>
            <select
              value={form.record_type}
              onChange={(e) => handleTypeChange(e.target.value)}
              className="w-full h-9 rounded-lg border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {RECORD_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Record Name *</label>
            <input
              type="text"
              value={form.record_name}
              onChange={(e) => setForm({ ...form, record_name: e.target.value })}
              placeholder="e.g. NDIS Worker Screening Check"
              className="w-full h-9 rounded-lg border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Issue Date</label>
              <input
                type="date"
                value={form.issue_date}
                onChange={(e) => setForm({ ...form, issue_date: e.target.value })}
                className="w-full h-9 rounded-lg border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Expiry Date</label>
              <input
                type="date"
                value={form.expiry_date}
                onChange={(e) => setForm({ ...form, expiry_date: e.target.value })}
                className="w-full h-9 rounded-lg border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Status</label>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              className="w-full h-9 rounded-lg border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="current">Current / Valid</option>
              <option value="expiring_soon">Expiring Soon</option>
              <option value="expired">Expired</option>
              <option value="pending">Pending</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Any additional notes..."
              rows={2}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
          </div>

          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="h-9 px-4 rounded-lg border text-sm font-medium text-foreground hover:bg-secondary transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={mutation.isPending} className="h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium flex items-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50">
              {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Add Record
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
