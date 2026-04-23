import { FileText, Users, Calendar, AlertTriangle, ClipboardList, BarChart3 } from "lucide-react";
import { motion } from "framer-motion";

interface EmptyStateProps {
  icon?: "file" | "users" | "calendar" | "alert" | "clipboard" | "chart";
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

const icons = {
  file: FileText,
  users: Users,
  calendar: Calendar,
  alert: AlertTriangle,
  clipboard: ClipboardList,
  chart: BarChart3,
};

export function EmptyState({ icon = "file", title, description, action }: EmptyStateProps) {
  const Icon = icons[icon];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 px-4 text-center"
      data-testid="empty-state"
    >
      <div
        className="h-20 w-20 rounded-3xl flex items-center justify-center mb-5"
        style={{ background: "linear-gradient(135deg, #f1f5f9, #e2e8f0)" }}
      >
        <Icon className="h-10 w-10 text-slate-300" />
      </div>
      
      <h3 className="text-lg font-bold text-slate-700 mb-2" data-testid="empty-state-title">
        {title}
      </h3>
      
      <p className="text-sm text-slate-400 max-w-sm leading-relaxed mb-6" data-testid="empty-state-description">
        {description}
      </p>

      {action && (
        <button
          onClick={action.onClick}
          className="h-11 px-6 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98]"
          style={{ background: "linear-gradient(135deg, #a78bfa, #8b5cf6)" }}
          data-testid="empty-state-action"
        >
          {action.label}
        </button>
      )}
    </motion.div>
  );
}

// Pre-configured empty states for common scenarios
export function NoDataEmpty({ onAction }: { onAction?: () => void }) {
  return (
    <EmptyState
      icon="file"
      title="No data yet"
      description="There's nothing here yet. Start by adding your first entry."
      action={onAction ? { label: "Add New", onClick: onAction } : undefined}
    />
  );
}

export function NoResultsEmpty({ onClear }: { onClear?: () => void }) {
  return (
    <EmptyState
      icon="clipboard"
      title="No results found"
      description="We couldn't find anything matching your search. Try adjusting your filters."
      action={onClear ? { label: "Clear Filters", onClick: onClear } : undefined}
    />
  );
}

export function NoStaffEmpty({ onAdd }: { onAdd?: () => void }) {
  return (
    <EmptyState
      icon="users"
      title="No staff members"
      description="You haven't added any staff members yet. Add your first team member to get started."
      action={onAdd ? { label: "Add Staff Member", onClick: onAdd } : undefined}
    />
  );
}

export function NoClientsEmpty({ onAdd }: { onAdd?: () => void }) {
  return (
    <EmptyState
      icon="users"
      title="No clients"
      description="You haven't added any clients yet. Add your first client to begin managing their care."
      action={onAdd ? { label: "Add Client", onClick: onAdd } : undefined}
    />
  );
}

export function NoShiftsEmpty() {
  return (
    <EmptyState
      icon="calendar"
      title="No shifts scheduled"
      description="There are no shifts scheduled for this period. Check back later or contact your supervisor."
    />
  );
}

export function NoNotesEmpty({ onAdd }: { onAdd?: () => void }) {
  return (
    <EmptyState
      icon="file"
      title="No case notes"
      description="No case notes have been recorded yet. Start documenting client interactions."
      action={onAdd ? { label: "Add Case Note", onClick: onAdd } : undefined}
    />
  );
}

export function NoIncidentsEmpty() {
  return (
    <EmptyState
      icon="alert"
      title="No incidents"
      description="Great news! There are no incidents to report. Keep up the excellent work."
    />
  );
}

export function NoReportsEmpty() {
  return (
    <EmptyState
      icon="chart"
      title="No reports available"
      description="Reports will appear here once there's enough data to analyze."
    />
  );
}

export default EmptyState;
