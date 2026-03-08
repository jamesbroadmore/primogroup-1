import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, X } from "lucide-react";
import { z } from "zod";

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
  funding_type: z.enum(["ndis", "home_care", "private", "other"]).optional(),
  primary_disability: z.string().trim().max(200).optional(),
  support_needs: z.string().trim().max(2000).optional(),
  emergency_contact_name: z.string().trim().max(100).optional(),
  emergency_contact_phone: z.string().trim().max(20).optional(),
  emergency_contact_relationship: z.string().trim().max(50).optional(),
  notes: z.string().trim().max(2000).optional(),
});

type ClientForm = z.infer<typeof clientSchema>;

const emptyForm: ClientForm = {
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  date_of_birth: "",
  address: "",
  ndis_number: "",
  ndis_plan_start: "",
  ndis_plan_end: "",
  funding_type: "ndis",
  primary_disability: "",
  support_needs: "",
  emergency_contact_name: "",
  emergency_contact_phone: "",
  emergency_contact_relationship: "",
  notes: "",
};

interface AddClientDialogProps {
  open: boolean;
  onClose: () => void;
}

export function AddClientDialog({ open, onClose }: AddClientDialogProps) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<ClientForm>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const mutation = useMutation({
    mutationFn: async (data: ClientForm) => {
      const { error } = await supabase.from("clients").insert({
        first_name: data.first_name,
        last_name: data.last_name,
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
        emergency_contact_name: data.emergency_contact_name || null,
        emergency_contact_phone: data.emergency_contact_phone || null,
        emergency_contact_relationship: data.emergency_contact_relationship || null,
        notes: data.notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Client added successfully!");
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-client-count"] });
      setForm(emptyForm);
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

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl bg-card shadow-xl border border-border" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-lg font-semibold text-card-foreground">Add Client</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Personal Details */}
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Personal Details</p>
          <div className="grid grid-cols-2 gap-3">
            <Field label="First Name *" value={form.first_name} onChange={(v) => update("first_name", v)} error={errors.first_name} placeholder="Maria" />
            <Field label="Last Name *" value={form.last_name} onChange={(v) => update("last_name", v)} error={errors.last_name} placeholder="Torres" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Email" value={form.email || ""} onChange={(v) => update("email", v)} error={errors.email} placeholder="maria@example.com" type="email" />
            <Field label="Phone" value={form.phone || ""} onChange={(v) => update("phone", v)} placeholder="0412 345 678" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Date of Birth" value={form.date_of_birth || ""} onChange={(v) => update("date_of_birth", v)} type="date" />
            <Field label="Address" value={form.address || ""} onChange={(v) => update("address", v)} placeholder="123 Main St" />
          </div>

          {/* NDIS Details */}
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pt-2">NDIS & Funding</p>
          <div className="grid grid-cols-2 gap-3">
            <Field label="NDIS Number" value={form.ndis_number || ""} onChange={(v) => update("ndis_number", v)} placeholder="431 234 567" />
            <SelectField label="Funding Type" value={form.funding_type || "ndis"} onChange={(v) => update("funding_type", v)} options={[
              { value: "ndis", label: "NDIS" },
              { value: "home_care", label: "Home Care" },
              { value: "private", label: "Private" },
              { value: "other", label: "Other" },
            ]} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Plan Start" value={form.ndis_plan_start || ""} onChange={(v) => update("ndis_plan_start", v)} type="date" />
            <Field label="Plan End" value={form.ndis_plan_end || ""} onChange={(v) => update("ndis_plan_end", v)} type="date" />
          </div>

          <Field label="Primary Disability" value={form.primary_disability || ""} onChange={(v) => update("primary_disability", v)} placeholder="e.g. Intellectual Disability" />

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Support Needs</label>
            <textarea
              value={form.support_needs || ""}
              onChange={(e) => update("support_needs", e.target.value)}
              placeholder="Describe support requirements..."
              rows={2}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
          </div>

          {/* Emergency Contact */}
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pt-2">Emergency Contact</p>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Name" value={form.emergency_contact_name || ""} onChange={(v) => update("emergency_contact_name", v)} placeholder="John Torres" />
            <Field label="Phone" value={form.emergency_contact_phone || ""} onChange={(v) => update("emergency_contact_phone", v)} placeholder="0412 345 678" />
            <Field label="Relationship" value={form.emergency_contact_relationship || ""} onChange={(v) => update("emergency_contact_relationship", v)} placeholder="Father" />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Notes</label>
            <textarea
              value={form.notes || ""}
              onChange={(e) => update("notes", e.target.value)}
              placeholder="Any additional notes..."
              rows={2}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="h-9 px-4 rounded-lg border text-sm font-medium text-foreground hover:bg-secondary transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={mutation.isPending} className="h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium flex items-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50">
              {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Add Client
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
