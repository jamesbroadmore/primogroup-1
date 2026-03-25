import { AppLayout } from "@/components/AppLayout";
import { MetricCard } from "@/components/MetricCard";
import { DollarSign, TrendingUp, Users, Percent, BarChart3, Receipt, Clock, FileText } from "lucide-react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export default function Financials() {
  const { data: stats } = useQuery({
    queryKey: ["financials-stats"],
    queryFn: async () => {
      const { count: staffCount } = await supabase.from("staff").select("*", { count: "exact", head: true }).eq("status", "active");
      const { count: clientCount } = await supabase.from("clients").select("*", { count: "exact", head: true }).eq("status", "active");
      const { data: tData } = await supabase.from("timesheets").select("total_hours, status").not("total_hours", "is", null);
      const totalHours = (tData || []).reduce((sum: number, t: any) => sum + (t.total_hours || 0), 0);
      const pendingCount = (tData || []).filter((t: any) => t.status === "pending").length;
      return { staffCount: staffCount ?? 0, clientCount: clientCount ?? 0, totalHours, pendingCount };
    },
  });

  return (
    <AppLayout title="Financials">
      <div className="space-y-6">
        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Active Staff"
            value={stats?.staffCount ?? 0}
            icon={Users}
            gradient="linear-gradient(135deg, #a78bfa, #8b5cf6)"
          />
          <MetricCard
            title="Active Clients"
            value={stats?.clientCount ?? 0}
            icon={TrendingUp}
            gradient="linear-gradient(135deg, #60a5fa, #3b82f6)"
          />
          <MetricCard
            title="Total Hours"
            value={stats?.totalHours ? `${stats.totalHours.toFixed(0)}h` : "0h"}
            icon={Clock}
            gradient="linear-gradient(135deg, #4ade80, #22c55e)"
          />
          <MetricCard
            title="Pending Approval"
            value={stats?.pendingCount ?? 0}
            icon={Receipt}
            gradient="linear-gradient(135deg, #fbbf24, #f59e0b)"
          />
        </div>

        {/* Coming soon panels */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { label: "Revenue Tracking", desc: "Connect your billing system to track revenue by client, funding type and period.", icon: DollarSign, gradient: "linear-gradient(135deg, #4ade80, #22c55e)" },
            { label: "Payroll Processing", desc: "Automated payroll calculations from approved timesheets. Export to Xero or MYOB.", icon: Receipt, gradient: "linear-gradient(135deg, #60a5fa, #3b82f6)" },
            { label: "NDIS Claiming", desc: "Generate NDIS payment requests and track claim status against plan budgets.", icon: FileText, gradient: "linear-gradient(135deg, #a78bfa, #8b5cf6)" },
            { label: "Profit & Loss", desc: "Margin analysis by service type, client funding stream and support worker.", icon: BarChart3, gradient: "linear-gradient(135deg, #fb923c, #f97316)" },
          ].map((item, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="rounded-2xl bg-white border border-border/50 shadow-sm p-5 flex items-start gap-4">
              <div className="h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 shadow-md" style={{ background: item.gradient }}>
                <item.icon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">{item.label}</h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{item.desc}</p>
                <span className="inline-block mt-2 text-[10px] font-bold uppercase tracking-wider text-purple-500 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-full">Coming Soon</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
