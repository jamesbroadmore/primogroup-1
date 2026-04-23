import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Briefcase, FileText, Users, GraduationCap, Upload, CheckCircle,
  Clock, AlertTriangle, ChevronRight, Search, Filter,
} from "lucide-react";
import { SearchInput, PrimaryButton, StatusBadge, EmptyState } from "@/components/ui-kit";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const HR_DOC_TYPES = [
  { key: "contract", label: "Employment Contract", icon: FileText },
  { key: "police_check", label: "Police Check", icon: CheckCircle },
  { key: "wwcc", label: "WWCC", icon: CheckCircle },
  { key: "first_aid", label: "First Aid Certificate", icon: GraduationCap },
  { key: "ndis_screening", label: "NDIS Worker Screening", icon: CheckCircle },
  { key: "driver_license", label: "Driver's License", icon: FileText },
  { key: "qualifications", label: "Qualifications", icon: GraduationCap },
  { key: "visa", label: "Visa/Work Rights", icon: FileText },
];

export default function StaffHR() {
  const [search, setSearch] = useState("");
  const [selectedStaff, setSelectedStaff] = useState<string | null>(null);

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

  const { data: complianceData = [] } = useQuery({
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
    return { expired, expiring, valid, total: docs.length };
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
          <PrimaryButton variant="purple">
            <Upload className="h-4 w-4 mr-2" />
            Bulk Upload
          </PrimaryButton>
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
                return (
                  <button
                    key={staff.id}
                    onClick={() => setSelectedStaff(selectedStaff === staff.id ? null : staff.id)}
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
                      <ChevronRight className={`h-4 w-4 text-slate-400 transition-transform ${selectedStaff === staff.id ? "rotate-90" : ""}`} />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Document Types Reference */}
        <div className="bg-white rounded-2xl border border-border/50 shadow-sm p-4">
          <h3 className="font-semibold text-foreground mb-3">Required HR Documents</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {HR_DOC_TYPES.map((doc) => (
              <div
                key={doc.key}
                className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-100"
              >
                <doc.icon className="h-4 w-4 text-slate-500" />
                <span className="text-xs font-medium text-slate-600">{doc.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
