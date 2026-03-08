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
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import cartersIcon from "@/assets/icon.png";

type NavItem = {
  title: string;
  url: string;
  icon: any;
  adminOnly: boolean;
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
      { title: "Dashboard", url: "/", icon: LayoutDashboard, adminOnly: true },
    ],
  },
  {
    label: "People",
    items: [
      { title: "Staff", url: "/staff", icon: Users, adminOnly: true },
      { title: "Clients", url: "/clients", icon: UserCircle, adminOnly: false },
    ],
  },
  {
    label: "Shifts",
    items: [
      { title: "Roster", url: "/roster", icon: CalendarDays, adminOnly: false },
      { title: "Check-In", url: "/check-in", icon: MapPinCheck, adminOnly: false },
      { title: "Timesheets", url: "/timesheets", icon: Clock, adminOnly: false },
    ],
  },
  {
    label: "Records",
    items: [
      { title: "Case Notes", url: "/case-notes", icon: FileText, adminOnly: false },
      { title: "Incidents", url: "/incidents", icon: AlertTriangle, adminOnly: false },
    ],
  },
  {
    label: "Compliance",
    items: [
      { title: "My Certs", url: "/my-compliance", icon: FileUp, adminOnly: false },
      { title: "Compliance", url: "/compliance", icon: ShieldCheck, adminOnly: true },
    ],
  },
  {
    label: "Finance",
    adminOnly: true,
    items: [
      { title: "Financials", url: "/financials", icon: DollarSign, adminOnly: true },
      { title: "Reports", url: "/reports", icon: BarChart3, adminOnly: true },
    ],
  },
  {
    label: "Other",
    items: [
      { title: "Onboarding", url: "/onboarding", icon: GraduationCap, adminOnly: false },
      { title: "Settings", url: "/settings", icon: Settings, adminOnly: false },
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

  const displayName = user?.user_metadata?.display_name || user?.email || "User";

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <div className={`flex items-center border-b border-sidebar-border ${collapsed ? "justify-center px-2 py-4" : "justify-center px-4 py-5"}`}>
        <img
          src={cartersIcon}
          alt="Carters Care Group"
          className={`shrink-0 transition-all duration-200 ${collapsed ? "h-8 w-8" : "h-12 w-12"}`}
        />
      </div>

      <SidebarContent className="pt-1">
        {visibleGroups.map((group) => (
          <SidebarGroup key={group.label} className="py-1">
            {!collapsed && (
              <SidebarGroupLabel className="text-[10px] uppercase tracking-wider text-sidebar-foreground/40 px-3 mb-0.5">
                {group.label}
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild tooltip={item.title}>
                      <NavLink
                        to={item.url}
                        end={item.url === "/"}
                        className="flex items-center gap-3 rounded-lg px-3 py-1.5 text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                        activeClassName="bg-sidebar-accent text-sidebar-primary-foreground font-semibold"
                      >
                        <item.icon className="h-4 w-4 shrink-0" />
                        {!collapsed && <span className="text-[13px]">{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-3">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sidebar-accent text-sidebar-foreground text-xs font-semibold">
            {initials}
          </div>
          {!collapsed && (
            <div className="flex flex-1 items-center justify-between">
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-medium text-sidebar-accent-foreground truncate">
                  {displayName}
                </span>
                <span className="text-[10px] text-sidebar-foreground/50 truncate">{user?.email}</span>
              </div>
              <button
                onClick={() => signOut()}
                className="text-sidebar-foreground/50 hover:text-sidebar-foreground transition-colors shrink-0"
                title="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
