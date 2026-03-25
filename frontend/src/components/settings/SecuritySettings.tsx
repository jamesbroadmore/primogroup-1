import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Check, Shield } from "lucide-react";
import { motion } from "framer-motion";

const ROLES = [
  { key: "admin", label: "Admin", desc: "Full system access" },
  { key: "moderator", label: "Manager / Team Leader", desc: "Manage staff and clients" },
  { key: "user", label: "Support Worker", desc: "Day-to-day operations" },
];

const RESOURCES = [
  { key: "staff", label: "Staff Management" },
  { key: "clients", label: "Clients" },
  { key: "timesheets", label: "Timesheets" },
  { key: "case_notes", label: "Case Notes" },
  { key: "incidents", label: "Incidents" },
  { key: "compliance", label: "Compliance" },
  { key: "financials", label: "Financials" },
  { key: "reports", label: "Reports" },
  { key: "settings", label: "Settings" },
];

const ACTIONS = [
  { key: "can_view", label: "View" },
  { key: "can_create", label: "Create" },
  { key: "can_edit", label: "Edit" },
  { key: "can_delete", label: "Delete" },
];

type Permission = {
  id: string;
  role: string;
  resource: string;
  can_view: boolean;
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
};

export function SecuritySettings() {
  const queryClient = useQueryClient();
  const [selectedRole, setSelectedRole] = useState("user");

  const { data: permissions = [], isLoading } = useQuery({
    queryKey: ["role-permissions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("role_permissions")
        .select("*")
        .order("role")
        .order("resource");
      if (error) throw error;
      return data as Permission[];
    },
  });

  const mutation = useMutation({
    mutationFn: async ({ id, field, value }: { id: string; field: string; value: boolean }) => {
      const { error } = await supabase
        .from("role_permissions")
        .update({ [field]: value, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["role-permissions"] });
      toast.success("Permission updated");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const rolePerms = permissions.filter((p) => p.role === selectedRole);
  const isAdmin = selectedRole === "admin";

  const togglePerm = (perm: Permission, field: string) => {
    if (isAdmin) return; // Admin permissions are locked
    const current = perm[field as keyof Permission] as boolean;
    mutation.mutate({ id: perm.id, field, value: !current });
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Role selector */}
      <div className="flex flex-wrap gap-2">
        {ROLES.map((r) => (
          <button
            key={r.key}
            onClick={() => setSelectedRole(r.key)}
            className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all border ${
              selectedRole === r.key
                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                : "bg-card text-card-foreground border-border hover:bg-secondary/50"
            }`}
          >
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span>{r.label}</span>
            </div>
          </button>
        ))}
      </div>

      <p className="text-xs text-muted-foreground">
        {ROLES.find((r) => r.key === selectedRole)?.desc}
        {isAdmin && " — Admin permissions cannot be modified."}
      </p>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl bg-card shadow-card border border-border/50 overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-secondary/50">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Resource</th>
                  {ACTIONS.map((a) => (
                    <th key={a.key} className="text-center px-4 py-3 font-medium text-muted-foreground w-20">
                      {a.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {RESOURCES.map((res) => {
                  const perm = rolePerms.find((p) => p.resource === res.key);
                  return (
                    <tr key={res.key} className="border-b last:border-0 hover:bg-secondary/20 transition-colors">
                      <td className="px-4 py-3 font-medium text-card-foreground">{res.label}</td>
                      {ACTIONS.map((action) => {
                        const enabled = perm ? (perm[action.key as keyof Permission] as boolean) : false;
                        return (
                          <td key={action.key} className="text-center px-4 py-3">
                            <button
                              onClick={() => perm && togglePerm(perm, action.key)}
                              disabled={isAdmin || mutation.isPending}
                              className={`h-8 w-8 rounded-md border inline-flex items-center justify-center transition-all ${
                                isAdmin
                                  ? "bg-primary/20 border-primary/30 cursor-not-allowed"
                                  : enabled
                                  ? "bg-primary border-primary text-primary-foreground hover:opacity-80"
                                  : "bg-background border-border hover:border-primary/50"
                              }`}
                            >
                              {enabled && <Check className="h-4 w-4" />}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </div>
  );
}
