import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Loader2, Pencil, X } from "lucide-react";
import { toast } from "sonner";

const PROGRAMS = [
  { value: "ndis", label: "NDIS" },
  { value: "aged_care", label: "Aged Care" },
  { value: "private", label: "Private" },
];

export function ServiceCategoriesPanel() {
  const queryClient = useQueryClient();
  const [programFilter, setProgramFilter] = useState("ndis");
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ["service-categories", programFilter],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_categories")
        .select("*")
        .eq("funding_program", programFilter)
        .order("category_code");
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-1 rounded-lg bg-secondary/50 p-1">
          {PROGRAMS.map(p => (
            <button
              key={p.value}
              onClick={() => setProgramFilter(p.value)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                programFilter === p.value ? "bg-card text-card-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="h-8 px-3 rounded-lg bg-primary text-primary-foreground text-xs font-medium flex items-center gap-1.5 hover:opacity-90"
        >
          <Plus className="h-3.5 w-3.5" /> Add Category
        </button>
      </div>

      {showAdd && (
        <AddCategoryForm
          program={programFilter}
          onClose={() => setShowAdd(false)}
        />
      )}

      {isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="rounded-xl bg-card shadow-card border border-border/50 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-secondary/50">
                <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Code</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Service Name</th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground">Max Rate</th>
                <th className="text-center px-4 py-2.5 text-xs font-medium text-muted-foreground">GST</th>
                <th className="text-center px-4 py-2.5 text-xs font-medium text-muted-foreground">Active</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat: any) => (
                <tr key={cat.id} className="border-b last:border-0 hover:bg-secondary/30 transition-colors">
                  <td className="px-4 py-2.5 text-xs font-mono text-muted-foreground">{cat.category_code}</td>
                  <td className="px-4 py-2.5">
                    <p className="text-xs font-medium text-card-foreground">{cat.category_name}</p>
                    {cat.description && <p className="text-[10px] text-muted-foreground truncate max-w-[200px]">{cat.description}</p>}
                  </td>
                  <td className="px-4 py-2.5 text-xs text-right text-card-foreground">
                    {cat.max_rate ? `$${Number(cat.max_rate).toFixed(2)}` : "—"}
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${cat.gst_applicable ? "bg-warning/10 text-warning" : "bg-muted text-muted-foreground"}`}>
                      {cat.gst_applicable ? "Yes" : "No"}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${cat.is_active ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>
                      {cat.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                </tr>
              ))}
              {categories.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-muted-foreground">
                    No service categories for this program.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function AddCategoryForm({ program, onClose }: { program: string; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    category_code: "",
    category_name: "",
    description: "",
    max_rate: "",
    gst_applicable: false,
  });

  const mutation = useMutation({
    mutationFn: async () => {
      if (!form.category_code.trim() || !form.category_name.trim()) throw new Error("Code and name required");
      const { error } = await supabase.from("service_categories").insert({
        funding_program: program,
        category_code: form.category_code.trim().toUpperCase(),
        category_name: form.category_name.trim(),
        description: form.description.trim() || null,
        max_rate: form.max_rate ? parseFloat(form.max_rate) : null,
        gst_applicable: form.gst_applicable,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service-categories"] });
      toast.success("Category added");
      onClose();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-card-foreground">New Service Category</p>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] font-medium text-muted-foreground">Category Code *</label>
          <input value={form.category_code} onChange={e => setForm({ ...form, category_code: e.target.value })}
            className="mt-1 w-full h-8 px-2 rounded border bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring" placeholder="CORE_DAILY" />
        </div>
        <div>
          <label className="text-[10px] font-medium text-muted-foreground">Service Name *</label>
          <input value={form.category_name} onChange={e => setForm({ ...form, category_name: e.target.value })}
            className="mt-1 w-full h-8 px-2 rounded border bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring" placeholder="Daily Living Support" />
        </div>
        <div>
          <label className="text-[10px] font-medium text-muted-foreground">Max Rate ($)</label>
          <input value={form.max_rate} onChange={e => setForm({ ...form, max_rate: e.target.value })} type="number" step="0.01"
            className="mt-1 w-full h-8 px-2 rounded border bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring" />
        </div>
        <div className="flex items-end gap-2 pb-1">
          <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
            <input type="checkbox" checked={form.gst_applicable} onChange={e => setForm({ ...form, gst_applicable: e.target.checked })}
              className="rounded border-muted-foreground/30" />
            GST Applicable
          </label>
        </div>
      </div>
      <div>
        <label className="text-[10px] font-medium text-muted-foreground">Description</label>
        <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
          className="mt-1 w-full h-8 px-2 rounded border bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring" />
      </div>
      <button onClick={() => mutation.mutate()} disabled={mutation.isPending}
        className="h-8 px-4 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 disabled:opacity-50 flex items-center gap-1.5">
        {mutation.isPending && <Loader2 className="h-3 w-3 animate-spin" />} Add Category
      </button>
    </div>
  );
}
