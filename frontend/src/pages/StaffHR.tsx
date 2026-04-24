import { useState, useRef } from "react";
import { AppLayout } from "@/components/AppLayout";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Briefcase, FileText, Users, GraduationCap, Upload, CheckCircle,
  Clock, AlertTriangle, ChevronRight, ChevronDown, X, Loader2,
  Eye, Download, Trash2, Plus, Calendar,
} from "lucide-react";
import { SearchInput, PrimaryButton, EmptyState, DialogOverlay, DialogHeader } from "@/components/ui-kit";
import { format, addMonths } from "date-fns";

const HR_DOC_TYPES = [
  { key: "contract", label: "Employment Contract", icon: FileText, color: "purple" },
  { key: "police_check", label: "Police Check", icon: CheckCircle, color: "blue" },
  { key: "wwcc", label: "WWCC", icon: CheckCircle, color: "teal" },
  { key: "first_aid", label: "First Aid Certificate", icon: GraduationCap, color: "green" },
  { key: "ndis_screening", label: "NDIS Worker Screening", icon: CheckCircle, color: "purple" },
  { key: "driver_license", label: "Driver's License", icon: FileText, color: "blue" },
  { key: "qualifications", label: "Qualifications", icon: GraduationCap, color: "pink" },
  { key: "visa", label: "Visa/Work Rights", icon: FileText, color: "orange" },
];

export default function StaffHR() {
  const [search, setSearch] = useState("");
  const [selectedStaff, setSelectedStaff] = useState<any>(null);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [uploadDocType, setUploadDocType] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: staffData = [], isLoading } = useQuery({
    queryKey: ["staff-hr"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("staff")
        .select("*")
        .eq("status", "active")
        .order("first_name");
      if (error) throw error;
      return data;
    },
  });

  const { data: complianceData = [], refetch: refetchCompliance } = useQuery({
    queryKey: ["staff-compliance-records"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("compliance_records")
        .select("*")
        .order("expiry_date");
      if (error) throw error;
      return data;
    },
  });

  const filteredStaff = staffData.filter((s: any) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      s.first_name?.toLowerCase().includes(q) ||
      s.last_name?.toLowerCase().includes(q) ||
      s.email?.toLowerCase().includes(q)
    );
  });

  const getStaffDocStatus = (staffId: string) => {
    const docs = complianceData.filter((c: any) => c.staff_id === staffId);
    const expired = docs.filter((d: any) => d.status === "expired").length;
    const expiring = docs.filter((d: any) => d.status === "expiring_soon").length;
    const valid = docs.filter((d: any) => d.status === "valid").length;
    return { expired, expiring, valid, total: docs.length, docs };
  };

  const getStaffDocs = (staffId: string) => {
    return complianceData.filter((c: any) => c.staff_id === staffId);
  };

  const handleUploadClick = (staff: any, docType?: string) => {
    setSelectedStaff(staff);
    setUploadDocType(docType || null);
    setShowUploadDialog(true);
  };

  return (
    <AppLayout title="HR & Onboarding">
      <div className="space-y-5">
        {/* Header Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl bg-white border border-border/50 shadow-sm p-4 flex items-center gap-3"
          >
            <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm icon-blue">
              <Users className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-xl font-bold text-foreground">{staffData.length}</p>
              <p className="text-xs text-muted-foreground">Total Staff</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="rounded-2xl bg-white border border-border/50 shadow-sm p-4 flex items-center gap-3"
          >
            <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm icon-green">
              <CheckCircle className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-xl font-bold text-foreground">
                {complianceData.filter((c: any) => c.status === "valid").length}
              </p>
              <p className="text-xs text-muted-foreground">Valid Docs</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl bg-white border border-border/50 shadow-sm p-4 flex items-center gap-3"
          >
            <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm icon-orange">
              <Clock className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-xl font-bold text-foreground">
                {complianceData.filter((c: any) => c.status === "expiring_soon").length}
              </p>
              <p className="text-xs text-muted-foreground">Expiring Soon</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="rounded-2xl bg-white border border-border/50 shadow-sm p-4 flex items-center gap-3"
          >
            <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm" style={{ background: "linear-gradient(135deg, #f87171, #ef4444)" }}>
              <AlertTriangle className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-xl font-bold text-foreground">
                {complianceData.filter((c: any) => c.status === "expired").length}
              </p>
              <p className="text-xs text-muted-foreground">Expired</p>
            </div>
          </motion.div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search staff..."
            className="w-full sm:w-72"
          />
        </div>

        {/* Staff List with Document Status */}
        <div className="bg-white rounded-2xl border border-border/50 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-border/50">
            <h3 className="font-semibold text-foreground">Staff HR Documents</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Click on a staff member to manage their documents</p>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="h-8 w-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredStaff.length === 0 ? (
            <EmptyState
              icon={<Users className="h-10 w-10 text-slate-300" />}
              title="No staff found"
              description="Add staff members or adjust your search."
            />
          ) : (
            <div className="divide-y divide-border/50">
              {filteredStaff.map((staff: any) => {
                const docStatus = getStaffDocStatus(staff.id);
                const isExpanded = selectedStaff?.id === staff.id;
                const staffDocs = getStaffDocs(staff.id);

                return (
                  <div key={staff.id}>
                    <button
                      onClick={() => setSelectedStaff(isExpanded ? null : staff)}
                      className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="h-10 w-10 rounded-full flex items-center justify-center text-white text-sm font-bold"
                          style={{ background: "linear-gradient(135deg, #a78bfa, #8b5cf6)" }}
                        >
                          {staff.first_name?.[0]}{staff.last_name?.[0]}
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">
                            {staff.preferred_name || staff.first_name} {staff.last_name}
                          </p>
                          <p className="text-xs text-muted-foreground">{staff.email}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          {docStatus.expired > 0 && (
                            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                              {docStatus.expired} expired
                            </span>
                          )}
                          {docStatus.expiring > 0 && (
                            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">
                              {docStatus.expiring} expiring
                            </span>
                          )}
                          {docStatus.valid > 0 && (
                            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                              {docStatus.valid} valid
                            </span>
                          )}
                        </div>
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4 text-slate-400" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-slate-400" />
                        )}
                      </div>
                    </button>

                    {/* Expanded Document List */}
                    {isExpanded && (
                      <div className="bg-slate-50 border-t border-border/50 p-4">
                        <div className="flex items-center justify-between mb-4">
                          <p className="text-sm font-semibold text-foreground">Documents for {staff.preferred_name || staff.first_name}</p>
                          <button
                            onClick={() => handleUploadClick(staff)}
                            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-purple-100 text-purple-600 hover:bg-purple-200 transition-colors flex items-center gap-1"
                            data-testid="staff-hr-upload-document-btn"
                          >
                            <Upload className="h-3 w-3" /> Upload Document
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {HR_DOC_TYPES.map((docType) => {
                            const existingDoc = staffDocs.find((d: any) => d.record_type === docType.key);
                            const statusColor = existingDoc?.status === "valid" 
                              ? "border-emerald-200 bg-emerald-50" 
                              : existingDoc?.status === "expiring_soon"
                                ? "border-orange-200 bg-orange-50"
                                : existingDoc?.status === "expired"
                                  ? "border-red-200 bg-red-50"
                                  : "border-slate-200 bg-white";

                            return (
                              <div
                                key={docType.key}
                                className={`rounded-xl border p-3 ${statusColor}`}
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex items-start gap-2">
                                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center icon-${docType.color}`}>
                                      <docType.icon className="h-4 w-4 text-white" />
                                    </div>
                                    <div>
                                      <p className="text-sm font-medium text-foreground">{docType.label}</p>
                                      {existingDoc ? (
                                        <div className="flex items-center gap-2 mt-1">
                                          <span className={`text-xs ${
                                            existingDoc.status === "valid" ? "text-emerald-600" :
                                            existingDoc.status === "expiring_soon" ? "text-orange-600" :
                                            "text-red-600"
                                          }`}>
                                            {existingDoc.status === "valid" ? "Valid" : 
                                             existingDoc.status === "expiring_soon" ? "Expiring Soon" : "Expired"}
                                          </span>
                                          {existingDoc.expiry_date && (
                                            <span className="text-xs text-muted-foreground">
                                              • Exp: {format(new Date(existingDoc.expiry_date), "d MMM yyyy")}
                                            </span>
                                          )}
                                        </div>
                                      ) : (
                                        <p className="text-xs text-muted-foreground mt-1">Not uploaded</p>
                                      )}
                                    </div>
                                  </div>
                                  
                                  <div className="flex items-center gap-1">
                                    {existingDoc ? (
                                      <>
                                        {existingDoc.document_url && (
                                          <button
                                            onClick={() => window.open(existingDoc.document_url, "_blank")}
                                            className="h-7 w-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-white/80 transition-colors"
                                            title="View Document"
                                          >
                                            <Eye className="h-3.5 w-3.5" />
                                          </button>
                                        )}
                                        <button
                                          onClick={() => handleUploadClick(staff, docType.key)}
                                          className="h-7 w-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-purple-600 hover:bg-white/80 transition-colors"
                                          title="Update Document"
                                        >
                                          <Upload className="h-3.5 w-3.5" />
                                        </button>
                                      </>
                                    ) : (
                                      <button
                                        onClick={() => handleUploadClick(staff, docType.key)}
                                        className="text-xs font-medium px-2 py-1 rounded-lg bg-purple-100 text-purple-600 hover:bg-purple-200 transition-colors flex items-center gap-1"
                                      >
                                        <Plus className="h-3 w-3" /> Add
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {showUploadDialog && selectedStaff && (
        <DocumentUploadDialog
          staff={selectedStaff}
          docType={uploadDocType}
          onClose={() => {
            setShowUploadDialog(false);
            setUploadDocType(null);
          }}
          onSuccess={() => {
            refetchCompliance();
            setShowUploadDialog(false);
            setUploadDocType(null);
          }}
        />
      )}
    </AppLayout>
  );
}

function DocumentUploadDialog({ 
  staff, 
  docType, 
  onClose, 
  onSuccess 
}: { 
  staff: any; 
  docType: string | null; 
  onClose: () => void; 
  onSuccess: () => void;
}) {
  const [selectedDocType, setSelectedDocType] = useState(docType || "");
  const [expiryDate, setExpiryDate] = useState(format(addMonths(new Date(), 12), "yyyy-MM-dd"));
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [documentNumber, setDocumentNumber] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.size > 10 * 1024 * 1024) {
        toast.error("File size must be less than 10MB");
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!selectedDocType) {
      toast.error("Please select a document type");
      return;
    }

    setIsUploading(true);

    try {
      let documentUrl = null;

      // If file is selected, upload to Supabase storage
      if (file) {
        const fileName = `${staff.id}/${selectedDocType}_${Date.now()}_${file.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("hr-documents")
          .upload(fileName, file);

        if (uploadError) {
          // If bucket doesn't exist, create a record without file URL
          console.warn("Storage upload failed:", uploadError);
          toast.info("Document record created. File storage not configured.");
        } else {
          const { data: urlData } = supabase.storage
            .from("hr-documents")
            .getPublicUrl(uploadData.path);
          documentUrl = urlData.publicUrl;
        }
      }

      // Create compliance record - using existing schema fields with fallback
      const docLabel = HR_DOC_TYPES.find(d => d.key === selectedDocType)?.label || selectedDocType;
      const { error } = await supabase.from("compliance_records").insert({
        staff_id: staff.id,
        record_type: selectedDocType,
        record_name: docLabel,
        document_url: documentUrl,
        expiry_date: expiryDate,
        status: "valid",
        notes: documentNumber ? `Document #: ${documentNumber}` : null,
      });

      if (error) throw error;

      toast.success("Document uploaded successfully");
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || "Failed to upload document");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <DialogOverlay onClose={onClose}>
      <DialogHeader 
        title={`Upload Document for ${staff.preferred_name || staff.first_name}`} 
        onClose={onClose} 
        gradient="linear-gradient(90deg, #a78bfa, #8b5cf6)" 
      />
      <div className="p-6 space-y-4">
        <div>
          <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2 block">Document Type *</label>
          <select
            value={selectedDocType}
            onChange={(e) => setSelectedDocType(e.target.value)}
            disabled={!!docType}
            className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 disabled:opacity-60"
            data-testid="upload-dialog-doc-type-select"
          >
            <option value="">Select document type...</option>
            {HR_DOC_TYPES.map((d) => (
              <option key={d.key} value={d.key}>{d.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2 block">Document Number (optional)</label>
          <input
            type="text"
            value={documentNumber}
            onChange={(e) => setDocumentNumber(e.target.value)}
            placeholder="e.g., License number, Certificate ID"
            className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2 block">Expiry Date *</label>
          <input
            type="date"
            value={expiryDate}
            onChange={(e) => setExpiryDate(e.target.value)}
            className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
            data-testid="upload-dialog-expiry-date-input"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2 block">Upload File (optional)</label>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
            onChange={handleFileSelect}
            className="hidden"
            data-testid="upload-dialog-file-input"
          />
          
          {file ? (
            <div className="flex items-center justify-between p-3 rounded-xl border border-purple-200 bg-purple-50">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-purple-500" />
                <div>
                  <p className="text-sm font-medium text-foreground">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
              </div>
              <button
                onClick={() => setFile(null)}
                className="h-7 w-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-24 rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-2 hover:border-purple-300 hover:bg-purple-50/50 transition-colors"
            >
              <Upload className="h-6 w-6 text-slate-400" />
              <p className="text-sm text-muted-foreground">Click to upload or drag and drop</p>
              <p className="text-xs text-slate-400">PDF, JPG, PNG, DOC up to 10MB</p>
            </button>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="h-10 px-4 rounded-xl border text-sm font-medium text-foreground hover:bg-secondary transition-colors">
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={!selectedDocType || isUploading}
            className="h-10 px-5 rounded-xl text-white text-sm font-bold flex items-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50 shadow-md"
            style={{ background: "linear-gradient(135deg, #a78bfa, #8b5cf6)" }}
            data-testid="upload-dialog-submit-btn"
          >
            {isUploading && <Loader2 className="h-4 w-4 animate-spin" />}
            <Upload className="h-4 w-4" /> Upload Document
          </button>
        </div>
      </div>
    </DialogOverlay>
  );
}
