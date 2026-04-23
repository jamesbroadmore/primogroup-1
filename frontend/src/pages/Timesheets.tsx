import { AppLayout } from "@/components/AppLayout";
import { Download, CheckCircle, Clock, Loader2, Receipt, XCircle, AlertCircle, FileText, DollarSign } from "lucide-react";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState } from "react";
import { formatPerthDate, formatPerthTime, extractPerthTime } from "@/lib/perth-time";
import { TimesheetDetailDialog } from "@/components/timesheets/TimesheetDetailDialog";
import { fullName } from "@/lib/display-names";
import { Avatar, TableContainer, TableHead, Th, Td, OutlineButton, StatusBadge, EmptyState, DialogOverlay, DialogHeader, PrimaryButton } from "@/components/ui-kit";
import { createNotification } from "@/components/NotificationBell";

const STATUS_CONFIG: Record<string, { bg: string; text: string; label: string }> = {
  pending: { bg: "bg-amber-100", text: "text-amber-700", label: "Pending" },
  submitted: { bg: "bg-blue-100", text: "text-blue-700", label: "Submitted" },
  approved: { bg: "bg-emerald-100", text: "text-emerald-700", label: "Approved" },
  rejected: { bg: "bg-red-100", text: "text-red-700", label: "Rejected" },
  paid: { bg: "bg-purple-100", text: "text-purple-700", label: "Paid" },
};

export default function Timesheets() {
  const [selectedTimesheet, setSelectedTimesheet] = useState<any>(null);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [selectedForApproval, setSelectedForApproval] = useState<any[]>([]);
  const [showInvoiceDialog, setShowInvoiceDialog] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const queryClient = useQueryClient();

  const { data: timesheets = [], isLoading } = useQuery({
    queryKey: ["timesheets"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("timesheets")
        .select("*, staff:staff_id(first_name, last_name, preferred_name, email, hourly_rate), client:client_id(first_name, last_name, preferred_name)")
        .order("shift_date", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
  });

  const filteredTimesheets = filterStatus === "all" 
    ? timesheets 
    : timesheets.filter((t: any) => t.status === filterStatus);

  const approvalMutation = useMutation({
    mutationFn: async ({ ids, status, note, timesheets: selectedTs }: { ids: string[]; status: string; note?: string; timesheets: any[] }) => {
      const { error } = await supabase
        .from("timesheets")
        .update({ 
          status, 
          approved_at: status === "approved" ? new Date().toISOString() : null,
          approval_note: note || null 
        })
        .in("id", ids);
      if (error) throw error;

      // Send notifications to staff members
      for (const ts of selectedTs) {
        // Get user_id from staff profile
        const { data: profile } = await supabase
          .from("profiles")
          .select("user_id")
          .eq("staff_id", ts.staff_id)
          .single();

        if (profile?.user_id) {
          const notifType = status === "approved" ? "timesheet_approved" : "timesheet_rejected";
          const title = status === "approved" ? "Timesheet Approved" : "Timesheet Rejected";
          const message = status === "approved" 
            ? `Your timesheet for ${ts.shift_date} (${ts.total_hours}h) has been approved.${note ? ` Note: ${note}` : ""}`
            : `Your timesheet for ${ts.shift_date} has been rejected.${note ? ` Reason: ${note}` : ""}`;
          
          await createNotification(profile.user_id, notifType, title, message, "/my-timesheets");
        }
      }
    },
    onSuccess: (_, { status }) => {
      toast.success(`Timesheet(s) ${status}`);
      queryClient.invalidateQueries({ queryKey: ["timesheets"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      setShowApprovalDialog(false);
      setSelectedForApproval([]);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const handleExport = () => {
    if (filteredTimesheets.length === 0) { toast.info("No timesheets to export"); return; }
    const headers = ["Staff", "Client", "Date", "Start (AWST)", "End (AWST)", "Hours", "Break (min)", "Status"];
    const rows = filteredTimesheets.map((t: any) => [
      fullName(t.staff), fullName(t.client), t.shift_date,
      t.start_time ? extractPerthTime(t.start_time) : "",
      t.end_time ? extractPerthTime(t.end_time) : "",
      t.total_hours ?? "", t.break_minutes ?? 0, t.status,
    ]);
    const csv = [headers.join(","), ...rows.map(r => r.map(v => `"${v}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `timesheets_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Timesheets exported");
  };

  const toggleSelection = (timesheet: any) => {
    if (selectedForApproval.find(t => t.id === timesheet.id)) {
      setSelectedForApproval(selectedForApproval.filter(t => t.id !== timesheet.id));
    } else {
      setSelectedForApproval([...selectedForApproval, timesheet]);
    }
  };

  const selectAllPending = () => {
    const pending = timesheets.filter((t: any) => t.status === "submitted" || t.status === "pending");
    setSelectedForApproval(pending);
  };

  const totalHours = filteredTimesheets.reduce((sum: number, t: any) => sum + (t.total_hours || 0), 0);
  const pendingCount = timesheets.filter((t: any) => t.status === "pending" || t.status === "submitted").length;
  const approvedCount = timesheets.filter((t: any) => t.status === "approved").length;

  return (
    <AppLayout title="Timesheets">
      <div className="space-y-5">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Entries", value: timesheets.length, gradient: "linear-gradient(135deg, #a78bfa, #8b5cf6)", icon: Receipt },
            { label: "Total Hours", value: `${totalHours.toFixed(1)}h`, gradient: "linear-gradient(135deg, #60a5fa, #3b82f6)", icon: Clock },
            { label: "Pending Approval", value: pendingCount, gradient: "linear-gradient(135deg, #fbbf24, #f59e0b)", icon: AlertCircle },
            { label: "Approved", value: approvedCount, gradient: "linear-gradient(135deg, #4ade80, #22c55e)", icon: CheckCircle },
          ].map((stat, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="rounded-2xl bg-white border border-border/50 shadow-sm p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm" style={{ background: stat.gradient }}>
                <stat.icon className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-xl font-bold text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="h-9 px-3 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-700"
              data-testid="timesheets-status-filter"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="submitted">Submitted</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="paid">Paid</option>
            </select>
            <p className="text-sm text-muted-foreground">{filteredTimesheets.length} entries</p>
          </div>
          
          <div className="flex items-center gap-2">
            {selectedForApproval.length > 0 && (
              <>
                <span className="text-xs font-medium text-purple-600 bg-purple-50 px-2 py-1 rounded-lg">
                  {selectedForApproval.length} selected
                </span>
                <button
                  onClick={() => setShowApprovalDialog(true)}
                  className="h-9 px-4 rounded-xl text-white text-sm font-bold flex items-center gap-2 shadow-md hover:opacity-90 transition-all"
                  style={{ background: "linear-gradient(135deg, #4ade80, #22c55e)" }}
                  data-testid="timesheets-approve-selected-btn"
                >
                  <CheckCircle className="h-4 w-4" /> Approve Selected
                </button>
              </>
            )}
            {pendingCount > 0 && selectedForApproval.length === 0 && (
              <button
                onClick={selectAllPending}
                className="h-9 px-3 rounded-xl border border-purple-200 bg-purple-50 text-purple-600 text-sm font-medium hover:bg-purple-100 transition-colors"
                data-testid="timesheets-select-all-pending-btn"
              >
                Select All Pending ({pendingCount})
              </button>
            )}
            <button
              onClick={() => setShowInvoiceDialog(true)}
              className="h-9 px-4 rounded-xl text-white text-sm font-bold flex items-center gap-2 shadow-md hover:opacity-90 transition-all"
              style={{ background: "linear-gradient(135deg, #a78bfa, #8b5cf6)" }}
              data-testid="timesheets-generate-invoice-btn"
            >
              <DollarSign className="h-4 w-4" /> Generate Invoice
            </button>
            <OutlineButton onClick={handleExport}>
              <Download className="h-4 w-4" /> Export CSV
            </OutlineButton>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : filteredTimesheets.length === 0 ? (
          <div className="rounded-2xl bg-white border border-border/50 shadow-sm">
            <EmptyState
              icon={Clock}
              title="No timesheets found"
              description={filterStatus === "all" ? "Timesheets will appear as staff complete shifts." : `No ${filterStatus} timesheets found.`}
            />
          </div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <TableContainer>
              <TableHead>
                <Th className="w-10">
                  <input 
                    type="checkbox" 
                    checked={selectedForApproval.length === filteredTimesheets.filter(t => t.status === "submitted" || t.status === "pending").length && selectedForApproval.length > 0}
                    onChange={(e) => e.target.checked ? selectAllPending() : setSelectedForApproval([])}
                    className="rounded"
                  />
                </Th>
                <Th>Staff</Th>
                <Th>Client</Th>
                <Th className="hidden md:table-cell">Date</Th>
                <Th className="hidden lg:table-cell">Time (AWST)</Th>
                <Th>Hours</Th>
                <Th>Status</Th>
              </TableHead>
              <tbody className="divide-y divide-slate-100">
                {filteredTimesheets.map((t: any) => {
                  const isSelected = selectedForApproval.find(s => s.id === t.id);
                  const canSelect = t.status === "submitted" || t.status === "pending";
                  return (
                    <tr key={t.id} className={`hover:bg-slate-50/50 transition-colors ${isSelected ? "bg-purple-50" : ""}`}>
                      <Td>
                        {canSelect ? (
                          <input 
                            type="checkbox" 
                            checked={!!isSelected}
                            onChange={() => toggleSelection(t)}
                            className="rounded"
                          />
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </Td>
                      <Td onClick={() => setSelectedTimesheet(t)} className="cursor-pointer">
                        <div className="flex items-center gap-2.5">
                          <Avatar name={fullName(t.staff)} size="sm" />
                          <span className="text-sm font-semibold text-foreground">{fullName(t.staff)}</span>
                        </div>
                      </Td>
                      <Td onClick={() => setSelectedTimesheet(t)} className="cursor-pointer">
                        <span className="text-sm text-muted-foreground">{fullName(t.client)}</span>
                      </Td>
                      <Td onClick={() => setSelectedTimesheet(t)} className="hidden md:table-cell cursor-pointer">
                        <span className="text-sm text-muted-foreground">{formatPerthDate(t.shift_date)}</span>
                      </Td>
                      <Td onClick={() => setSelectedTimesheet(t)} className="hidden lg:table-cell cursor-pointer">
                        <span className="text-sm text-muted-foreground">
                          {t.start_time ? formatPerthTime(t.start_time) : "—"}
                          {t.end_time ? ` – ${formatPerthTime(t.end_time)}` : ""}
                        </span>
                      </Td>
                      <Td onClick={() => setSelectedTimesheet(t)} className="cursor-pointer">
                        <span className="text-sm font-bold text-foreground">{t.total_hours ? `${t.total_hours}h` : "—"}</span>
                      </Td>
                      <Td>
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_CONFIG[t.status]?.bg || "bg-slate-100"} ${STATUS_CONFIG[t.status]?.text || "text-slate-600"}`}>
                          {STATUS_CONFIG[t.status]?.label || t.status}
                        </span>
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </TableContainer>
          </motion.div>
        )}
      </div>

      {selectedTimesheet && (
        <TimesheetDetailDialog timesheet={selectedTimesheet} onClose={() => setSelectedTimesheet(null)} />
      )}

      {showApprovalDialog && (
        <ApprovalDialog 
          timesheets={selectedForApproval}
          onClose={() => setShowApprovalDialog(false)}
          onApprove={(note) => approvalMutation.mutate({ ids: selectedForApproval.map(t => t.id), status: "approved", note, timesheets: selectedForApproval })}
          onReject={(note) => approvalMutation.mutate({ ids: selectedForApproval.map(t => t.id), status: "rejected", note, timesheets: selectedForApproval })}
          isLoading={approvalMutation.isPending}
        />
      )}

      {showInvoiceDialog && (
        <InvoiceGeneratorDialog 
          timesheets={timesheets.filter((t: any) => t.status === "approved")}
          onClose={() => setShowInvoiceDialog(false)}
        />
      )}
    </AppLayout>
  );
}

function ApprovalDialog({ 
  timesheets, 
  onClose, 
  onApprove, 
  onReject, 
  isLoading 
}: { 
  timesheets: any[]; 
  onClose: () => void; 
  onApprove: (note?: string) => void; 
  onReject: (note?: string) => void;
  isLoading: boolean;
}) {
  const [note, setNote] = useState("");
  const totalHours = timesheets.reduce((sum, t) => sum + (t.total_hours || 0), 0);

  return (
    <DialogOverlay onClose={onClose}>
      <DialogHeader title="Approve Timesheets" onClose={onClose} gradient="linear-gradient(90deg, #4ade80, #22c55e)" />
      <div className="p-6 space-y-4">
        <div className="bg-slate-50 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-foreground">Selected Timesheets</p>
            <span className="text-xs font-bold text-purple-600 bg-purple-100 px-2 py-0.5 rounded-full">
              {timesheets.length} entries
            </span>
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {timesheets.map((t) => (
              <div key={t.id} className="flex items-center justify-between text-sm">
                <span className="text-slate-600">{fullName(t.staff)} • {t.shift_date}</span>
                <span className="font-semibold text-foreground">{t.total_hours}h</span>
              </div>
            ))}
          </div>
          <div className="border-t border-slate-200 mt-3 pt-3 flex items-center justify-between">
            <span className="text-sm font-semibold text-foreground">Total Hours</span>
            <span className="text-lg font-bold text-purple-600">{totalHours.toFixed(1)}h</span>
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2 block">Note (optional)</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add a note for the approval/rejection..."
            rows={2}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-400"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            onClick={() => onReject(note)}
            disabled={isLoading}
            className="h-10 px-4 rounded-xl border border-red-200 bg-red-50 text-red-600 text-sm font-semibold flex items-center gap-2 hover:bg-red-100 transition-colors disabled:opacity-50"
          >
            <XCircle className="h-4 w-4" /> Reject
          </button>
          <button
            onClick={() => onApprove(note)}
            disabled={isLoading}
            className="h-10 px-5 rounded-xl text-white text-sm font-bold flex items-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50 shadow-md"
            style={{ background: "linear-gradient(135deg, #4ade80, #22c55e)" }}
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            <CheckCircle className="h-4 w-4" /> Approve All
          </button>
        </div>
      </div>
    </DialogOverlay>
  );
}

function InvoiceGeneratorDialog({ timesheets, onClose }: { timesheets: any[]; onClose: () => void }) {
  const [selectedStaff, setSelectedStaff] = useState<string>("all");
  const [hourlyRate, setHourlyRate] = useState("45");
  const [invoiceNumber, setInvoiceNumber] = useState(`INV-${Date.now().toString().slice(-6)}`);

  // Group by staff
  const staffOptions = Array.from(new Set(timesheets.map((t: any) => t.staff_id))).map(staffId => {
    const t = timesheets.find((ts: any) => ts.staff_id === staffId);
    return { id: staffId, name: fullName(t.staff) };
  });

  const filteredForInvoice = selectedStaff === "all" 
    ? timesheets 
    : timesheets.filter((t: any) => t.staff_id === selectedStaff);

  const totalHours = filteredForInvoice.reduce((sum: number, t: any) => sum + (t.total_hours || 0), 0);
  const totalAmount = totalHours * parseFloat(hourlyRate || "0");

  const generateInvoice = () => {
    // Generate invoice CSV
    const invoiceLines = [
      `Invoice Number,${invoiceNumber}`,
      `Date,${new Date().toISOString().split("T")[0]}`,
      `Staff,${selectedStaff === "all" ? "All Staff" : staffOptions.find(s => s.id === selectedStaff)?.name}`,
      "",
      "Date,Client,Hours,Rate,Amount",
      ...filteredForInvoice.map((t: any) => 
        `${t.shift_date},${fullName(t.client)},${t.total_hours},${hourlyRate},${(t.total_hours * parseFloat(hourlyRate)).toFixed(2)}`
      ),
      "",
      `Total Hours,${totalHours.toFixed(1)}`,
      `Hourly Rate,$${hourlyRate}`,
      `Total Amount,$${totalAmount.toFixed(2)}`,
    ];

    const csv = invoiceLines.join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${invoiceNumber}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Invoice generated and downloaded");
    onClose();
  };

  return (
    <DialogOverlay onClose={onClose}>
      <DialogHeader title="Generate Invoice" onClose={onClose} gradient="linear-gradient(90deg, #a78bfa, #8b5cf6)" />
      <div className="p-6 space-y-4">
        {timesheets.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-slate-200 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No approved timesheets available for invoicing.</p>
            <p className="text-xs text-slate-400 mt-1">Approve timesheets first to generate invoices.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2 block">Invoice Number</label>
                <input
                  type="text"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2 block">Hourly Rate ($)</label>
                <input
                  type="number"
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2 block">Staff / Subcontractor</label>
              <select
                value={selectedStaff}
                onChange={(e) => setSelectedStaff(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
              >
                <option value="all">All Staff ({timesheets.length} entries)</option>
                {staffOptions.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-purple-600">Entries</span>
                <span className="text-sm font-semibold text-purple-800">{filteredForInvoice.length}</span>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-purple-600">Total Hours</span>
                <span className="text-sm font-semibold text-purple-800">{totalHours.toFixed(1)}h</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-purple-200">
                <span className="text-sm font-semibold text-purple-700">Total Amount</span>
                <span className="text-xl font-bold text-purple-800">${totalAmount.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button onClick={onClose} className="h-10 px-4 rounded-xl border text-sm font-medium text-foreground hover:bg-secondary transition-colors">
                Cancel
              </button>
              <button
                onClick={generateInvoice}
                className="h-10 px-5 rounded-xl text-white text-sm font-bold flex items-center gap-2 hover:opacity-90 transition-opacity shadow-md"
                style={{ background: "linear-gradient(135deg, #a78bfa, #8b5cf6)" }}
              >
                <DollarSign className="h-4 w-4" /> Generate Invoice
              </button>
            </div>
          </>
        )}
      </div>
    </DialogOverlay>
  );
}
