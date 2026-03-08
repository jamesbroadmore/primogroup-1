import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Plus, FileText, Loader2, CheckCircle, Clock, Send, Eye, Pencil } from "lucide-react";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { CreateInvoiceDialog } from "@/components/invoices/CreateInvoiceDialog";
import { ViewInvoiceDialog } from "@/components/invoices/ViewInvoiceDialog";
import { EditInvoiceDialog } from "@/components/invoices/EditInvoiceDialog";

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  submitted: "bg-warning/10 text-warning",
  approved: "bg-success/10 text-success",
  paid: "bg-info/10 text-info",
  rejected: "bg-destructive/10 text-destructive",
};

const STATUS_ICONS: Record<string, any> = {
  draft: Clock,
  submitted: Send,
  approved: CheckCircle,
  paid: CheckCircle,
  rejected: Clock,
};

export default function Invoices() {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [viewInvoice, setViewInvoice] = useState<any>(null);
  const [editInvoice, setEditInvoice] = useState<any>(null);

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ["invoices"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invoices")
        .select("*, staff:staff_id(first_name, last_name, employment_type)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const submitMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("invoices")
        .update({ status: "submitted" })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Invoice submitted");
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("invoices")
        .update({ status })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Invoice updated");
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <AppLayout title="Invoices">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{invoices.length} invoices</p>
          <button
            onClick={() => setShowCreate(true)}
            className="h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium flex items-center gap-2 hover:opacity-90 transition-opacity"
          >
            <Plus className="h-4 w-4" /> New Invoice
          </button>
        </div>

        <CreateInvoiceDialog open={showCreate} onClose={() => setShowCreate(false)} />
        {editInvoice && (
          <EditInvoiceDialog
            open={!!editInvoice}
            onClose={() => setEditInvoice(null)}
            invoiceId={editInvoice.id}
          />
        )}
        {viewInvoice && (
          <ViewInvoiceDialog
            open={!!viewInvoice}
            onClose={() => setViewInvoice(null)}
            invoiceId={viewInvoice.id}
            isAdmin={isAdmin}
            onStatusChange={(status) => statusMutation.mutate({ id: viewInvoice.id, status })}
          />
        )}

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : invoices.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl bg-card p-12 shadow-card border border-border/50 text-center">
            <FileText className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">No invoices yet. Create one from your approved timesheets.</p>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl bg-card shadow-card border border-border/50 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-secondary/50">
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Invoice #</th>
                    {isAdmin && <th className="text-left px-4 py-3 font-medium text-muted-foreground">Staff</th>}
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Date</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Total</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv: any) => {
                    const Icon = STATUS_ICONS[inv.status] || Clock;
                    return (
                      <tr key={inv.id} className="border-b last:border-0 hover:bg-secondary/30 transition-colors">
                        <td className="px-4 py-3 font-medium text-card-foreground">{inv.invoice_number}</td>
                        {isAdmin && (
                          <td className="px-4 py-3 text-muted-foreground">
                            {inv.staff ? `${inv.staff.first_name} ${inv.staff.last_name}` : "—"}
                          </td>
                        )}
                        <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                          {format(new Date(inv.invoice_date), "MMM d, yyyy")}
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-card-foreground">
                          ${Number(inv.total).toFixed(2)}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full capitalize ${STATUS_STYLES[inv.status] || ""}`}>
                            <Icon className="h-3 w-3" />
                            {inv.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => setViewInvoice(inv)}
                              className="h-7 px-2 rounded text-xs text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </button>
                            {inv.status === "draft" && (
                              <button
                                onClick={() => setEditInvoice(inv)}
                                className="h-7 px-2 rounded text-xs text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                            )}
                            {inv.status === "draft" && !isAdmin && (
                              <button
                                onClick={() => submitMutation.mutate(inv.id)}
                                disabled={submitMutation.isPending}
                                className="h-7 px-2.5 rounded text-xs bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
                              >
                                Submit
                              </button>
                            )}
                            {inv.status === "submitted" && isAdmin && (
                              <>
                                <button
                                  onClick={() => statusMutation.mutate({ id: inv.id, status: "approved" })}
                                  className="h-7 px-2.5 rounded text-xs bg-success/10 text-success hover:bg-success/20 transition-colors"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => statusMutation.mutate({ id: inv.id, status: "rejected" })}
                                  className="h-7 px-2.5 rounded text-xs bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
                                >
                                  Reject
                                </button>
                              </>
                            )}
                            {inv.status === "approved" && isAdmin && (
                              <button
                                onClick={() => statusMutation.mutate({ id: inv.id, status: "paid" })}
                                className="h-7 px-2.5 rounded text-xs bg-info/10 text-info hover:bg-info/20 transition-colors"
                              >
                                Mark Paid
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </div>
    </AppLayout>
  );
}
