import { useState, useMemo, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { Loader2, Check, Plus, Trash2, Pencil } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface Props {
  open: boolean;
  onClose: () => void;
  invoiceId: string;
}

interface LineItem {
  id?: string;
  description: string;
  hours: number;
  rate: number;
  amount: number;
  service_date: string | null;
  timesheet_id: string | null;
  client_id: string | null;
  isNew?: boolean;
}

export function EditInvoiceDialog({ open, onClose, invoiceId }: Props) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [abn, setAbn] = useState("");
  const [notes, setNotes] = useState("");
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);

  const { data: invoice, isLoading: loadingInvoice } = useQuery({
    queryKey: ["invoice-edit", invoiceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invoices")
        .select("*")
        .eq("id", invoiceId)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const { data: existingItems = [], isLoading: loadingItems } = useQuery({
    queryKey: ["invoice-line-items-edit", invoiceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invoice_line_items")
        .select("*")
        .eq("invoice_id", invoiceId)
        .order("service_date");
      if (error) throw error;
      return data;
    },
  });

  // Load invoice data into state
  useEffect(() => {
    if (invoice) {
      setAbn(invoice.abn || "");
      setNotes(invoice.notes || "");
    }
  }, [invoice]);

  useEffect(() => {
    if (existingItems.length > 0) {
      setLineItems(existingItems.map((item: any) => ({
        id: item.id,
        description: item.description,
        hours: Number(item.hours),
        rate: Number(item.rate),
        amount: Number(item.amount),
        service_date: item.service_date,
        timesheet_id: item.timesheet_id,
        client_id: item.client_id,
      })));
    }
  }, [existingItems]);

  const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0);
  const gst = subtotal * 0.1;
  const total = subtotal + gst;

  const updateLineItem = (idx: number, field: keyof LineItem, value: any) => {
    setLineItems(prev => {
      const next = [...prev];
      const item = { ...next[idx], [field]: value };
      if (field === "hours" || field === "rate") {
        item.amount = (Number(item.hours) || 0) * (Number(item.rate) || 0);
      }
      next[idx] = item;
      return next;
    });
  };

  const addLineItem = () => {
    setLineItems(prev => [...prev, {
      description: "",
      hours: 0,
      rate: prev.length > 0 ? prev[prev.length - 1].rate : 38,
      amount: 0,
      service_date: new Date().toISOString().split("T")[0],
      timesheet_id: null,
      client_id: null,
      isNew: true,
    }]);
    setEditingIdx(lineItems.length);
  };

  const removeLineItem = (idx: number) => {
    setLineItems(prev => prev.filter((_, i) => i !== idx));
    setEditingIdx(null);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (lineItems.length === 0) throw new Error("Invoice must have at least one line item");
      if (lineItems.some(li => !li.description.trim())) throw new Error("All line items need a description");

      // Update invoice header
      const { error: invError } = await supabase
        .from("invoices")
        .update({
          abn: abn.trim() || null,
          notes: notes.trim() || null,
          subtotal,
          gst,
          total,
        })
        .eq("id", invoiceId);
      if (invError) throw invError;

      // Delete removed items
      const keepIds = lineItems.filter(li => li.id).map(li => li.id!);
      const existingIds = existingItems.map((i: any) => i.id);
      const toDelete = existingIds.filter((id: string) => !keepIds.includes(id));
      if (toDelete.length > 0) {
        const { error } = await supabase
          .from("invoice_line_items")
          .delete()
          .in("id", toDelete);
        if (error) throw error;
      }

      // Update existing items
      for (const item of lineItems.filter(li => li.id)) {
        const { error } = await supabase
          .from("invoice_line_items")
          .update({
            description: item.description,
            hours: item.hours,
            rate: item.rate,
            amount: item.amount,
            service_date: item.service_date,
          })
          .eq("id", item.id!);
        if (error) throw error;
      }

      // Insert new items
      const newItems = lineItems.filter(li => !li.id).map(li => ({
        invoice_id: invoiceId,
        description: li.description,
        hours: li.hours,
        rate: li.rate,
        amount: li.amount,
        service_date: li.service_date,
        timesheet_id: li.timesheet_id,
        client_id: li.client_id,
      }));
      if (newItems.length > 0) {
        const { error } = await supabase.from("invoice_line_items").insert(newItems);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Invoice updated");
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["invoice-detail"] });
      queryClient.invalidateQueries({ queryKey: ["invoice-line-items"] });
      onClose();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const isLoading = loadingInvoice || loadingItems;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Invoice {invoice?.invoice_number}</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">ABN</label>
                <input
                  value={abn}
                  onChange={(e) => setAbn(e.target.value)}
                  placeholder="XX XXX XXX XXX"
                  className="mt-1 w-full h-9 px-3 rounded-lg border bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Notes</label>
                <input
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optional notes"
                  className="mt-1 w-full h-9 px-3 rounded-lg border bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium text-muted-foreground">Line Items</label>
                <button
                  onClick={addLineItem}
                  className="text-xs text-primary hover:underline flex items-center gap-1"
                >
                  <Plus className="h-3 w-3" /> Add item
                </button>
              </div>

              <div className="space-y-2">
                {lineItems.map((item, idx) => (
                  <div
                    key={item.id || `new-${idx}`}
                    className="rounded-lg border p-3 space-y-2"
                  >
                    {editingIdx === idx ? (
                      <>
                        <input
                          value={item.description}
                          onChange={(e) => updateLineItem(idx, "description", e.target.value)}
                          placeholder="Description"
                          className="w-full h-8 px-2 rounded border bg-card text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                        />
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <label className="text-[10px] text-muted-foreground">Date</label>
                            <input
                              type="date"
                              value={item.service_date || ""}
                              onChange={(e) => updateLineItem(idx, "service_date", e.target.value)}
                              className="w-full h-8 px-2 rounded border bg-card text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-muted-foreground">Hours</label>
                            <input
                              type="number"
                              value={item.hours}
                              onChange={(e) => updateLineItem(idx, "hours", parseFloat(e.target.value) || 0)}
                              min="0"
                              step="0.1"
                              className="w-full h-8 px-2 rounded border bg-card text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-muted-foreground">Rate ($)</label>
                            <input
                              type="number"
                              value={item.rate}
                              onChange={(e) => updateLineItem(idx, "rate", parseFloat(e.target.value) || 0)}
                              min="0"
                              step="0.01"
                              className="w-full h-8 px-2 rounded border bg-card text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                            />
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-card-foreground">
                            Amount: ${item.amount.toFixed(2)}
                          </span>
                          <button
                            onClick={() => setEditingIdx(null)}
                            className="text-xs text-primary hover:underline"
                          >
                            Done
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-card-foreground truncate">{item.description || "No description"}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.service_date ? format(new Date(item.service_date), "dd/MM/yyyy") : "—"} · {item.hours}h × ${item.rate}/hr
                          </p>
                        </div>
                        <span className="text-sm font-medium text-card-foreground shrink-0">
                          ${item.amount.toFixed(2)}
                        </span>
                        <button
                          onClick={() => setEditingIdx(idx)}
                          className="h-7 w-7 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors shrink-0"
                        >
                          <Pencil className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => removeLineItem(idx)}
                          className="h-7 w-7 rounded flex items-center justify-center text-destructive hover:bg-destructive/10 transition-colors shrink-0"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
                {lineItems.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">No line items. Add one to continue.</p>
                )}
              </div>
            </div>

            {lineItems.length > 0 && (
              <div className="rounded-lg bg-secondary/50 p-3 space-y-1 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>GST (10%)</span>
                  <span>${gst.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-semibold text-card-foreground pt-1 border-t">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>
            )}

            <button
              onClick={() => saveMutation.mutate()}
              disabled={lineItems.length === 0 || saveMutation.isPending}
              className="w-full h-10 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saveMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Save Changes
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
