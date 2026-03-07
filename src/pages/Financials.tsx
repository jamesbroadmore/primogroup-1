import { AppLayout } from "@/components/AppLayout";
import { MetricCard } from "@/components/MetricCard";
import { DollarSign, TrendingUp, Users, Percent } from "lucide-react";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const revenueData = [
  { week: "Feb 3", revenue: 12400, cost: 7200 },
  { week: "Feb 10", revenue: 13100, cost: 7800 },
  { week: "Feb 17", revenue: 11800, cost: 7100 },
  { week: "Feb 24", revenue: 14200, cost: 8400 },
  { week: "Mar 3", revenue: 14280, cost: 8100 },
];

export default function Financials() {
  return (
    <AppLayout title="Financials">
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard title="Weekly Revenue" value="$14,280" change="+8.2%" changeType="positive" icon={DollarSign} iconColor="bg-success/10 text-success" />
          <MetricCard title="Monthly Revenue" value="$55,780" change="+5.1% vs last month" changeType="positive" icon={TrendingUp} iconColor="bg-primary/10 text-primary" />
          <MetricCard title="Labour Cost" value="$8,100" change="56.7% of revenue" changeType="neutral" icon={Users} iconColor="bg-warning/10 text-warning" />
          <MetricCard title="Profit Margin" value="43.3%" change="+2.1%" changeType="positive" icon={Percent} iconColor="bg-info/10 text-info" />
        </div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl bg-card p-5 shadow-card border border-border/50">
          <h2 className="text-sm font-semibold text-card-foreground mb-4">Revenue vs Labour Cost</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(210 15% 90%)" />
              <XAxis dataKey="week" tick={{ fontSize: 12, fill: "hsl(210 10% 50%)" }} />
              <YAxis tick={{ fontSize: 12, fill: "hsl(210 10% 50%)" }} />
              <Tooltip />
              <Bar dataKey="revenue" fill="hsl(168 55% 38%)" radius={[4, 4, 0, 0]} name="Revenue" />
              <Bar dataKey="cost" fill="hsl(35 90% 55%)" radius={[4, 4, 0, 0]} name="Labour Cost" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>
    </AppLayout>
  );
}
