import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AIChatbot } from "@/components/AIChatbot";
import { AppSidebar } from "@/components/AppSidebar";
import { Bell, AlertTriangle, ShieldCheck, Clock, X } from "lucide-react";
import { getPerthDate } from "@/lib/perth-time";
import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import cartersIcon from "@/assets/icon.png";

interface AppLayoutProps {
  children: React.ReactNode;
  title?: string;
}

interface NotificationItem {
  id: string;
  icon: typeof AlertTriangle;
  iconColor: string;
  title: string;
  description: string;
  href: string;
  time?: string;
}

export function AppLayout({ children, title }: AppLayoutProps) {
  const [notifOpen, setNotifOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    if (notifOpen) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [notifOpen]);

  const { data: openIncidents = 0 } = useQuery({
    queryKey: ["notif-incidents"],
    queryFn: async () => {
      const { count } = await supabase.from("incidents").select("*", { count: "exact", head: true }).in("status", ["open", "investigating"]);
      return count ?? 0;
    },
  });

  const { data: complianceAlerts = 0 } = useQuery({
    queryKey: ["notif-compliance"],
    queryFn: async () => {
      const { count } = await supabase.from("compliance_records").select("*", { count: "exact", head: true }).in("status", ["expiring_soon", "expired"]);
      return count ?? 0;
    },
  });

  const { data: activeCheckins = 0 } = useQuery({
    queryKey: ["notif-checkins"],
    queryFn: async () => {
      const today = getPerthDate();
      const { count } = await supabase.from("shift_checkins").select("*", { count: "exact", head: true }).eq("shift_date", today).eq("status", "checked_in");
      return count ?? 0;
    },
  });

  const notifications: NotificationItem[] = [];
  if (openIncidents > 0) {
    notifications.push({
      id: "incidents",
      icon: AlertTriangle,
      iconColor: "text-destructive bg-destructive/10",
      title: `${openIncidents} Open Incident${openIncidents > 1 ? "s" : ""}`,
      description: "Requires immediate attention",
      href: "/incidents",
    });
  }
  if (complianceAlerts > 0) {
    notifications.push({
      id: "compliance",
      icon: ShieldCheck,
      iconColor: "text-warning bg-warning/10",
      title: `${complianceAlerts} Compliance Alert${complianceAlerts > 1 ? "s" : ""}`,
      description: "Expiring or expired records",
      href: "/compliance",
    });
  }
  if (activeCheckins > 0) {
    notifications.push({
      id: "checkins",
      icon: Clock,
      iconColor: "text-primary bg-primary/10",
      title: `${activeCheckins} Active Check-in${activeCheckins > 1 ? "s" : ""}`,
      description: "Staff currently on shift",
      href: "/check-in",
    });
  }

  const totalAlerts = openIncidents + complianceAlerts;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center justify-between border-b bg-card px-4 shrink-0">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="text-muted-foreground" />
              {title && (
                <h1 className="text-lg font-semibold text-foreground">{title}</h1>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button className="h-9 w-9 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-secondary transition-colors">
                <Search className="h-4 w-4" />
              </button>
              <div className="relative" ref={panelRef}>
                <button
                  onClick={() => setNotifOpen(!notifOpen)}
                  className="h-9 w-9 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-secondary transition-colors relative"
                >
                  <Bell className="h-4 w-4" />
                  {totalAlerts > 0 && (
                    <span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground flex items-center justify-center">
                      {totalAlerts > 9 ? "9+" : totalAlerts}
                    </span>
                  )}
                </button>

                {notifOpen && (
                  <div className="absolute right-0 top-11 w-80 rounded-xl bg-card shadow-xl border border-border z-50 overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 border-b">
                      <h3 className="text-sm font-semibold text-card-foreground">Notifications</h3>
                      <button onClick={() => setNotifOpen(false)} className="text-muted-foreground hover:text-foreground">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    {notifications.length === 0 ? (
                      <div className="px-4 py-8 text-center">
                        <p className="text-sm text-muted-foreground">All clear — no alerts right now.</p>
                      </div>
                    ) : (
                      <div className="max-h-72 overflow-y-auto">
                        {notifications.map((n) => (
                          <button
                            key={n.id}
                            onClick={() => { setNotifOpen(false); navigate(n.href); }}
                            className="w-full flex items-start gap-3 px-4 py-3 hover:bg-secondary/50 transition-colors text-left"
                          >
                            <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${n.iconColor}`}>
                              <n.icon className="h-4 w-4" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-card-foreground">{n.title}</p>
                              <p className="text-xs text-muted-foreground">{n.description}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
              <img src={cartersIcon} alt="Carters Care Group" className="h-7 w-7 ml-1 md:hidden" />
            </div>
          </header>
          <main className="flex-1 overflow-auto p-4 md:p-6">
            {children}
          </main>
        </div>
        <AIChatbot />
      </div>
    </SidebarProvider>
  );
}
