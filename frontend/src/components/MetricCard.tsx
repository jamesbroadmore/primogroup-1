import { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: LucideIcon;
  iconColor?: string;
  gradient?: string;
  href?: string;
}

export function MetricCard({
  title,
  value,
  change,
  changeType = "neutral",
  icon: Icon,
  iconColor = "bg-primary/10 text-primary",
  gradient,
  href,
}: MetricCardProps) {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={href ? () => navigate(href) : undefined}
      className={`rounded-2xl bg-white p-5 shadow-sm border border-border/50 flex items-center gap-4 ${
        href ? "cursor-pointer hover:shadow-md hover:border-primary/20 transition-all" : ""
      }`}
    >
      {gradient ? (
        <div
          className="h-12 w-12 rounded-xl flex items-center justify-center shrink-0 shadow-md"
          style={{ background: gradient }}
        >
          <Icon className="h-5 w-5 text-white" />
        </div>
      ) : (
        <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 ${iconColor}`}>
          <Icon className="h-5 w-5" />
        </div>
      )}

      <div className="space-y-1">
        <p className="text-sm text-muted-foreground font-medium">{title}</p>
        <p className="text-2xl font-bold text-card-foreground">{value}</p>
        {change && (
          <p
            className={`text-xs font-medium ${
              changeType === "positive"
                ? "text-success"
                : changeType === "negative"
                ? "text-destructive"
                : "text-muted-foreground"
            }`}
          >
            {change}
          </p>
        )}
      </div>
    </motion.div>
  );
}
