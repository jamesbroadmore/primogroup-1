import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AIChatbot } from "@/components/AIChatbot";
import { AppSidebar } from "@/components/AppSidebar";
import { Bell, AlertTriangle, ShieldCheck, Clock, X, Search } from "lucide-react";
import { getPerthDate } from "@/lib/perth-time";
import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import cartersIcon from "@/assets/icon.png";
import { useAuth } from "@/contexts/AuthContext";

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
  const { user } = useAuth();

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

  const initials = user?.user_metadata?.display_name
    ? user.user_metadata.display_name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
    : user?.email?.slice(0, 2).toUpperCase() ?? "??";

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          {/* Professional Header */}
          <header className="h-14 flex items-center justify-between bg-white border-b border-border/60 px-4 shrink-0 shadow-sm">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="text-muted-foreground hover:text-foreground h-8 w-8 rounded-lg hover:bg-secondary transition-colors" />
              {title && (
                <div className="flex items-center gap-2">
                  <h1 className="text-[15px] font-semibold text-foreground">{title}</h1>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Search button */}
              <button className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-secondary transition-colors hidden md:flex">
                <Search className="h-4 w-4" />
              </button>

              {/* Notification Bell */}
              <div className="relative" ref={panelRef}>
                <button
                  onClick={() => setNotifOpen(!notifOpen)}
                  className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-secondary transition-colors relative"
                >
                  <Bell className="h-4 w-4" />
                  {totalAlerts > 0 && (
                    <span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-destructive text-[9px] font-bold text-white flex items-center justify-center leading-none">
                      {totalAlerts > 9 ? "9+" : totalAlerts}
                    </span>
                  )}
                </button>

                {notifOpen && (
                  <div className="absolute right-0 top-10 w-80 rounded-2xl bg-white shadow-xl border border-border z-50 overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-border/60">
                      <h3 className="text-sm font-semibold text-foreground">Notifications</h3>
                      <button onClick={() => setNotifOpen(false)} className="text-muted-foreground hover:text-foreground h-6 w-6 rounded-lg hover:bg-secondary flex items-center justify-center">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    {notifications.length === 0 ? (
                      <div className="px-4 py-8 text-center">
                        <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-2">
                          <ShieldCheck className="h-5 w-5 text-success" />
                        </div>
                        <p className="text-sm font-medium text-foreground">All clear!</p>
                        <p className="text-xs text-muted-foreground mt-0.5">No alerts right now.</p>
                      </div>
                    ) : (
                      <div className="max-h-72 overflow-y-auto divide-y divide-border/40">
                        {notifications.map((n) => (
                          <button
                            key={n.id}
                            onClick={() => { setNotifOpen(false); navigate(n.href); }}
                            className="w-full flex items-start gap-3 px-4 py-3 hover:bg-secondary/50 transition-colors text-left"
                          >
                            <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${n.iconColor}`}>
                              <n.icon className="h-4 w-4" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-foreground">{n.title}</p>
                              <p className="text-xs text-muted-foreground">{n.description}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* User Avatar */}
              <div
                className="h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-bold cursor-pointer shrink-0 shadow-sm"
                style={{ background: "linear-gradient(135deg, #a78bfa, #8b5cf6)" }}
              >
                {initials}
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-auto p-4 md:p-6 bg-background">
            {children}
          </main>
        </div>
        <AIChatbot />
      </div>
    </SidebarProvider>
  );
}
