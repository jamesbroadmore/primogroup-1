import { AppLayout } from "@/components/AppLayout";
import { Plus, Search, MoreHorizontal } from "lucide-react";
import { motion } from "framer-motion";

const clientsData = [
  { name: "Maria Torres", ndis: "431 234 567", plan: "Core + Capacity", funding: "$42,500", workers: 2 },
  { name: "Robert Kim", ndis: "431 345 678", plan: "Core Support", funding: "$28,000", workers: 1 },
  { name: "Helen Smith", ndis: "431 456 789", plan: "Core + CB Daily", funding: "$55,200", workers: 3 },
  { name: "Frank Pearson", ndis: "431 567 890", plan: "Capacity Building", funding: "$18,750", workers: 1 },
  { name: "Linda Chen", ndis: "431 678 901", plan: "Core Support", funding: "$31,400", workers: 2 },
];

export default function Clients() {
  return (
    <AppLayout title="Client Management">
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input className="w-full h-9 pl-9 pr-3 rounded-lg border bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" placeholder="Search clients..." />
          </div>
          <button className="h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium flex items-center gap-2 hover:opacity-90 transition-opacity">
            <Plus className="h-4 w-4" /> Add Client
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clientsData.map((c, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-xl bg-card p-5 shadow-card border border-border/50"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-sm font-semibold text-card-foreground">{c.name}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">NDIS: {c.ndis}</p>
                </div>
                <button className="text-muted-foreground hover:text-foreground"><MoreHorizontal className="h-4 w-4" /></button>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between"><span className="text-muted-foreground">Plan</span><span className="text-card-foreground font-medium">{c.plan}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Funding</span><span className="text-card-foreground font-medium">{c.funding}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Workers</span><span className="text-card-foreground font-medium">{c.workers} assigned</span></div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
