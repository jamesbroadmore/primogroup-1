import { AppLayout } from "@/components/AppLayout";
import { Building2, Shield, Bell, Database } from "lucide-react";
import { motion } from "framer-motion";

const sections = [
  { title: "Organisation", desc: "Company name, ABN, contact details", icon: Building2 },
  { title: "Security", desc: "Password policies, session management, audit logs", icon: Shield },
  { title: "Notifications", desc: "Email alerts, compliance reminders, shift notifications", icon: Bell },
  { title: "Data & Exports", desc: "Data retention, backup settings, API access", icon: Database },
];

export default function SettingsPage() {
  return (
    <AppLayout title="Settings">
      <div className="max-w-2xl space-y-4">
        {sections.map((s, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="rounded-xl bg-card p-5 shadow-card border border-border/50 flex items-center gap-4 cursor-pointer hover:shadow-elevated transition-shadow"
          >
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <s.icon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-card-foreground">{s.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{s.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </AppLayout>
  );
}
