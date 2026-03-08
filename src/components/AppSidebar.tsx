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
  DollarSign,
  BarChart3,
  Settings,
  LogOut,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import cartersIcon from "@/assets/icon.png";

const navItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Staff", url: "/staff", icon: Users },
  { title: "Clients", url: "/clients", icon: UserCircle },
  { title: "Roster", url: "/roster", icon: CalendarDays },
  { title: "Check-In", url: "/check-in", icon: MapPinCheck },
  { title: "Timesheets", url: "/timesheets", icon: Clock },
  { title: "Case Notes", url: "/case-notes", icon: FileText },
  { title: "Incidents", url: "/incidents", icon: AlertTriangle },
  { title: "Compliance", url: "/compliance", icon: ShieldCheck },
  { title: "Financials", url: "/financials", icon: DollarSign },
  { title: "Reports", url: "/reports", icon: BarChart3 },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { user, signOut } = useAuth();

  const initials = user?.user_metadata?.display_name
    ? user.user_metadata.display_name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
    : user?.email?.slice(0, 2).toUpperCase() ?? "??";

  const displayName = user?.user_metadata?.display_name || user?.email || "User";

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <div className="flex items-center gap-2.5 px-4 py-5 border-b border-sidebar-border">
        <img src={cartersIcon} alt="Carters Care Group" className="h-9 w-9 shrink-0" />
        {!collapsed && (
          <div className="flex flex-col">
            <span className="text-sm font-bold text-sidebar-primary-foreground tracking-tight">
              Carters Care
            </span>
            <span className="text-[10px] text-sidebar-foreground/60 uppercase tracking-widest">
              Group
            </span>
          </div>
        )}
      </div>

      <SidebarContent className="pt-2">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <NavLink
                      to={item.url}
                      end={item.url === "/"}
                      className="flex items-center gap-3 rounded-lg px-3 py-2 text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      activeClassName="bg-sidebar-accent text-sidebar-primary-foreground font-semibold"
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span className="text-sm">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
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
