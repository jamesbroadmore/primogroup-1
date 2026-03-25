import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  Home, UserCircle, CalendarDays, MapPinCheck, FileText,
  ChevronLeft, LogOut,
} from "lucide-react";
import cartersIcon from "@/assets/icon.png";

export type WorkerNavTab = "home" | "clients" | "roster" | "checkin" | "notes";

const NAV_ITEMS: { tab: WorkerNavTab; icon: any; label: string; path: string }[] = [
  { tab: "home",    icon: Home,        label: "Home",     path: "/worker" },
  { tab: "clients", icon: UserCircle,  label: "Clients",  path: "/clients" },
  { tab: "roster",  icon: CalendarDays,label: "Roster",   path: "/roster" },
  { tab: "checkin", icon: MapPinCheck, label: "Check In", path: "/worker/check-in" },
  { tab: "notes",   icon: FileText,    label: "Notes",    path: "/worker/notes" },
];

function BottomNavItem({
  icon: Icon,
  label,
  active,
  onClick,
  badge,
}: {
  icon: any;
  label: string;
  active: boolean;
  onClick: () => void;
  badge?: number;
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-0.5 px-3 py-2 relative transition-all"
    >
      <div
        className={`relative h-10 w-10 rounded-2xl flex items-center justify-center transition-all duration-200 ${
          active ? "shadow-md scale-110" : "bg-white/50"
        }`}
        style={active ? { background: "linear-gradient(135deg, #a78bfa, #8b5cf6)" } : {}}
      >
        <Icon className={`h-5 w-5 ${active ? "text-white" : "text-slate-400"}`} />
        {badge && badge > 0 ? (
          <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
            {badge > 9 ? "9+" : badge}
          </span>
        ) : null}
      </div>
      <span className={`text-[10px] font-semibold ${active ? "text-purple-600" : "text-slate-400"}`}>
        {label}
      </span>
    </button>
  );
}

interface WorkerLayoutProps {
  children: React.ReactNode;
  title?: string;
  /** Show a back arrow instead of the logo — navigates to this path */
  backTo?: string;
  /** Show sign-out button in header */
  showSignOut?: boolean;
  /** Extra header right slot */
  headerRight?: React.ReactNode;
}

export function WorkerLayout({
  children,
  title,
  backTo,
  showSignOut = false,
  headerRight,
}: WorkerLayoutProps) {
  const { signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const activeTab =
    NAV_ITEMS.find((n) => n.path === location.pathname)?.tab ?? "home";

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "linear-gradient(160deg, #e0f2fe 0%, #d1fae5 50%, #f0fdf4 100%)" }}
    >
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white/70 backdrop-blur-md border-b border-white/60 shadow-sm">
        <div className="flex items-center justify-between px-4 h-14">
          {/* Left: back button OR logo */}
          {backTo ? (
            <button
              onClick={() => navigate(backTo)}
              className="h-9 w-9 rounded-2xl flex items-center justify-center bg-white/80 text-slate-600 hover:bg-white transition-colors shadow-sm"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <img src={cartersIcon} alt="Carter's Care" className="h-8 w-8 rounded-xl shadow-sm" />
              <span className="text-sm font-black text-slate-700 tracking-tight">Carter's Care</span>
            </div>
          )}

          {/* Center: page title */}
          {title && (
            <h1 className="text-[15px] font-bold text-slate-800 absolute left-1/2 -translate-x-1/2">
              {title}
            </h1>
          )}

          {/* Right slot */}
          <div className="flex items-center gap-2">
            {headerRight}
            {showSignOut && (
              <button
                onClick={() => signOut()}
                className="h-8 w-8 rounded-full bg-white/80 backdrop-blur flex items-center justify-center text-slate-500 hover:text-red-500 transition-colors shadow-sm"
                title="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Page content */}
      <div className="flex-1 overflow-y-auto pb-24">
        {children}
      </div>

      {/* Bottom Nav */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-white/90 backdrop-blur-xl border-t border-slate-100 shadow-xl">
        <div className="flex items-center justify-around px-2 py-1.5 max-w-lg mx-auto">
          {NAV_ITEMS.map((item) => (
            <BottomNavItem
              key={item.tab}
              icon={item.icon}
              label={item.label}
              active={activeTab === item.tab}
              onClick={() => navigate(item.path)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
