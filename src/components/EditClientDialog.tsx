import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, X, UserPlus, X as XIcon } from "lucide-react";
import { z } from "zod";
import { useAuth } from "@/contexts/AuthContext";
import { ClientFundingPanel } from "@/components/compliance/ClientFundingPanel";

const clientSchema = z.object({
  first_name: z.string().trim().min(1, "First name is required").max(100),
  last_name: z.string().trim().min(1, "Surname is required").max(100),
  preferred_name: z.string().trim().max(100).optional(),
  email: z.string().trim().email("Invalid email").max(255).optional().or(z.literal("")),
  phone: z.string().trim().max(20).optional(),
  date_of_birth: z.string().optional(),
  address: z.string().trim().max(500).optional(),
  ndis_number: z.string().trim().max(20).optional(),
  ndis_plan_start: z.string().optional(),
  ndis_plan_end: z.string().optional(),
  funding_type: z.enum(["ndis", "aged_care", "chsp", "hvp", "home_care", "private", "other"]).optional(),
  primary_disability: z.string().trim().max(200).optional(),
  support_needs: z.string().trim().max(2000).optional(),
  status: z.enum(["active", "inactive", "pending"]).optional(),
  emergency_contact_name: z.string().trim().max(100).optional(),
  emergency_contact_phone: z.string().trim().max(20).optional(),
  emergency_contact_relationship: z.string().trim().max(50).optional(),
  notes: z.string().trim().max(2000).optional(),
});

type ClientForm = z.infer<typeof clientSchema>;

interface EditClientDialogProps {
  open: boolean;
  onClose: () => void;
  client: any;
}

export function EditClientDialog({ open, onClose, client }: EditClientDialogProps) {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<ClientForm>({} as ClientForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [staffToAssign, setStaffToAssign] = useState("");

  // Fetch all staff for assignment dropdown
  const { data: allStaff = [] } = useQuery({
    queryKey: ["staff-list"],
    queryFn: async () => {
      const { data, error } = await supabase.from("staff").select("id, first_name, last_name").eq("status", "active").order("first_name");
      if (error) throw error;
      return data;
    },
    enabled: open && isAdmin,
  });

  // Fetch current assignments for this client
  const { data: currentAssignments = [] } = useQuery({
    queryKey: ["client-assignments", client?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("client_staff_assignments")
        .select("id, staff_id, staff:staff_id(id, first_name, last_name)")
        .eq("client_id", client.id);
      if (error) throw error;
      return data;
    },
    enabled: open && !!client?.id,
  });

  const assignMutation = useMutation({
    mutationFn: async (staffId: string) => {
      const { error } = await supabase.from("client_staff_assignments").insert({ client_id: client.id, staff_id: staffId });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-assignments", client?.id] });
      queryClient.invalidateQueries({ queryKey: ["client-staff-assignments"] });
      setStaffToAssign("");
      toast.success("Staff assigned");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const unassignMutation = useMutation({
    mutationFn: async (assignmentId: string) => {
      const { error } = await supabase.from("client_staff_assignments").delete().eq("id", assignmentId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-assignments", client?.id] });
      queryClient.invalidateQueries({ queryKey: ["client-staff-assignments"] });
      toast.success("Staff unassigned");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const assignedStaffIds = currentAssignments.map((a: any) => a.staff_id);
  const availableStaff = allStaff.filter((s) => !assignedStaffIds.includes(s.id));

  useEffect(() => {
    if (client) {
      setForm({
        first_name: client.first_name || "",
        last_name: client.last_name || "",
        preferred_name: client.preferred_name || "",
        email: client.email || "",
        phone: client.phone || "",
        date_of_birth: client.date_of_birth || "",
        address: client.address || "",
        ndis_number: client.ndis_number || "",
        ndis_plan_start: client.ndis_plan_start || "",
        ndis_plan_end: client.ndis_plan_end || "",
        funding_type: client.funding_type || "ndis",
        primary_disability: client.primary_disability || "",
        support_needs: client.support_needs || "",
        status: client.status || "active",
        emergency_contact_name: client.emergency_contact_name || "",
        emergency_contact_phone: client.emergency_contact_phone || "",
        emergency_contact_relationship: client.emergency_contact_relationship || "",
        notes: client.notes || "",
      });
      setErrors({});
    }
  }, [client]);

  const isNDIS = form.funding_type === "ndis";
  const isAgedCare = ["aged_care", "chsp", "hvp", "home_care"].includes(form.funding_type || "");

  const mutation = useMutation({
    mutationFn: async (data: ClientForm) => {
      const { error } = await supabase.from("clients").update({
        first_name: data.first_name,
        last_name: data.last_name,
        preferred_name: data.preferred_name || null,
        email: data.email || null,
        phone: data.phone || null,
        date_of_birth: data.date_of_birth || null,
        address: data.address || null,
        ndis_number: data.ndis_number || null,
        ndis_plan_start: data.ndis_plan_start || null,
        ndis_plan_end: data.ndis_plan_end || null,
        funding_type: data.funding_type || null,
        primary_disability: data.primary_disability || null,
        support_needs: data.support_needs || null,
        status: data.status || "active",
        emergency_contact_name: data.emergency_contact_name || null,
        emergency_contact_phone: data.emergency_contact_phone || null,
        emergency_contact_relationship: data.emergency_contact_relationship || null,
        notes: data.notes || null,
      }).eq("id", client.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Client updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      setErrors({});
      onClose();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = clientSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    mutation.mutate(result.data);
  };

  const update = (field: keyof ClientForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  if (!open || !client) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl bg-card shadow-xl border border-border" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-lg font-semibold text-card-foreground">Edit Client</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Client Type</p>
          <div className="grid grid-cols-2 gap-3">
            <SelectField label="Funding Type" value={form.funding_type || "ndis"} onChange={(v) => update("funding_type", v)} options={[
              { value: "ndis", label: "NDIS" },
              { value: "aged_care", label: "Aged Care (HCP)" },
              { value: "chsp", label: "CHSP" },
              { value: "hvp", label: "Home & Veterans" },
              { value: "home_care", label: "Home Care Package" },
              { value: "private", label: "Private" },
              { value: "other", label: "Other" },
            ]} />
            <SelectField label="Status" value={form.status || "active"} onChange={(v) => update("status", v)} options={[
              { value: "active", label: "Active" },
              { value: "inactive", label: "Inactive" },
              { value: "pending", label: "Pending" },
            ]} />
          </div>

          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pt-2">Personal Details</p>
          <div className="grid grid-cols-3 gap-3">
            <Field label="First Name *" value={form.first_name} onChange={(v) => update("first_name", v)} error={errors.first_name} />
            <Field label="Surname *" value={form.last_name} onChange={(v) => update("last_name", v)} error={errors.last_name} />
            <Field label="Preferred Name" value={form.preferred_name || ""} onChange={(v) => update("preferred_name", v)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Email" value={form.email || ""} onChange={(v) => update("email", v)} error={errors.email} type="email" />
            <Field label="Phone" value={form.phone || ""} onChange={(v) => update("phone", v)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Date of Birth" value={form.date_of_birth || ""} onChange={(v) => update("date_of_birth", v)} type="date" />
            <Field label="Address" value={form.address || ""} onChange={(v) => update("address", v)} />
          </div>

          {isNDIS && (
            <>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pt-2">NDIS Details</p>
              <div className="grid grid-cols-2 gap-3">
                <Field label="NDIS Number" value={form.ndis_number || ""} onChange={(v) => update("ndis_number", v)} />
                <Field label="Primary Disability" value={form.primary_disability || ""} onChange={(v) => update("primary_disability", v)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Plan Start" value={form.ndis_plan_start || ""} onChange={(v) => update("ndis_plan_start", v)} type="date" />
                <Field label="Plan End" value={form.ndis_plan_end || ""} onChange={(v) => update("ndis_plan_end", v)} type="date" />
              </div>
            </>
          )}

          {isAgedCare && (
            <>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pt-2">Aged Care Details</p>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Plan Start" value={form.ndis_plan_start || ""} onChange={(v) => update("ndis_plan_start", v)} type="date" />
                <Field label="Plan End" value={form.ndis_plan_end || ""} onChange={(v) => update("ndis_plan_end", v)} type="date" />
              </div>
            </>
          )}

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Support Needs</label>
            <textarea
              value={form.support_needs || ""}
              onChange={(e) => update("support_needs", e.target.value)}
              rows={2}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
          </div>

          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pt-2">Emergency Contact</p>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Name" value={form.emergency_contact_name || ""} onChange={(v) => update("emergency_contact_name", v)} />
            <Field label="Phone" value={form.emergency_contact_phone || ""} onChange={(v) => update("emergency_contact_phone", v)} />
            <Field label="Relationship" value={form.emergency_contact_relationship || ""} onChange={(v) => update("emergency_contact_relationship", v)} />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Notes</label>
            <textarea
              value={form.notes || ""}
              onChange={(e) => update("notes", e.target.value)}
              rows={2}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
          </div>

          {/* Funding & Compliance */}
          {isAdmin && client?.id && (
            <>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pt-2">Funding & Compliance</p>
              <ClientFundingPanel clientId={client.id} clientName={`${form.first_name} ${form.last_name}`} />
            </>
          )}

          {/* Assigned Staff Section */}
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pt-2">Assigned Staff</p>
          {currentAssignments.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {currentAssignments.map((a: any) => (
                <span key={a.id} className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                  {a.staff?.first_name} {a.staff?.last_name}
                  {isAdmin && (
                    <button type="button" onClick={() => unassignMutation.mutate(a.id)} className="hover:text-destructive">
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">No staff assigned</p>
          )}
          {isAdmin && availableStaff.length > 0 && (
            <div className="flex gap-2">
              <select
                value={staffToAssign}
                onChange={(e) => setStaffToAssign(e.target.value)}
                className="flex-1 h-9 rounded-lg border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Select staff to assign...</option>
                {availableStaff.map((s) => (
                  <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>
                ))}
              </select>
              <button
                type="button"
                disabled={!staffToAssign || assignMutation.isPending}
                onClick={() => staffToAssign && assignMutation.mutate(staffToAssign)}
                className="h-9 px-3 rounded-lg bg-primary text-primary-foreground text-sm font-medium flex items-center gap-1 hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                <UserPlus className="h-3.5 w-3.5" /> Assign
              </button>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="h-9 px-4 rounded-lg border text-sm font-medium text-foreground hover:bg-secondary transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={mutation.isPending} className="h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium flex items-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50">
              {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, error, placeholder, type = "text" }: {
  label: string; value: string; onChange: (v: string) => void; error?: string; placeholder?: string; type?: string;
}) {
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full h-9 rounded-lg border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring ${error ? "border-destructive" : ""}`}
      />
      {error && <p className="text-xs text-destructive mt-1">{error}</p>}
    </div>
  );
}

function SelectField({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-9 rounded-lg border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}
