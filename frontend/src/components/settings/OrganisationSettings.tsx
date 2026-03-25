import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Save, Building2 } from "lucide-react";
import { motion } from "framer-motion";

const FIELDS = [
  { key: "company_name", label: "Company Name", placeholder: "Carters Care Group" },
  { key: "abn", label: "ABN", placeholder: "12 345 678 901" },
  { key: "phone", label: "Phone", placeholder: "08 1234 5678" },
  { key: "email", label: "Email", placeholder: "admin@carterscare.com.au" },
  { key: "address", label: "Address", placeholder: "123 Main St, Perth WA 6000" },
  { key: "website", label: "Website", placeholder: "https://carterscare.com.au" },
];

export function OrganisationSettings() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<Record<string, string>>({});
  const [dirty, setDirty] = useState(false);

  const { data: settings = [], isLoading } = useQuery({
    queryKey: ["org-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("organisation_settings")
        .select("*")
        .in("key", FIELDS.map((f) => f.key));
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
      toast.success("Organisation details saved");
      queryClient.invalidateQueries({ queryKey: ["org-settings"] });
      setDirty(false);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(form);
  };

  if (isLoading) {
    return <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="rounded-xl bg-card p-6 shadow-card border border-border/50 space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-card-foreground">Company Details</h3>
              <p className="text-xs text-muted-foreground">Update your organisation's information</p>
            </div>
          </div>

          {FIELDS.map((f) => (
            <div key={f.key}>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{f.label}</label>
              <input
                type="text"
                value={form[f.key] || ""}
                onChange={(e) => { setForm({ ...form, [f.key]: e.target.value }); setDirty(true); }}
                placeholder={f.placeholder}
                className="w-full h-9 rounded-lg border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          ))}
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={!dirty || mutation.isPending}
            className="h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium flex items-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Changes
          </button>
        </div>
      </form>
    </motion.div>
  );
}
