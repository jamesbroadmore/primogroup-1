import { X, Clock, User, UserCircle, Calendar, FileText, CheckCircle, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { formatPerthTime, formatPerthDate } from "@/lib/perth-time";

interface TimesheetDetailDialogProps {
  timesheet: any;
  onClose: () => void;
}

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  pending: { bg: "bg-warning/10", text: "text-warning", label: "Pending Approval" },
  approved: { bg: "bg-success/10", text: "text-success", label: "Approved" },
  paid: { bg: "bg-info/10", text: "text-info", label: "Paid" },
  rejected: { bg: "bg-destructive/10", text: "text-destructive", label: "Rejected" },
};

export function TimesheetDetailDialog({ timesheet: t, onClose }: TimesheetDetailDialogProps) {
  const status = STATUS_STYLES[t.status] || STATUS_STYLES.pending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md rounded-xl bg-card shadow-xl border border-border"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-lg font-semibold text-card-foreground">Timesheet Detail</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Status badge */}
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full ${status.bg} ${status.text}`}>
              {t.status === "approved" || t.status === "paid" ? (
                <CheckCircle className="h-3.5 w-3.5" />
              ) : (
                <AlertCircle className="h-3.5 w-3.5" />
              )}
              {status.label}
            </span>
          </div>

          {/* Info grid */}
          <div className="grid grid-cols-2 gap-4">
            <DetailItem
              icon={User}
              label="Staff Member"
              value={t.staff ? `${t.staff.first_name} ${t.staff.last_name}` : "—"}
            />
            <DetailItem
              icon={UserCircle}
              label="Client"
              value={t.client ? `${t.client.first_name} ${t.client.last_name}` : "—"}
            />
            <DetailItem
              icon={Calendar}
              label="Shift Date"
              value={formatPerthDate(t.shift_date)}
            />
            <DetailItem
              icon={Clock}
              label="Hours Worked"
              value={t.total_hours ? `${t.total_hours}h` : "—"}
            />
          </div>

          {/* Time details */}
          <div className="rounded-lg bg-secondary/50 p-4 space-y-3">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Shift Times (Perth AWST)</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[10px] text-muted-foreground">Start</p>
                <p className="text-sm font-semibold text-card-foreground">
                  {t.start_time ? formatPerthTime(t.start_time) : "—"}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground">End</p>
                <p className="text-sm font-semibold text-card-foreground">
                  {t.end_time ? formatPerthTime(t.end_time) : "—"}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground">Break</p>
                <p className="text-sm font-semibold text-card-foreground">
                  {t.break_minutes != null ? `${t.break_minutes} min` : "0 min"}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground">Rate</p>
                <p className="text-sm font-semibold text-card-foreground">
                  {t.rate_per_hour ? `$${Number(t.rate_per_hour).toFixed(2)}/hr` : "—"}
                </p>
              </div>
            </div>
          </div>

          {/* Notes */}
          {t.notes && (
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Notes</h3>
              </div>
              <p className="text-sm text-muted-foreground bg-secondary/30 rounded-lg p-3">{t.notes}</p>
            </div>
          )}

          {/* Approval info */}
          {t.approved_at && (
            <div className="text-xs text-muted-foreground border-t pt-3">
              Approved {formatPerthDateTime(t.approved_at)}
            </div>
          )}
        </div>

        <div className="flex justify-end p-5 border-t">
          <button
            onClick={onClose}
            className="h-9 px-4 rounded-lg border text-sm font-medium text-foreground hover:bg-secondary transition-colors"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function DetailItem({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div>
        <p className="text-[10px] text-muted-foreground">{label}</p>
        <p className="text-sm font-medium text-card-foreground">{value}</p>
      </div>
    </div>
  );
}

function formatPerthDateTime(isoString: string): string {
  return new Date(isoString).toLocaleString("en-AU", {
    timeZone: "Australia/Perth",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}
