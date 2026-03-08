import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, X } from "lucide-react";
import { z } from "zod";

const staffSchema = z.object({
  first_name: z.string().trim().min(1, "First name is required").max(100),
  last_name: z.string().trim().min(1, "Surname is required").max(100),
  preferred_name: z.string().trim().max(100).optional(),
  email: z.string().trim().email("Invalid email address").max(255),
  phone: z.string().trim().max(20).optional(),
  role: z.enum(["support_worker", "team_leader", "coordinator", "admin"]),
  employment_type: z.enum(["full_time", "part_time", "casual", "contractor"]),
  start_date: z.string().optional(),
  address: z.string().trim().max(500).optional(),
  emergency_contact_name: z.string().trim().max(100).optional(),
  emergency_contact_phone: z.string().trim().max(20).optional(),
  notes: z.string().trim().max(2000).optional(),
});

type StaffForm = z.infer<typeof staffSchema>;

const emptyForm: StaffForm = {
  first_name: "",
  last_name: "",
  preferred_name: "",
  email: "",
  phone: "",
  role: "support_worker",
  employment_type: "casual",
  start_date: "",
  address: "",
  emergency_contact_name: "",
  emergency_contact_phone: "",
  notes: "",
};

interface AddStaffDialogProps {
  open: boolean;
  onClose: () => void;
}

export function AddStaffDialog({ open, onClose }: AddStaffDialogProps) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<StaffForm>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const mutation = useMutation({
    mutationFn: async (data: StaffForm) => {
      const { error } = await supabase.from("staff").insert({
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
        phone: data.phone || null,
        role: data.role,
        employment_type: data.employment_type,
        start_date: data.start_date || null,
        address: data.address || null,
        emergency_contact_name: data.emergency_contact_name || null,
        emergency_contact_phone: data.emergency_contact_phone || null,
        notes: data.notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Staff member added successfully!");
      queryClient.invalidateQueries({ queryKey: ["staff"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-staff-count"] });
      setForm(emptyForm);
      setErrors({});
      onClose();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = staffSchema.safeParse(form);
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

  const update = (field: keyof StaffForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl bg-card shadow-xl border border-border" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-lg font-semibold text-card-foreground">Add Staff Member</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="First Name *" value={form.first_name} onChange={(v) => update("first_name", v)} error={errors.first_name} placeholder="Sarah" />
            <Field label="Last Name *" value={form.last_name} onChange={(v) => update("last_name", v)} error={errors.last_name} placeholder="Mitchell" />
          </div>

          <Field label="Email *" value={form.email} onChange={(v) => update("email", v)} error={errors.email} placeholder="sarah@example.com" type="email" />

          <Field label="Phone" value={form.phone || ""} onChange={(v) => update("phone", v)} error={errors.phone} placeholder="0412 345 678" />

          <div className="grid grid-cols-2 gap-3">
            <SelectField label="Role" value={form.role} onChange={(v) => update("role", v)} options={[
              { value: "support_worker", label: "Support Worker" },
              { value: "team_leader", label: "Team Leader" },
              { value: "coordinator", label: "Coordinator" },
              { value: "admin", label: "Admin" },
            ]} />
            <SelectField label="Employment Type" value={form.employment_type} onChange={(v) => update("employment_type", v)} options={[
              { value: "full_time", label: "Full-time" },
              { value: "part_time", label: "Part-time" },
              { value: "casual", label: "Casual" },
              { value: "contractor", label: "Contractor" },
            ]} />
          </div>

          <Field label="Start Date" value={form.start_date || ""} onChange={(v) => update("start_date", v)} type="date" />

          <Field label="Address" value={form.address || ""} onChange={(v) => update("address", v)} placeholder="123 Main St, Perth WA" />

          <div className="grid grid-cols-2 gap-3">
            <Field label="Emergency Contact" value={form.emergency_contact_name || ""} onChange={(v) => update("emergency_contact_name", v)} placeholder="Name" />
            <Field label="Emergency Phone" value={form.emergency_contact_phone || ""} onChange={(v) => update("emergency_contact_phone", v)} placeholder="0412 345 678" />
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
              Add Staff
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
