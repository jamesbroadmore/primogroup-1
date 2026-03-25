import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Loader2, Download, Printer, Shield, CheckCircle, XCircle } from "lucide-react";
import { useRef } from "react";

interface Props {
  open: boolean;
  onClose: () => void;
  invoiceId: string;
  isAdmin: boolean;
  onStatusChange: (status: string) => void;
}

export function ViewInvoiceDialog({ open, onClose, invoiceId, isAdmin, onStatusChange }: Props) {
  const printRef = useRef<HTMLDivElement>(null);

  const { data: invoice, isLoading } = useQuery({
    queryKey: ["invoice-detail", invoiceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invoices")
        .select("*, staff:staff_id(first_name, last_name, email, phone, address)")
        .eq("id", invoiceId)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const { data: lineItems = [] } = useQuery({
    queryKey: ["invoice-line-items", invoiceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invoice_line_items")
        .select("*, client:client_id(first_name, last_name)")
        .eq("invoice_id", invoiceId)
        .order("service_date");
      if (error) throw error;
      return data;
    },
  });

  const { data: validations = [] } = useQuery({
    queryKey: ["billing-validations", invoiceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("billing_validations")
        .select("*")
        .eq("invoice_id", invoiceId)
        .order("created_at");
      if (error) throw error;
      return data;
    },
  });

  const { data: orgSettings = [] } = useQuery({
    queryKey: ["org-settings-invoice"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("organisation_settings")
        .select("key, value")
        .in("key", ["company_name", "abn", "address"]);
      if (error) throw error;
      return data;
    },
  });

  const orgMap = Object.fromEntries((orgSettings || []).map((s: any) => [s.key, s.value]));

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`
      <html><head><title>Invoice ${invoice?.invoice_number}</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 40px; color: #1a1a1a; }
        table { width: 100%; border-collapse: collapse; margin: 16px 0; }
        th, td { text-align: left; padding: 8px 12px; border-bottom: 1px solid #e5e5e5; font-size: 13px; }
        th { font-weight: 600; color: #666; }
        .total-row td { font-weight: 700; border-top: 2px solid #333; }
        .header { display: flex; justify-content: space-between; margin-bottom: 24px; }
        .meta { color: #666; font-size: 13px; }
        h1 { margin: 0; font-size: 24px; }
        .amount { text-align: right; }
      </style></head><body>
      ${content.innerHTML}
      </body></html>
    `);
    win.document.close();
    win.print();
  };

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
        <DialogContent><div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div></DialogContent>
      </Dialog>
    );
  }

  if (!invoice) return null;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Invoice {invoice.invoice_number}</DialogTitle>
            <button
              onClick={handlePrint}
              className="h-8 px-3 rounded-lg border bg-card text-xs font-medium text-foreground flex items-center gap-1.5 hover:bg-secondary transition-colors"
            >
              <Printer className="h-3.5 w-3.5" /> Print / PDF
            </button>
          </div>
        </DialogHeader>

        <div ref={printRef} className="space-y-4 mt-2">
          <div className="flex justify-between items-start">
            <div>
              <p className="font-semibold text-card-foreground">
                {invoice.staff?.first_name} {invoice.staff?.last_name}
              </p>
              {invoice.abn && <p className="text-xs text-muted-foreground">ABN: {invoice.abn}</p>}
              {invoice.staff?.email && <p className="text-xs text-muted-foreground">{invoice.staff.email}</p>}
              {invoice.staff?.phone && <p className="text-xs text-muted-foreground">{invoice.staff.phone}</p>}
              {invoice.staff?.address && <p className="text-xs text-muted-foreground">{invoice.staff.address}</p>}
            </div>
            <div className="text-right text-xs space-y-0.5">
              <p className="font-medium text-card-foreground">{invoice.invoice_number}</p>
              <p className="text-muted-foreground">Date: {format(new Date(invoice.invoice_date), "dd/MM/yyyy")}</p>
              {invoice.due_date && <p className="text-muted-foreground">Due: {format(new Date(invoice.due_date), "dd/MM/yyyy")}</p>}
              <p className={`font-medium capitalize ${
                invoice.status === "paid" ? "text-success" :
                invoice.status === "approved" ? "text-success" :
                invoice.status === "rejected" ? "text-destructive" :
                "text-muted-foreground"
              }`}>
                {invoice.status}
              </p>
            </div>
          </div>

          {orgMap.company_name && (
            <div className="rounded-lg bg-secondary/50 p-3 text-xs">
              <p className="font-medium text-card-foreground">Bill To: {orgMap.company_name}</p>
              {orgMap.abn && <p className="text-muted-foreground">ABN: {orgMap.abn}</p>}
              {orgMap.address && <p className="text-muted-foreground">{orgMap.address}</p>}
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-2 text-xs font-medium text-muted-foreground">Date</th>
                  <th className="text-left py-2 px-2 text-xs font-medium text-muted-foreground">Description</th>
                  <th className="text-right py-2 px-2 text-xs font-medium text-muted-foreground">Hours</th>
                  <th className="text-right py-2 px-2 text-xs font-medium text-muted-foreground">Rate</th>
                  <th className="text-right py-2 px-2 text-xs font-medium text-muted-foreground">Amount</th>
                </tr>
              </thead>
              <tbody>
                {lineItems.map((item: any) => (
                  <tr key={item.id} className="border-b last:border-0">
                    <td className="py-2 px-2 text-xs text-muted-foreground">
                      {item.service_date ? format(new Date(item.service_date), "dd/MM") : "—"}
                    </td>
                    <td className="py-2 px-2 text-xs text-card-foreground">{item.description}</td>
                    <td className="py-2 px-2 text-xs text-right text-card-foreground">{Number(item.hours).toFixed(1)}</td>
                    <td className="py-2 px-2 text-xs text-right text-muted-foreground">${Number(item.rate).toFixed(2)}</td>
                    <td className="py-2 px-2 text-xs text-right font-medium text-card-foreground">${Number(item.amount).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end">
            <div className="w-48 space-y-1 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>${Number(invoice.subtotal).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>GST</span>
                <span>${Number(invoice.gst).toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-semibold text-card-foreground pt-1 border-t">
                <span>Total</span>
                <span>${Number(invoice.total).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {invoice.notes && (
            <div className="rounded-lg bg-secondary/50 p-3 text-xs text-muted-foreground">
              <span className="font-medium text-card-foreground">Notes: </span>{invoice.notes}
            </div>
          )}

          {/* Compliance audit trail */}
          {validations.length > 0 && (
            <div className="rounded-lg border border-border p-3 space-y-2">
              <div className="flex items-center gap-1.5">
                <Shield className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs font-semibold text-card-foreground">Compliance Audit Trail</span>
              </div>
              <div className="space-y-1">
                {validations.map((v: any) => (
                  <div key={v.id} className={`flex items-center gap-1.5 text-[10px] ${v.passed ? "text-success" : "text-destructive"}`}>
                    {v.passed ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                    <span className="font-medium capitalize">{v.validation_type.replace(/_/g, " ")}:</span>
                    <span className="opacity-80">{v.message}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
