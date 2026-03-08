import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Building2, Shield, Bell, Database, ChevronRight, ArrowLeft, Users } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { SecuritySettings } from "@/components/settings/SecuritySettings";
import { OrganisationSettings } from "@/components/settings/OrganisationSettings";
import { NotificationSettings } from "@/components/settings/NotificationSettings";
import { DataExportSettings } from "@/components/settings/DataExportSettings";
import { UserManagementSettings } from "@/components/settings/UserManagementSettings";

type SettingsSection = "main" | "organisation" | "security" | "notifications" | "data" | "users";

const allSections = [
  { key: "users" as const, title: "User Management", desc: "Add users, assign roles, link staff records", icon: Users, adminOnly: true },
  { key: "organisation" as const, title: "Organisation", desc: "Company name, ABN, contact details", icon: Building2, adminOnly: true },
  { key: "security" as const, title: "Security & Permissions", desc: "Role-based access control, data visibility per role", icon: Shield, adminOnly: true },
  { key: "notifications" as const, title: "Notifications", desc: "Email alerts, compliance reminders, shift notifications", icon: Bell, adminOnly: false },
  { key: "data" as const, title: "Data & Exports", desc: "Data retention, backup settings, export data", icon: Database, adminOnly: true },
];

const CONTENT: Record<Exclude<SettingsSection, "main">, React.FC> = {
  users: UserManagementSettings,
  organisation: OrganisationSettings,
  security: SecuritySettings,
  notifications: NotificationSettings,
  data: DataExportSettings,
};

export default function SettingsPage() {
  const [active, setActive] = useState<SettingsSection>("main");

  if (active !== "main") {
    const section = sections.find((s) => s.key === active)!;
    const Content = CONTENT[active];
    return (
      <AppLayout title={section.title}>
        <button
          onClick={() => setActive("main")}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Settings
        </button>
        <Content />
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Settings">
      <div className="max-w-2xl space-y-3">
        {sections.map((s, i) => (
          <motion.div
            key={s.key}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => setActive(s.key)}
            className="rounded-xl bg-card p-5 shadow-card border border-border/50 flex items-center gap-4 cursor-pointer hover:shadow-elevated transition-shadow group"
          >
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <s.icon className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-card-foreground">{s.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{s.desc}</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
          </motion.div>
        ))}
      </div>
    </AppLayout>
  );
}
