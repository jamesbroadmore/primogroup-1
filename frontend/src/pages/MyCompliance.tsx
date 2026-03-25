import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Upload, FileText, CheckCircle, AlertTriangle, XCircle, Loader2, X, Plus } from "lucide-react";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { format } from "date-fns";

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

export default function MyCompliance() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showUpload, setShowUpload] = useState(false);

  // Get staff_id for current user
  const { data: staffId } = useQuery({
    queryKey: ["my-staff-id-compliance", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase.from("profiles").select("staff_id").eq("user_id", user.id).single();
      return data?.staff_id || null;
    },
    enabled: !!user,
  });

  // Get my compliance records
  const { data: records = [], isLoading } = useQuery({
    queryKey: ["my-compliance", staffId],
    queryFn: async () => {
      if (!staffId) return [];
      const { data, error } = await supabase
        .from("compliance_records")
        .select("*")
        .eq("staff_id", staffId)
        .order("expiry_date", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!staffId,
  });

  // Required certs check
  const required = ["worker_screening", "wwcc", "police_check", "first_aid", "cpr"];
  const missing = required.filter(
    (rt) => !records.some((r: any) => r.record_type === rt && r.status === "current")
  );

  if (!staffId) {
    return (
      <AppLayout title="My Compliance">
        <div className="rounded-xl bg-card p-12 shadow-card border border-border/50 text-center">
          <p className="text-muted-foreground text-sm">Your account is not linked to a staff record. Contact your administrator.</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="My Compliance">
      <div className="space-y-4">
        {/* Progress */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-xl bg-card p-5 shadow-card border border-border/50">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-card-foreground">Compliance Status</h3>
            <span className="text-xs text-muted-foreground">{required.length - missing.length}/{required.length} complete</span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden mb-3">
            <div
              className={`h-full rounded-full transition-all ${missing.length === 0 ? "bg-success" : missing.length > 2 ? "bg-destructive" : "bg-warning"}`}
              style={{ width: `${((required.length - missing.length) / required.length) * 100}%` }}
            />
          </div>
          {missing.length > 0 && (
            <p className="text-xs text-destructive">
              Missing: {missing.map(m => RECORD_TYPES.find(r => r.value === m)?.label || m).join(", ")}
            </p>
          )}
          {missing.length === 0 && (
            <p className="text-xs text-success">All required certifications are up to date ✓</p>
          )}
        </motion.div>

        {/* Upload button */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{records.length} records</p>
          <button
            onClick={() => setShowUpload(true)}
            className="h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium flex items-center gap-2 hover:opacity-90 transition-opacity"
          >
            <Upload className="h-4 w-4" /> Upload Certificate
          </button>
        </div>

        {showUpload && (
          <UploadCertDialog staffId={staffId} onClose={() => setShowUpload(false)} />
        )}

        {/* Records list */}
        {isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : records.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl bg-card p-12 shadow-card border border-border/50 text-center">
            <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">No certificates uploaded yet.</p>
            <p className="text-muted-foreground text-xs mt-1">Upload your certifications to stay compliant.</p>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {records.map((r: any, i: number) => (
              <motion.div key={r.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                className="rounded-xl bg-card p-4 shadow-card border border-border/50 flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-card-foreground">{r.record_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {RECORD_TYPES.find(t => t.value === r.record_type)?.label || r.record_type}
                    {r.expiry_date && ` · Expires ${format(new Date(r.expiry_date), "d MMM yyyy")}`}
                  </p>
                </div>
                <StatusBadge status={r.status} />
                {r.document_url && (
                  <a href={r.document_url} target="_blank" rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline shrink-0">View</a>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}

function UploadCertDialog({ staffId, onClose }: { staffId: string; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    record_type: "first_aid",
    record_name: "First Aid Certificate",
    issue_date: "",
    expiry_date: "",
    notes: "",
  });
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleTypeChange = (type: string) => {
    const label = RECORD_TYPES.find(t => t.value === type)?.label || type;
    setForm({ ...form, record_type: type, record_name: label });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.record_name.trim()) { toast.error("Record name is required"); return; }

    setUploading(true);
    try {
      let documentUrl: string | null = null;

      // Upload file if provided
      if (file) {
        const ext = file.name.split(".").pop();
        const filePath = `${staffId}/${Date.now()}_${form.record_type}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("compliance-docs")
          .upload(filePath, file);
        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("compliance-docs")
          .getPublicUrl(filePath);
        
        // Since bucket is private, generate signed URL
        const { data: signedData, error: signedError } = await supabase.storage
          .from("compliance-docs")
          .createSignedUrl(filePath, 60 * 60 * 24 * 365); // 1 year
        if (signedError) throw signedError;
        documentUrl = signedData.signedUrl;
      }

      // Insert compliance record
      const { error } = await supabase.from("compliance_records").insert({
        staff_id: staffId,
        record_type: form.record_type,
        record_name: form.record_name.trim(),
        issue_date: form.issue_date || null,
        expiry_date: form.expiry_date || null,
        status: "pending",
        notes: form.notes.trim() || null,
        document_url: documentUrl,
      });
      if (error) throw error;

      toast.success("Certificate uploaded for review");
      queryClient.invalidateQueries({ queryKey: ["my-compliance"] });
      onClose();
    } catch (err: any) {
      toast.error(err.message);
    }
    setUploading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-xl bg-card shadow-xl border border-border"
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-lg font-semibold text-card-foreground">Upload Certificate</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Certificate Type</label>
            <select value={form.record_type} onChange={(e) => handleTypeChange(e.target.value)}
              className="w-full h-9 rounded-lg border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
              {RECORD_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Record Name *</label>
            <input type="text" value={form.record_name} onChange={(e) => setForm({ ...form, record_name: e.target.value })}
              className="w-full h-9 rounded-lg border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Issue Date</label>
              <input type="date" value={form.issue_date} onChange={(e) => setForm({ ...form, issue_date: e.target.value })}
                className="w-full h-9 rounded-lg border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Expiry Date</label>
              <input type="date" value={form.expiry_date} onChange={(e) => setForm({ ...form, expiry_date: e.target.value })}
                className="w-full h-9 rounded-lg border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Upload Document</label>
            <label className="flex items-center justify-center gap-2 h-20 rounded-lg border-2 border-dashed bg-background cursor-pointer hover:border-primary/50 transition-colors">
              <input type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" onChange={(e) => setFile(e.target.files?.[0] || null)} className="hidden" />
              {file ? (
                <span className="text-sm text-card-foreground">{file.name}</span>
              ) : (
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <Upload className="h-4 w-4" /> Click to upload (PDF, JPG, PNG)
                </span>
              )}
            </label>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Notes</label>
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Any additional details..." rows={2}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="h-9 px-4 rounded-lg border text-sm font-medium text-foreground hover:bg-secondary transition-colors">Cancel</button>
            <button type="submit" disabled={uploading} className="h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium flex items-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50">
              {uploading && <Loader2 className="h-4 w-4 animate-spin" />} Upload
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
