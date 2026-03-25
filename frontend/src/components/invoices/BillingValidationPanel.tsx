import { CheckCircle, XCircle, AlertTriangle, Shield } from "lucide-react";
import type { ValidationResult } from "@/lib/billing-validation";

interface Props {
  results: ValidationResult[];
  isRunning?: boolean;
}

const ICONS: Record<string, any> = {
  passed: CheckCircle,
  failed: XCircle,
  warning: AlertTriangle,
};

const LABELS: Record<string, string> = {
  timesheet_status: "Timesheet Status",
  client_active: "Client Active",
  funding_period: "Funding Period",
  case_notes: "Case Notes (No Note = No Bill)",
  service_delivery: "Service Delivery Verification",
  duplicate_billing: "Duplicate Billing Check",
  price_control: "Price Control",
  service_agreement: "Service Agreement",
  funding_allocation: "Funding Allocation",
  budget_exceeded: "Budget Limit",
  no_timesheets: "Timesheet Selection",
  fetch_error: "Data Access",
};

const BLOCKING_TYPES = new Set([
  "no_timesheets", "fetch_error", "timesheet_status", "client_active",
  "funding_period", "case_notes", "duplicate_billing", "price_control", "budget_exceeded",
]);

export function BillingValidationPanel({ results, isRunning }: Props) {
  if (results.length === 0 && !isRunning) return null;

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed && BLOCKING_TYPES.has(r.type)).length;
  const warnings = results.filter(r => !r.passed && !BLOCKING_TYPES.has(r.type)).length;

  return (
    <div className="rounded-lg border border-border bg-card p-3 space-y-2">
      <div className="flex items-center gap-2">
        <Shield className="h-4 w-4 text-primary" />
        <span className="text-xs font-semibold text-card-foreground">Compliance Validation</span>
        {results.length > 0 && (
          <div className="flex items-center gap-2 ml-auto text-[10px]">
            {passed > 0 && <span className="text-success font-medium">{passed} passed</span>}
            {failed > 0 && <span className="text-destructive font-medium">{failed} blocked</span>}
            {warnings > 0 && <span className="text-warning font-medium">{warnings} warning{warnings > 1 ? "s" : ""}</span>}
          </div>
        )}
      </div>

      <div className="space-y-1">
        {results.map((r, i) => {
          const isBlocking = !r.passed && BLOCKING_TYPES.has(r.type);
          const Icon = r.passed ? ICONS.passed : isBlocking ? ICONS.failed : ICONS.warning;
          return (
            <div
              key={i}
              className={`flex items-start gap-2 rounded px-2 py-1.5 text-xs ${
                r.passed
                  ? "bg-success/5 text-success"
                  : isBlocking
                  ? "bg-destructive/5 text-destructive"
                  : "bg-warning/5 text-warning"
              }`}
            >
              <Icon className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              <div className="min-w-0">
                <span className="font-medium">{LABELS[r.type] || r.type}: </span>
                <span className="opacity-80">{r.message}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
