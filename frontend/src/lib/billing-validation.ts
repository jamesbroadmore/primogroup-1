import { supabase } from "@/integrations/supabase/client";

export interface ValidationResult {
  type: string;
  passed: boolean;
  message: string;
  details?: Record<string, any>;
}

/**
 * Run all billing compliance validations for a set of timesheets before invoice creation.
 * Returns an array of validation results — invoice should only proceed if all pass.
 */
export async function runBillingValidations(
  timesheetIds: string[],
  staffId: string,
  ratePerHour: number
): Promise<ValidationResult[]> {
  const results: ValidationResult[] = [];

  if (timesheetIds.length === 0) {
    results.push({ type: "no_timesheets", passed: false, message: "No timesheets selected for invoicing." });
    return results;
  }

  // Fetch full timesheet data with client info
  const { data: timesheets, error: tsErr } = await supabase
    .from("timesheets")
    .select("*, client:client_id(id, first_name, last_name, funding_type, ndis_plan_start, ndis_plan_end, status)")
    .in("id", timesheetIds);

  if (tsErr || !timesheets) {
    results.push({ type: "fetch_error", passed: false, message: "Failed to load timesheet data." });
    return results;
  }

  // 1. Check timesheets are approved/pending
  const unapproved = timesheets.filter(t => !["approved", "pending"].includes(t.status));
  results.push({
    type: "timesheet_status",
    passed: unapproved.length === 0,
    message: unapproved.length === 0
      ? "All timesheets have valid status."
      : `${unapproved.length} timesheet(s) have invalid status (must be approved or pending).`,
    details: { unapproved: unapproved.map(t => t.id) },
  });

  // 2. Check client records are active
  const inactiveClients = timesheets.filter(t => t.client && (t.client as any).status !== "active");
  results.push({
    type: "client_active",
    passed: inactiveClients.length === 0,
    message: inactiveClients.length === 0
      ? "All clients have active records."
      : `${inactiveClients.length} timesheet(s) are for inactive clients.`,
    details: { inactive: inactiveClients.map(t => (t.client as any)?.id) },
  });

  // 3. Check service dates within funding period (NDIS plan dates)
  const outOfPlan = timesheets.filter(t => {
    if (!t.client) return false;
    const client = t.client as any;
    if (client.funding_type !== "ndis") return false;
    const shiftDate = t.shift_date;
    if (client.ndis_plan_start && shiftDate < client.ndis_plan_start) return true;
    if (client.ndis_plan_end && shiftDate > client.ndis_plan_end) return true;
    return false;
  });
  results.push({
    type: "funding_period",
    passed: outOfPlan.length === 0,
    message: outOfPlan.length === 0
      ? "All services within funding approval period."
      : `${outOfPlan.length} service(s) fall outside the client's plan dates.`,
    details: { outOfPlan: outOfPlan.map(t => ({ id: t.id, date: t.shift_date })) },
  });

  // 4. Check for case notes (NO NOTE = NO BILL)
  const clientIds = [...new Set(timesheets.map(t => t.client_id).filter(Boolean))];
  const shiftDates = [...new Set(timesheets.map(t => t.shift_date))];

  let missingNotes: string[] = [];
  if (clientIds.length > 0 && shiftDates.length > 0) {
    const { data: notes } = await supabase
      .from("case_notes")
      .select("client_id, note_date")
      .in("client_id", clientIds as string[])
      .eq("staff_id", staffId);

    const noteSet = new Set(
      (notes || []).map((n: any) => `${n.client_id}_${n.note_date?.split("T")[0]}`)
    );

    missingNotes = timesheets
      .filter(t => t.client_id && !noteSet.has(`${t.client_id}_${t.shift_date}`))
      .map(t => t.id);
  }

  results.push({
    type: "case_notes",
    passed: missingNotes.length === 0,
    message: missingNotes.length === 0
      ? "Case notes exist for all billed services."
      : `${missingNotes.length} service(s) are missing case notes. NO NOTE = NO BILL.`,
    details: { missing: missingNotes },
  });

  // 5. Check for roster/check-in records (service delivery verification)
  const { data: checkins } = await supabase
    .from("shift_checkins")
    .select("shift_date, staff_id")
    .eq("staff_id", staffId)
    .in("shift_date", shiftDates);

  const checkinDates = new Set((checkins || []).map((c: any) => c.shift_date));
  const missingCheckins = timesheets.filter(t => !checkinDates.has(t.shift_date));
  results.push({
    type: "service_delivery",
    passed: missingCheckins.length === 0,
    message: missingCheckins.length === 0
      ? "Check-in records exist for all services."
      : `${missingCheckins.length} service(s) have no check-in record. Service delivery unverified.`,
    details: { missingDates: missingCheckins.map(t => t.shift_date) },
  });

  // 6. Check for duplicate billing (same timesheet already invoiced)
  const { data: existingItems } = await supabase
    .from("invoice_line_items")
    .select("timesheet_id")
    .in("timesheet_id", timesheetIds);

  const alreadyInvoiced = (existingItems || []).map((i: any) => i.timesheet_id).filter(Boolean);
  results.push({
    type: "duplicate_billing",
    passed: alreadyInvoiced.length === 0,
    message: alreadyInvoiced.length === 0
      ? "No duplicate billing detected."
      : `${alreadyInvoiced.length} timesheet(s) have already been invoiced. Duplicate billing prevented.`,
    details: { duplicates: alreadyInvoiced },
  });

  // 7. Price control — check against service category max rates
  const fundedClients = timesheets.filter(t => t.client && (t.client as any).funding_type !== "private");
  if (fundedClients.length > 0) {
    const { data: categories } = await supabase
      .from("service_categories")
      .select("funding_program, max_rate")
      .not("max_rate", "is", null);

    const maxRates = new Map<string, number>();
    (categories || []).forEach((c: any) => {
      const existing = maxRates.get(c.funding_program) || 0;
      if (c.max_rate > existing) maxRates.set(c.funding_program, c.max_rate);
    });

    const overpriced = fundedClients.filter(t => {
      const program = (t.client as any)?.funding_type === "ndis" ? "ndis" : "aged_care";
      const maxRate = maxRates.get(program);
      return maxRate && ratePerHour > maxRate;
    });

    results.push({
      type: "price_control",
      passed: overpriced.length === 0,
      message: overpriced.length === 0
        ? "Rates within approved limits."
        : `Rate $${ratePerHour}/hr exceeds maximum for ${overpriced.length} funded service(s).`,
      details: { rate: ratePerHour, maxRates: Object.fromEntries(maxRates) },
    });
  }

  // 8. Check for service agreement
  if (clientIds.length > 0) {
    const { data: agreements } = await supabase
      .from("service_agreements")
      .select("client_id")
      .in("client_id", clientIds as string[])
      .eq("status", "active")
      .eq("signed", true);

    const agreedClients = new Set((agreements || []).map((a: any) => a.client_id));
    const missingAgreements = clientIds.filter(id => !agreedClients.has(id));
    results.push({
      type: "service_agreement",
      passed: missingAgreements.length === 0,
      message: missingAgreements.length === 0
        ? "Active service agreements exist for all clients."
        : `${missingAgreements.length} client(s) missing signed service agreements.`,
      details: { missing: missingAgreements },
    });
  }

  // 9. Check client funding allocation
  if (clientIds.length > 0) {
    const { data: funding } = await supabase
      .from("client_funding")
      .select("*")
      .in("client_id", clientIds as string[])
      .eq("status", "active");

    const fundedClientIds = new Set((funding || []).map((f: any) => f.client_id));
    const fundedTimesheets = timesheets.filter(t => t.client_id && (t.client as any)?.funding_type !== "private");
    const missingFunding = fundedTimesheets.filter(t => t.client_id && !fundedClientIds.has(t.client_id));

    results.push({
      type: "funding_allocation",
      passed: missingFunding.length === 0,
      message: missingFunding.length === 0
        ? "Funding allocations confirmed for all funded clients."
        : `${missingFunding.length} funded client(s) have no active funding allocation record.`,
      details: { missing: missingFunding.map(t => t.client_id) },
    });

    // Budget check
    const overBudget: string[] = [];
    for (const f of (funding || []) as any[]) {
      if (f.total_budget) {
        const clientTimesheets = timesheets.filter(t => t.client_id === f.client_id);
        const newCost = clientTimesheets.reduce((sum, t) => sum + (t.total_hours || 0) * ratePerHour, 0);
        if ((f.budget_used || 0) + newCost > f.total_budget) {
          overBudget.push(f.client_id);
        }
      }
    }
    if (overBudget.length > 0) {
      results.push({
        type: "budget_exceeded",
        passed: false,
        message: `${overBudget.length} client(s) would exceed their funding budget.`,
        details: { clients: overBudget },
      });
    }
  }

  return results;
}

/**
 * Save validation results to the billing_validations table for audit trail
 */
export async function saveValidationResults(
  results: ValidationResult[],
  invoiceId: string,
  timesheetIds: string[]
) {
  const records = results.map(r => ({
    invoice_id: invoiceId,
    timesheet_id: timesheetIds[0] || null,
    validation_type: r.type,
    passed: r.passed,
    message: r.message,
    details: r.details || null,
  }));

  await supabase.from("billing_validations").insert(records);
}

/**
 * Check if all critical validations pass (warnings are allowed)
 */
export function hasBlockingFailures(results: ValidationResult[]): boolean {
  const blockingTypes = [
    "no_timesheets",
    "fetch_error",
    "timesheet_status",
    "client_active",
    "funding_period",
    "case_notes",
    "duplicate_billing",
    "price_control",
    "budget_exceeded",
  ];
  return results.some(r => !r.passed && blockingTypes.includes(r.type));
}
