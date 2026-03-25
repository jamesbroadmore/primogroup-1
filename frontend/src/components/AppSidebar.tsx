import {
  LayoutDashboard,
  Users,
  UserCircle,
  CalendarDays,
  MapPinCheck,
  Clock,
  FileText,
  AlertTriangle,
  ShieldCheck,
  FileUp,
  DollarSign,
  Receipt,
  BarChart3,
  Settings,
  LogOut,
  GraduationCap,
  ChevronRight,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import cartersIcon from "@/assets/icon.png";
import cartersLogo from "@/assets/Carters-Logo.png";

type NavItem = {
  title: string;
  url: string;
  icon: any;
  adminOnly: boolean;
  iconClass: string;
};

type NavGroup = {
  label: string;
  adminOnly?: boolean;
  items: NavItem[];
};

const navGroups: NavGroup[] = [
  {
    label: "Overview",
    adminOnly: true,
    items: [
      { title: "Dashboard", url: "/", icon: LayoutDashboard, adminOnly: true, iconClass: "icon-purple" },
    ],
  },
  {
    label: "People",
    items: [
      { title: "Staff", url: "/staff", icon: Users, adminOnly: true, iconClass: "icon-blue" },
      { title: "Clients", url: "/clients", icon: UserCircle, adminOnly: false, iconClass: "icon-teal" },
    ],
  },
  {
    label: "Shifts",
    items: [
      { title: "Roster", url: "/roster", icon: CalendarDays, adminOnly: false, iconClass: "icon-orange" },
      { title: "Check-In", url: "/check-in", icon: MapPinCheck, adminOnly: false, iconClass: "icon-green" },
      { title: "Timesheets", url: "/timesheets", icon: Clock, adminOnly: false, iconClass: "icon-yellow" },
      { title: "Invoices", url: "/invoices", icon: Receipt, adminOnly: false, iconClass: "icon-indigo" },
    ],
  },
  {
    label: "Records",
    items: [
      { title: "Case Notes", url: "/case-notes", icon: FileText, adminOnly: false, iconClass: "icon-blue" },
      { title: "Incidents", url: "/incidents", icon: AlertTriangle, adminOnly: false, iconClass: "icon-orange" },
    ],
  },
  {
    label: "Compliance",
    items: [
      { title: "My Certs", url: "/my-compliance", icon: FileUp, adminOnly: false, iconClass: "icon-green" },
      { title: "Compliance", url: "/compliance", icon: ShieldCheck, adminOnly: true, iconClass: "icon-teal" },
    ],
  },
  {
    label: "Finance",
    adminOnly: true,
    items: [
      { title: "Financials", url: "/financials", icon: DollarSign, adminOnly: true, iconClass: "icon-green" },
      { title: "Reports", url: "/reports", icon: BarChart3, adminOnly: true, iconClass: "icon-purple" },
    ],
  },
  {
    label: "Other",
    items: [
      { title: "Onboarding", url: "/onboarding", icon: GraduationCap, adminOnly: false, iconClass: "icon-pink" },
      { title: "Settings", url: "/settings", icon: Settings, adminOnly: true, iconClass: "icon-indigo" },
    ],
  },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { user, signOut, isAdmin } = useAuth();

  const visibleGroups = navGroups
    .filter((g) => !g.adminOnly || isAdmin)
    .map((g) => ({
      ...g,
      items: isAdmin ? g.items : g.items.filter((i) => !i.adminOnly),
    }))
    .filter((g) => g.items.length > 0);

  const initials = user?.user_metadata?.display_name
    ? user.user_metadata.display_name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
    : user?.email?.slice(0, 2).toUpperCase() ?? "??";

  const displayName = user?.user_metadata?.display_name || user?.email?.split("@")[0] || "User";
  const displayEmail = user?.email || "";

  return (
    <Sidebar
      collapsible="icon"
      className="border-r border-sidebar-border bg-white shadow-sm"
      style={{ "--sidebar-width": "220px" } as any}
    >
      {/* Logo Header */}
      <div
        className={`flex items-center border-b border-sidebar-border ${
          collapsed ? "justify-center px-2 py-4" : "gap-2.5 px-4 py-4"
        }`}
      >
        <div className="relative shrink-0">
          <img
            src={cartersIcon}
            alt="Carters Care"
            className={`shrink-0 transition-all duration-200 ${collapsed ? "h-9 w-9" : "h-9 w-9"}`}
          />
        </div>
        {!collapsed && (
          <div className="flex flex-col leading-tight">
            <span className="text-[13px] font-bold tracking-tight" style={{ color: "#2d1766" }}>
              Carter's Care
            </span>
            <span className="text-[10px] text-muted-foreground font-medium tracking-wide uppercase">
              Platform
            </span>
          </div>
        )}
      </div>

      <SidebarContent className="pt-3 pb-2 overflow-y-auto scrollbar-thin">
        {visibleGroups.map((group) => (
          <div key={group.label} className="mb-1">
            {!collapsed && (
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-semibold px-4 mb-1.5">
                {group.label}
              </p>
            )}
            <div className="space-y-0.5 px-2">
              {group.items.map((item) => {
                const isActive =
                  item.url === "/"
                    ? location.pathname === "/"
                    : location.pathname.startsWith(item.url);

                return (
                  <NavLink
                    key={item.title}
                    to={item.url}
                    end={item.url === "/"}
                    className={`group flex items-center gap-3 rounded-xl px-2.5 py-2 transition-all duration-150 ${
                      isActive
                        ? "bg-primary/8 shadow-sm"
                        : "hover:bg-sidebar-accent"
                    } ${collapsed ? "justify-center px-2" : ""}`}
                    activeClassName=""
                    title={collapsed ? item.title : undefined}
                  >
                    {/* Colored Icon Box */}
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition-all duration-150 ${item.iconClass} ${
                        isActive ? "shadow-md scale-105" : "opacity-80 group-hover:opacity-100 group-hover:scale-105"
                      }`}
                    >
                      <item.icon className="h-4 w-4 text-white" />
                    </div>

                    {!collapsed && (
                      <div className="flex flex-1 items-center justify-between min-w-0">
                        <span
                          className={`text-[13px] font-medium truncate ${
                            isActive
                              ? "text-primary font-semibold"
                              : "text-sidebar-foreground group-hover:text-sidebar-accent-foreground"
                          }`}
                        >
                          {item.title}
                        </span>
                        {isActive && (
                          <ChevronRight className="h-3 w-3 text-primary shrink-0 ml-1" />
                        )}
                      </div>
                    )}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </SidebarContent>

      {/* Footer / User Profile */}
      <SidebarFooter className="border-t border-sidebar-border p-3">
        <div
          className={`flex items-center gap-3 rounded-xl p-2 hover:bg-sidebar-accent transition-colors cursor-pointer ${
            collapsed ? "justify-center" : ""
          }`}
        >
          {/* Avatar with gradient */}
          <div className="relative shrink-0">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-full text-white text-xs font-bold shadow-sm"
              style={{ background: "linear-gradient(135deg, #a78bfa, #8b5cf6)" }}
            >
              {initials}
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-green-400 border-2 border-white" />
          </div>

          {!collapsed && (
            <div className="flex flex-1 items-center justify-between min-w-0">
              <div className="flex flex-col min-w-0">
                <span className="text-[12px] font-semibold text-sidebar-accent-foreground truncate">
                  {displayName}
                </span>
                <span className="text-[10px] text-muted-foreground truncate">{displayEmail}</span>
              </div>
              <button
                onClick={() => signOut()}
                className="text-muted-foreground hover:text-destructive transition-colors shrink-0 ml-2 p-1 rounded-lg hover:bg-destructive/10"
                title="Sign out"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
