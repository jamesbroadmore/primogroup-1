import { AppLayout } from "@/components/AppLayout";
import { MetricCard } from "@/components/MetricCard";
import { DollarSign, TrendingUp, Users, Percent } from "lucide-react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export default function Financials() {
  const { data: stats } = useQuery({
    queryKey: ["financials-stats"],
    queryFn: async () => {
      const { count: staffCount } = await supabase.from("staff").select("*", { count: "exact", head: true }).eq("status", "active");
      const { count: clientCount } = await supabase.from("clients").select("*", { count: "exact", head: true }).eq("status", "active");
      return { staffCount: staffCount ?? 0, clientCount: clientCount ?? 0 };
    },
  });

  return (
    <AppLayout title="Financials">
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard title="Active Staff" value={stats?.staffCount ?? 0} icon={Users} iconColor="bg-primary/10 text-primary" />
          <MetricCard title="Active Clients" value={stats?.clientCount ?? 0} icon={TrendingUp} iconColor="bg-info/10 text-info" />
          <MetricCard title="Revenue" value="—" change="Connect billing to track" changeType="neutral" icon={DollarSign} iconColor="bg-success/10 text-success" />
          <MetricCard title="Margin" value="—" change="Connect billing to track" changeType="neutral" icon={Percent} iconColor="bg-warning/10 text-warning" />
        </div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl bg-card p-8 shadow-card border border-border/50 text-center">
          <DollarSign className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Financial reports will populate as timesheets and billing data are recorded.</p>
        </motion.div>
      </div>
    </AppLayout>
  );
}
