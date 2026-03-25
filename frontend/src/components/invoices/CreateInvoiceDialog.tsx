import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { Loader2, Check, Shield } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { runBillingValidations, saveValidationResults, hasBlockingFailures, type ValidationResult } from "@/lib/billing-validation";
import { BillingValidationPanel } from "@/components/invoices/BillingValidationPanel";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function CreateInvoiceDialog({ open, onClose }: Props) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [abn, setAbn] = useState("");
  const [selectedTimesheets, setSelectedTimesheets] = useState<Set<string>>(new Set());
  const [rate, setRate] = useState("38");
  const [notes, setNotes] = useState("");
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [validationRun, setValidationRun] = useState(false);

  const { data: profile } = useQuery({
    queryKey: ["my-profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("staff_id")
        .eq("user_id", user!.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: timesheets = [], isLoading } = useQuery({
    queryKey: ["uninvoiced-timesheets", profile?.staff_id],
    queryFn: async () => {
      const { data: existingItems } = await supabase
        .from("invoice_line_items")
        .select("timesheet_id");
      const invoicedIds = new Set((existingItems || []).map((i: any) => i.timesheet_id).filter(Boolean));

      const { data, error } = await supabase
        .from("timesheets")
        .select("*, client:client_id(first_name, last_name)")
        .eq("staff_id", profile!.staff_id!)
        .in("status", ["approved", "pending"])
        .order("shift_date", { ascending: false });
      if (error) throw error;
      return (data || []).filter((t: any) => !invoicedIds.has(t.id));
    },
    enabled: !!profile?.staff_id,
  });

  const selectedItems = useMemo(
    () => timesheets.filter((t: any) => selectedTimesheets.has(t.id)),
    [timesheets, selectedTimesheets]
  );

  const rateNum = parseFloat(rate) || 0;
  const subtotal = selectedItems.reduce((sum: number, t: any) => sum + (t.total_hours || 0) * rateNum, 0);
  const gst = subtotal * 0.1;
  const total = subtotal + gst;

  const toggleTimesheet = (id: string) => {
    setSelectedTimesheets((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    // Reset validation when selection changes
    setValidationRun(false);
    setValidationResults([]);
  };

  const selectAll = () => {
    if (selectedTimesheets.size === timesheets.length) {
      setSelectedTimesheets(new Set());
    } else {
      setSelectedTimesheets(new Set(timesheets.map((t: any) => t.id)));
    }
    setValidationRun(false);
    setValidationResults([]);
  };

  const handleValidate = async () => {
    if (!profile?.staff_id || selectedItems.length === 0) return;
    setIsValidating(true);
    try {
      const results = await runBillingValidations(
        Array.from(selectedTimesheets),
        profile.staff_id,
        rateNum
      );
      setValidationResults(results);
      setValidationRun(true);
    } catch (err) {
      toast.error("Validation failed");
    } finally {
      setIsValidating(false);
    }
  };

  const hasBlockers = hasBlockingFailures(validationResults);

  const createMutation = useMutation({
    mutationFn: async () => {
      if (selectedItems.length === 0) throw new Error("Select at least one timesheet");

      // Generate invoice number
      const { data: numData, error: numError } = await supabase.rpc("generate_invoice_number");
      if (numError) throw numError;
      const invoiceNumber = numData as string;

      // Create invoice
      const { data: invoice, error: invError } = await supabase
        .from("invoices")
        .insert({
          invoice_number: invoiceNumber,
          staff_id: profile!.staff_id!,
          abn: abn.trim() || null,
          status: "draft",
          subtotal,
          gst,
          total,
          notes: notes.trim() || null,
        })
        .select()
        .single();
      if (invError) throw invError;

      // Create line items
      const lineItems = selectedItems.map((t: any) => ({
        invoice_id: invoice.id,
        timesheet_id: t.id,
        client_id: t.client_id,
        description: t.client
          ? `Support services for ${t.client.first_name} ${t.client.last_name} on ${format(new Date(t.shift_date), "dd/MM/yyyy")}`
          : `Support services on ${format(new Date(t.shift_date), "dd/MM/yyyy")}`,
        hours: t.total_hours || 0,
        rate: rateNum,
        amount: (t.total_hours || 0) * rateNum,
        service_date: t.shift_date,
      }));

      const { error: liError } = await supabase.from("invoice_line_items").insert(lineItems);
      if (liError) throw liError;

      // Save validation audit trail
      if (validationResults.length > 0) {
        await saveValidationResults(validationResults, invoice.id, Array.from(selectedTimesheets));
      }
    },
    onSuccess: () => {
      toast.success("Invoice created");
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["uninvoiced-timesheets"] });
      setSelectedTimesheets(new Set());
      setNotes("");
      setValidationResults([]);
      setValidationRun(false);
      onClose();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Invoice from Timesheets</DialogTitle>
        </DialogHeader>

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
              <label className="text-xs font-medium text-muted-foreground">Hourly Rate ($)</label>
              <input
                value={rate}
                onChange={(e) => { setRate(e.target.value); setValidationRun(false); setValidationResults([]); }}
                type="number"
                min="0"
                step="0.01"
                className="mt-1 w-full h-9 px-3 rounded-lg border bg-card text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-muted-foreground">Select Timesheets</label>
              {timesheets.length > 0 && (
                <button onClick={selectAll} className="text-xs text-primary hover:underline">
                  {selectedTimesheets.size === timesheets.length ? "Deselect all" : "Select all"}
                </button>
              )}
            </div>

            {isLoading ? (
              <div className="flex justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : timesheets.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No uninvoiced timesheets found.</p>
            ) : (
              <div className="space-y-1 max-h-48 overflow-y-auto rounded-lg border p-2">
                {timesheets.map((t: any) => {
                  const selected = selectedTimesheets.has(t.id);
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => toggleTimesheet(t.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-left text-sm transition-colors ${
                        selected ? "bg-primary/10" : "hover:bg-secondary"
                      }`}
                    >
                      <div className={`h-4 w-4 rounded border flex items-center justify-center shrink-0 ${
                        selected ? "bg-primary border-primary" : "border-muted-foreground/30"
                      }`}>
                        {selected && <Check className="h-3 w-3 text-primary-foreground" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="font-medium text-card-foreground">
                          {format(new Date(t.shift_date), "dd MMM yyyy")}
                        </span>
                        {t.client && (
                          <span className="text-muted-foreground ml-2">
                            — {t.client.first_name} {t.client.last_name}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {t.total_hours || 0}h
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="mt-1 w-full px-3 py-2 rounded-lg border bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              placeholder="Optional notes..."
            />
          </div>

          {selectedItems.length > 0 && (
            <div className="rounded-lg bg-secondary/50 p-3 space-y-1 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal ({selectedItems.reduce((s: number, t: any) => s + (t.total_hours || 0), 0)}h × ${rateNum}/hr)</span>
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

          {/* Compliance Validation Panel */}
          <BillingValidationPanel results={validationResults} isRunning={isValidating} />

          {/* Action buttons */}
          <div className="flex gap-2">
            {!validationRun ? (
              <button
                onClick={handleValidate}
                disabled={selectedItems.length === 0 || isValidating}
                className="flex-1 h-10 rounded-lg bg-secondary text-card-foreground text-sm font-medium hover:bg-secondary/80 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isValidating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Shield className="h-4 w-4" />}
                Run Compliance Check
              </button>
            ) : (
              <button
                onClick={() => createMutation.mutate()}
                disabled={selectedItems.length === 0 || createMutation.isPending || hasBlockers}
                className="flex-1 h-10 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                {hasBlockers ? "Billing Blocked — Fix Issues Above" : `Create Invoice (${selectedItems.length} items)`}
              </button>
            )}
          </div>

          {hasBlockers && validationRun && (
            <p className="text-xs text-destructive text-center">
              One or more compliance checks failed. Resolve the issues above before creating this invoice.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
