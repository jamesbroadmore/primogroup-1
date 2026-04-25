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
import { fullName } from "@/lib/display-names";

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-slate-100 text-slate-600 border border-slate-200",
  submitted: "bg-amber-50 text-amber-700 border border-amber-200",
  approved: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  paid: "bg-blue-50 text-blue-700 border border-blue-200",
  rejected: "bg-red-50 text-red-700 border border-red-200",
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
        .select("*, staff:staff_id(first_name, last_name, preferred_name, employment_type)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const submitMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("invoices").update({ status: "submitted" }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Invoice submitted"); queryClient.invalidateQueries({ queryKey: ["invoices"] }); },
    onError: (err: Error) => toast.error(err.message),
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("invoices").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Invoice updated"); queryClient.invalidateQueries({ queryKey: ["invoices"] }); },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <AppLayout title="Invoices">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{invoices.length} invoices</p>
          <button onClick={() => setShowCreate(true)}
            className="h-9 px-4 rounded-xl text-white text-sm font-semibold flex items-center gap-2 hover:opacity-90 transition-opacity shadow-md"
            style={{ background: "linear-gradient(135deg, #6366f1, #4f46e5)" }}>
            <Plus className="h-4 w-4" /> New Invoice
          </button>
        </div>

        <CreateInvoiceDialog open={showCreate} onClose={() => setShowCreate(false)} />
        {editInvoice && <EditInvoiceDialog open={!!editInvoice} onClose={() => setEditInvoice(null)} invoiceId={editInvoice.id} />}
        {viewInvoice && (
          <ViewInvoiceDialog open={!!viewInvoice} onClose={() => setViewInvoice(null)} invoiceId={viewInvoice.id}
            isAdmin={isAdmin} onStatusChange={(status) => statusMutation.mutate({ id: viewInvoice.id, status })} />
        )}

        {isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : invoices.length === 0 ? (
          <div className="rounded-2xl bg-white border border-border/50 shadow-sm p-12 text-center">
            <div className="h-14 w-14 rounded-3xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
              <FileText className="h-7 w-7 text-slate-300" />
            </div>
            <p className="text-sm font-semibold text-foreground">No invoices yet</p>
            <p className="text-xs text-muted-foreground mt-1">Create one from your approved timesheets.</p>
          </div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-2xl bg-white shadow-sm border border-border/50 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-slate-100/80">
                    <th className="text-left px-4 py-3 text-xs font-bold text-slate-700 uppercase tracking-wider">Invoice #</th>
                    {isAdmin && <th className="text-left px-4 py-3 text-xs font-bold text-slate-700 uppercase tracking-wider">Staff</th>}
                    <th className="text-left px-4 py-3 text-xs font-bold text-slate-700 uppercase tracking-wider hidden md:table-cell">Date</th>
                    <th className="text-right px-4 py-3 text-xs font-bold text-slate-700 uppercase tracking-wider">Total</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-slate-700 uppercase tracking-wider">Status</th>
                    <th className="text-right px-4 py-3 text-xs font-bold text-slate-700 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {invoices.map((inv: any) => {
                    const Icon = STATUS_ICONS[inv.status] || Clock;
                    return (
                      <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-4 py-3.5 font-bold text-foreground">{inv.invoice_number}</td>
                        {isAdmin && (
                          <td className="px-4 py-3.5 text-muted-foreground">{fullName(inv.staff)}</td>
                        )}
                        <td className="px-4 py-3.5 text-muted-foreground hidden md:table-cell">
                          {format(new Date(inv.invoice_date), "MMM d, yyyy")}
                        </td>
                        <td className="px-4 py-3.5 text-right font-bold text-foreground">${Number(inv.total).toFixed(2)}</td>
                        <td className="px-4 py-3.5">
                          <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full capitalize ${STATUS_STYLES[inv.status] || ""}`}>
                            <Icon className="h-3 w-3" />{inv.status}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => setViewInvoice(inv)}
                              className="h-7 px-2.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors flex items-center gap-1">
                              <Eye className="h-3.5 w-3.5" />
                            </button>
                            {inv.status === "draft" && (
                              <button onClick={() => setEditInvoice(inv)}
                                className="h-7 px-2.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                            )}
                            {inv.status === "draft" && !isAdmin && (
                              <button onClick={() => submitMutation.mutate(inv.id)} disabled={submitMutation.isPending}
                                className="h-7 px-2.5 rounded-lg text-xs font-semibold text-indigo-600 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 transition-colors">Submit</button>
                            )}
                            {inv.status === "submitted" && isAdmin && (
                              <>
                                <button onClick={() => statusMutation.mutate({ id: inv.id, status: "approved" })}
                                  className="h-7 px-2.5 rounded-lg text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 transition-colors">Approve</button>
                                <button onClick={() => statusMutation.mutate({ id: inv.id, status: "rejected" })}
                                  className="h-7 px-2.5 rounded-lg text-xs font-semibold text-red-600 bg-red-50 border border-red-200 hover:bg-red-100 transition-colors">Reject</button>
                              </>
                            )}
                            {inv.status === "approved" && isAdmin && (
                              <button onClick={() => statusMutation.mutate({ id: inv.id, status: "paid" })}
                                className="h-7 px-2.5 rounded-lg text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 transition-colors">Mark Paid</button>
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
