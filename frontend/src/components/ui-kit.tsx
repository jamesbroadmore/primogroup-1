import { LucideIcon, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  iconGradient?: string;
  actions?: React.ReactNode;
  breadcrumb?: string;
}

export function PageHeader({ title, subtitle, icon: Icon, iconGradient, actions, breadcrumb }: PageHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-between mb-6"
    >
      <div className="flex items-center gap-3">
        {Icon && (
          <div
            className="h-10 w-10 rounded-2xl flex items-center justify-center shrink-0 shadow-md"
            style={{ background: iconGradient || "linear-gradient(135deg, #a78bfa, #8b5cf6)" }}
          >
            <Icon className="h-5 w-5 text-white" />
          </div>
        )}
        <div>
          {breadcrumb && (
            <div className="flex items-center gap-1 mb-0.5">
              <span className="text-xs text-muted-foreground">{breadcrumb}</span>
              <ChevronRight className="h-3 w-3 text-muted-foreground/50" />
            </div>
          )}
          <h1 className="text-xl font-bold text-foreground">{title}</h1>
          {subtitle && <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </motion.div>
  );
}

interface StatsRowProps {
  stats: {
    label: string;
    value: string | number;
    gradient: string;
    icon: LucideIcon;
  }[];
}

export function StatsRow({ stats }: StatsRowProps) {
  return (
    <div className={`grid grid-cols-2 sm:grid-cols-${Math.min(stats.length, 4)} gap-4 mb-6`}>
      {stats.map((s, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          className="rounded-2xl bg-white border border-border/50 shadow-sm p-4 flex items-center gap-3"
        >
          <div
            className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
            style={{ background: s.gradient }}
          >
            <s.icon className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-xl font-bold text-foreground">{s.value}</p>
            <p className="text-xs text-muted-foreground font-medium">{s.label}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// Consistent primary button
export function PrimaryButton({
  children,
  onClick,
  disabled,
  type = "button",
  variant = "purple",
  size = "md",
  className = "",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  variant?: "purple" | "blue" | "green" | "orange" | "red" | "teal" | "pink" | "indigo";
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const gradients = {
    purple: "linear-gradient(135deg, #8b5cf6, #7c3aed)",
    blue: "linear-gradient(135deg, #3b82f6, #2563eb)",
    green: "linear-gradient(135deg, #22c55e, #16a34a)",
    orange: "linear-gradient(135deg, #f97316, #ea580c)",
    red: "linear-gradient(135deg, #ef4444, #dc2626)",
    teal: "linear-gradient(135deg, #14b8a6, #0d9488)",
    pink: "linear-gradient(135deg, #ec4899, #db2777)",
    indigo: "linear-gradient(135deg, #6366f1, #4f46e5)",
  };
  const heights = { sm: "h-8 px-3 text-xs", md: "h-9 px-4 text-sm", lg: "h-11 px-6 text-sm" };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${heights[size]} rounded-xl font-semibold text-white flex items-center gap-2 transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50 shadow-sm ${className}`}
      style={{ background: gradients[variant] }}
    >
      {children}
    </button>
  );
}

// Outlined button
export function OutlineButton({
  children,
  onClick,
  disabled,
  type = "button",
  size = "md",
  className = "",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const heights = { sm: "h-8 px-3 text-xs", md: "h-9 px-4 text-sm", lg: "h-11 px-6 text-sm" };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${heights[size]} rounded-xl font-medium text-foreground bg-white border border-border hover:bg-secondary flex items-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 ${className}`}
    >
      {children}
    </button>
  );
}

// Content card
export function ContentCard({
  children,
  className = "",
  noPad = false,
}: {
  children: React.ReactNode;
  className?: string;
  noPad?: boolean;
}) {
  return (
    <div className={`rounded-2xl bg-white border border-border/50 shadow-sm overflow-hidden ${noPad ? "" : "p-5"} ${className}`}>
      {children}
    </div>
  );
}

// Status badge
export function StatusBadge({
  status,
  variant,
}: {
  status: string;
  variant?: "success" | "warning" | "danger" | "info" | "neutral";
}) {
  const variantStyles = {
    success: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    warning: "bg-amber-50 text-amber-700 border border-amber-200",
    danger: "bg-red-50 text-red-700 border border-red-200",
    info: "bg-blue-50 text-blue-700 border border-blue-200",
    neutral: "bg-slate-100 text-slate-600 border border-slate-200",
  };

  // Auto-detect variant from status string
  const autoVariant = variant || (
    ["active", "current", "approved", "paid", "checked_in", "resolved", "closed"].includes(status) ? "success" :
    ["expiring_soon", "pending", "investigating"].includes(status) ? "warning" :
    ["expired", "open", "critical", "high"].includes(status) ? "danger" :
    ["inactive", "cancelled"].includes(status) ? "neutral" : "neutral"
  );

  const style = variantStyles[autoVariant];
  const label = status.replace(/_/g, " ");

  return (
    <span className={`inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full capitalize ${style}`}>
      {label}
    </span>
  );
}

// Search input
export function SearchInput({
  value,
  onChange,
  placeholder = "Search...",
  className = "",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={`relative ${className}`}>
      <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-9 pl-9 pr-3 rounded-xl border border-border bg-white text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-purple-400/50 focus:border-purple-300 transition-all"
      />
    </div>
  );
}

// Table container
export function TableContainer({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-white border border-border/50 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">{children}</table>
      </div>
    </div>
  );
}

export function TableHead({ children }: { children: React.ReactNode }) {
  return (
    <thead>
      <tr className="border-b bg-slate-50/80">{children}</tr>
    </thead>
  );
}

export function Th({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <th className={`text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider ${className}`}>
      {children}
    </th>
  );
}

export function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <td className={`px-4 py-3.5 ${className}`}>{children}</td>
  );
}

// Avatar with initials + gradient
export function Avatar({ name, size = "md" }: { name: string; size?: "sm" | "md" | "lg" }) {
  const colors = [
    "linear-gradient(135deg, #f472b6, #ec4899)",
    "linear-gradient(135deg, #fb923c, #f97316)",
    "linear-gradient(135deg, #fbbf24, #f59e0b)",
    "linear-gradient(135deg, #4ade80, #22c55e)",
    "linear-gradient(135deg, #60a5fa, #3b82f6)",
    "linear-gradient(135deg, #a78bfa, #8b5cf6)",
    "linear-gradient(135deg, #2dd4bf, #14b8a6)",
  ];
  const initials = (name || "??").split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  const colorIdx = (name || "").split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) % colors.length;
  const sizes = { sm: "h-7 w-7 text-[10px]", md: "h-9 w-9 text-xs", lg: "h-11 w-11 text-sm" };

  return (
    <div
      className={`${sizes[size]} rounded-full flex items-center justify-center text-white font-bold shrink-0 shadow-sm`}
      style={{ background: colors[colorIdx] }}
    >
      {initials}
    </div>
  );
}

// Dialog wrapper
export function DialogOverlay({
  children,
  onClose,
  maxWidth = "md",
}: {
  children: React.ReactNode;
  onClose: () => void;
  maxWidth?: "sm" | "md" | "lg" | "xl";
}) {
  const widths = { sm: "max-w-sm", md: "max-w-md", lg: "max-w-lg", xl: "max-w-xl" };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={`w-full ${widths[maxWidth]} rounded-3xl bg-white shadow-2xl border border-white/80 overflow-hidden max-h-[90vh] overflow-y-auto`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </motion.div>
    </div>
  );
}

export function DialogHeader({
  title,
  onClose,
  gradient,
}: {
  title: string;
  onClose: () => void;
  gradient?: string;
}) {
  return (
    <div className="relative">
      {gradient && (
        <div className="h-1.5 w-full" style={{ background: gradient }} />
      )}
      <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
        <h2 className="text-lg font-bold text-slate-800">{title}</h2>
        <button
          onClick={onClose}
          className="h-8 w-8 rounded-xl flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// Form field
export function FormField({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="text-xs font-semibold text-slate-600 mb-1.5 block uppercase tracking-wide">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      {children}
    </div>
  );
}

export function FormInput({
  type = "text",
  value,
  onChange,
  placeholder,
  required,
  min,
  max,
  step,
  disabled,
}: {
  type?: string;
  value: string | number;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  min?: string | number;
  max?: string | number;
  step?: string | number;
  disabled?: boolean;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      required={required}
      min={min}
      max={max}
      step={step}
      disabled={disabled}
      className="w-full h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-400/50 focus:border-purple-300 transition-all disabled:opacity-60"
    />
  );
}

export function FormSelect({
  value,
  onChange,
  children,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className="w-full h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-400/50 focus:border-purple-300 transition-all appearance-none disabled:opacity-60"
    >
      {children}
    </select>
  );
}

export function FormTextarea({
  value,
  onChange,
  placeholder,
  rows = 3,
  required,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
  required?: boolean;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      required={required}
      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-400/50 focus:border-purple-300 transition-all resize-none"
    />
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {Icon && (
        <div className="h-16 w-16 rounded-3xl bg-slate-100 flex items-center justify-center mb-4">
          <Icon className="h-8 w-8 text-slate-300" />
        </div>
      )}
      <h3 className="text-sm font-semibold text-foreground mb-1">{title}</h3>
      {description && <p className="text-xs text-muted-foreground max-w-xs">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
