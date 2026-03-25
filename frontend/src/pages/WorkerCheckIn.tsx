import { useState, useEffect, useCallback, useRef } from "react";
import { WorkerLayout } from "@/components/WorkerLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  Navigation, LogIn, LogOut, CheckCircle2, Loader2,
  FileText, AlertTriangle, MapPin, Clock, ChevronRight,
  RotateCcw, User, Timer, Calendar,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { getPerthDate, formatPerthTime } from "@/lib/perth-time";
import { fullName } from "@/lib/display-names";

// ── GPS hook ────────────────────────────────────────────────────────────────
interface GpsPosition { lat: number; lng: number; accuracy: number }

function useGps() {
  const [position, setPosition] = useState<GpsPosition | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError("Geolocation not supported");
      return;
    }
    setLoading(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy });
        setLoading(false);
      },
      (err) => { setError(err.message); setLoading(false); },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  }, []);

  return { position, error, loading, requestLocation };
}

// ── Staff profile hook ───────────────────────────────────────────────────────
function useMyStaff() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["worker-staff", user?.id],
    enabled: !!user,
    queryFn: async () => {
      if (!user) return null;
      const { data: profile } = await supabase
        .from("profiles").select("staff_id, display_name").eq("user_id", user.id).single();
      if (!profile?.staff_id) return { staffId: null, staffName: profile?.display_name || user.email || "Unknown" };
      const { data: staff } = await supabase
        .from("staff").select("id, first_name, last_name, preferred_name").eq("id", profile.staff_id).single();
      if (!staff) return { staffId: profile.staff_id, staffName: profile.display_name || user.email || "Unknown" };
      return { staffId: staff.id, staffName: `${staff.preferred_name || staff.first_name} ${staff.last_name}` };
    },
  });
}

// ── Elapsed timer display ────────────────────────────────────────────────────
function ElapsedTimer({ startTime }: { startTime: string }) {
  const [elapsed, setElapsed] = useState(() => formatDistanceToNow(new Date(startTime)));
  useEffect(() => {
    const id = setInterval(() => setElapsed(formatDistanceToNow(new Date(startTime))), 30000);
    return () => clearInterval(id);
  }, [startTime]);
  return <>{elapsed}</>;
}

// ── GPS pill ─────────────────────────────────────────────────────────────────
function GpsPill({
  position,
  error,
  loading,
  onRefresh,
}: {
  position: GpsPosition | null;
  error: string | null;
  loading: boolean;
  onRefresh: () => void;
}) {
  const ok = !!position;
  const bad = !!error;

  return (
    <div
      className="flex items-center gap-3 px-4 py-3 rounded-2xl border"
      style={{
        background: ok ? "linear-gradient(135deg, #f0fdf4, #dcfce7)" :
          bad ? "linear-gradient(135deg, #fff1f2, #fee2e2)" :
          "linear-gradient(135deg, #f8fafc, #f1f5f9)",
        borderColor: ok ? "#86efac" : bad ? "#fca5a5" : "#cbd5e1",
      }}
    >
      <div
        className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
        style={{
          background: ok ? "linear-gradient(135deg, #4ade80, #22c55e)" :
            bad ? "linear-gradient(135deg, #f87171, #ef4444)" :
            "linear-gradient(135deg, #94a3b8, #64748b)",
        }}
      >
        {loading
          ? <Loader2 className="h-5 w-5 text-white animate-spin" />
          : <Navigation className="h-5 w-5 text-white" />
        }
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-bold ${ok ? "text-emerald-800" : bad ? "text-red-700" : "text-slate-700"}`}>
          {loading ? "Getting location…" : ok ? "Location confirmed ✓" : "Location required"}
        </p>
        <p className={`text-[11px] truncate ${ok ? "text-emerald-600" : bad ? "text-red-500" : "text-slate-500"}`}>
          {ok
            ? `${position!.lat.toFixed(4)}, ${position!.lng.toFixed(4)}  ±${Math.round(position!.accuracy)}m`
            : error || "Allow location access to continue"}
        </p>
      </div>
      <button
        onClick={onRefresh}
        className="shrink-0 h-8 w-8 rounded-xl flex items-center justify-center bg-white/80 text-slate-500 hover:text-purple-600 hover:bg-purple-50 transition-colors shadow-sm"
        title="Refresh location"
      >
        <RotateCcw className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

// ── Clock-out slide-up panel ──────────────────────────────────────────────────
function ClockOutPanel({
  open,
  onCancel,
  onSubmit,
  isPending,
  hasPosition,
}: {
  open: boolean;
  onCancel: () => void;
  onSubmit: (note: string) => void;
  isPending: boolean;
  hasPosition: boolean;
}) {
  const [note, setNote] = useState("");
  const textRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open) setTimeout(() => textRef.current?.focus(), 300);
    else setNote("");
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onCancel}
          />
          {/* Sheet */}
          <motion.div
            className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl overflow-hidden max-h-[88vh] flex flex-col"
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            {/* Handle bar */}
            <div className="flex justify-center pt-3 pb-1 shrink-0">
              <div className="h-1 w-10 rounded-full bg-slate-200" />
            </div>

            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl flex items-center justify-center shadow-sm" style={{ background: "linear-gradient(135deg, #fbbf24, #f59e0b)" }}>
                  <FileText className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-800">Case Note Required</h2>
                  <p className="text-xs text-slate-500">Compulsory before clocking out</p>
                </div>
              </div>
            </div>

            <div className="p-5 space-y-4 flex-1 overflow-y-auto">
              {/* Reminder banner */}
              <div className="flex items-start gap-2.5 px-3.5 py-3 rounded-2xl bg-amber-50 border border-amber-200">
                <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700 leading-relaxed">
                  A detailed case note is <strong>mandatory</strong> for every shift. Include support provided, client mood, activities completed, and any observations.
                </p>
              </div>

              {/* Note textarea */}
              <div>
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2 block">
                  Shift Summary <span className="text-red-400">*</span>
                </label>
                <textarea
                  ref={textRef}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Describe the support provided today — client mood, activities completed, any concerns or observations…"
                  rows={6}
                  maxLength={3000}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-300 transition-all resize-none"
                />
                <p className="text-[10px] text-slate-400 text-right mt-1">{note.length}/3000</p>
              </div>
            </div>

            {/* Actions */}
            <div className="px-5 pb-6 pt-3 space-y-2 shrink-0 border-t border-slate-100">
              <button
                onClick={() => onSubmit(note)}
                disabled={isPending || !note.trim() || !hasPosition}
                className="w-full h-14 rounded-2xl text-white text-[15px] font-bold flex items-center justify-center gap-3 hover:opacity-90 transition-all disabled:opacity-40 shadow-lg"
                style={{ background: "linear-gradient(135deg, #f87171, #ef4444)" }}
              >
                {isPending
                  ? <Loader2 className="h-5 w-5 animate-spin" />
                  : <LogOut className="h-5 w-5" />
                }
                Submit Note & Clock Out
              </button>
              <button
                onClick={onCancel}
                className="w-full h-10 rounded-2xl text-sm font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                Cancel — stay on shift
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function WorkerCheckIn() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { position, error: gpsError, loading: gpsLoading, requestLocation } = useGps();
  const { data: myStaff, isLoading: staffLoading } = useMyStaff();

  const [clientId, setClientId] = useState("");
  const [startNote, setStartNote] = useState("");
  const [showClockOut, setShowClockOut] = useState(false);

  useEffect(() => { requestLocation(); }, [requestLocation]);

  // Client list
  const { data: clientList = [] } = useQuery({
    queryKey: ["worker-client-list"],
    queryFn: async () => {
      const { data } = await supabase
        .from("clients").select("id, first_name, last_name, preferred_name").eq("status", "active").order("first_name");
      return data ?? [];
    },
  });

  // Today's check-ins — only for this worker
  const { data: myCheckins = [], isLoading: checkinsLoading } = useQuery({
    queryKey: ["my-checkins-today", myStaff?.staffId],
    enabled: !!myStaff?.staffId,
    queryFn: async () => {
      const today = getPerthDate();
      const { data } = await supabase
        .from("shift_checkins")
        .select("*")
        .eq("staff_id", myStaff!.staffId)
        .gte("created_at", `${today}T00:00:00.000Z`)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
    refetchInterval: 20000,
  });

  // All recent check-ins for this worker (history)
  const { data: myHistory = [] } = useQuery({
    queryKey: ["my-checkins-history", myStaff?.staffId],
    enabled: !!myStaff?.staffId,
    queryFn: async () => {
      const { data } = await supabase
        .from("shift_checkins")
        .select("*")
        .eq("staff_id", myStaff!.staffId)
        .order("created_at", { ascending: false })
        .limit(10);
      return data ?? [];
    },
  });

  const activeCheckin = myCheckins.find((c: any) => c.status === "checked_in");

  // Clock In mutation
  const clockIn = useMutation({
    mutationFn: async () => {
      if (!myStaff?.staffId) throw new Error("Your account is not linked to a staff record. Contact your administrator.");
      if (!position) throw new Error("Enable location access to clock in.");
      if (!clientId) throw new Error("Please select a client.");

      const client = clientList.find((c: any) => c.id === clientId);
      const { error } = await supabase.from("shift_checkins").insert({
        staff_id: myStaff.staffId,
        staff_name: myStaff.staffName,
        client_name: client ? fullName(client) : null,
        check_in_time: new Date().toISOString(),
        check_in_lat: position.lat,
        check_in_lng: position.lng,
        notes: startNote.trim() || null,
        status: "checked_in",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Clocked in! Have a great shift ✓");
      queryClient.invalidateQueries({ queryKey: ["my-checkins-today"] });
      queryClient.invalidateQueries({ queryKey: ["my-checkins-history"] });
      setStartNote("");
      setClientId("");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  // Clock Out mutation
  const clockOut = useMutation({
    mutationFn: async (note: string) => {
      if (!activeCheckin) throw new Error("No active check-in.");
      if (!position) throw new Error("Enable location access to clock out.");
      if (!note.trim()) throw new Error("Case note is required.");

      // Save case note if linked to staff
      if (myStaff?.staffId) {
        const client = clientList.find((c: any) => fullName(c) === activeCheckin.client_name);
        const { error: noteErr } = await supabase.from("case_notes").insert({
          staff_id: myStaff.staffId,
          client_id: client?.id || null,
          category: "general",
          content: note.trim(),
        });
        if (noteErr) throw new Error(`Failed to save case note: ${noteErr.message}`);
      }

      // Update check-in record
      const { error } = await supabase
        .from("shift_checkins")
        .update({
          check_out_time: new Date().toISOString(),
          check_out_lat: position.lat,
          check_out_lng: position.lng,
          status: "checked_out",
        })
        .eq("id", activeCheckin.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Clocked out. Case note saved ✓");
      queryClient.invalidateQueries({ queryKey: ["my-checkins-today"] });
      queryClient.invalidateQueries({ queryKey: ["my-checkins-history"] });
      queryClient.invalidateQueries({ queryKey: ["case-notes"] });
      queryClient.invalidateQueries({ queryKey: ["worker-my-notes"] });
      setShowClockOut(false);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const canClockIn = !!position && !!myStaff?.staffId && !staffLoading && !!clientId;

  return (
    <WorkerLayout title="Shift Check-In">
      <div className="px-4 pt-5 pb-4 space-y-4 max-w-lg mx-auto">

        {/* GPS status pill */}
        <GpsPill
          position={position}
          error={gpsError}
          loading={gpsLoading}
          onRefresh={requestLocation}
        />

        {/* Staff identity */}
        <AnimatePresence mode="wait">
          {myStaff && (
            <motion.div
              key="staff-card"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl border ${
                myStaff.staffId
                  ? "bg-white border-slate-100 shadow-sm"
                  : "bg-red-50 border-red-200"
              }`}
            >
              <div
                className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0"
                style={{
                  background: myStaff.staffId
                    ? "linear-gradient(135deg, #a78bfa, #8b5cf6)"
                    : "linear-gradient(135deg, #f87171, #ef4444)",
                }}
              >
                <User className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">{myStaff.staffName}</p>
                <p className={`text-xs ${myStaff.staffId ? "text-slate-400" : "text-red-600"}`}>
                  {myStaff.staffId ? "Verified staff account" : "Not linked to a staff record — contact admin"}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── MAIN PANEL ────────────────────────────────────── */}
        <AnimatePresence mode="wait">
          {activeCheckin ? (
            /* ── ON SHIFT STATE ── */
            <motion.div
              key="on-shift"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              className="rounded-3xl overflow-hidden shadow-lg"
            >
              {/* Green hero */}
              <div
                className="px-5 pt-6 pb-5"
                style={{ background: "linear-gradient(135deg, #4ade80 0%, #22c55e 60%, #16a34a 100%)" }}
              >
                <div className="flex items-center gap-1.5 mb-3">
                  <span className="h-2.5 w-2.5 rounded-full bg-white animate-pulse" />
                  <span className="text-xs font-bold text-white/90 uppercase tracking-widest">Live Shift</span>
                </div>
                <h2 className="text-2xl font-black text-white mb-1">On Shift</h2>
                <p className="text-white/80 text-sm font-medium">
                  Started at {formatPerthTime(activeCheckin.check_in_time!)}
                </p>
              </div>

              {/* Shift details */}
              <div className="bg-white p-5 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-slate-50 border border-slate-100 p-3.5">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Timer className="h-3.5 w-3.5 text-slate-400" />
                      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Duration</p>
                    </div>
                    <p className="text-sm font-bold text-slate-800">
                      <ElapsedTimer startTime={activeCheckin.check_in_time!} />
                    </p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 border border-slate-100 p-3.5">
                    <div className="flex items-center gap-1.5 mb-1">
                      <User className="h-3.5 w-3.5 text-slate-400" />
                      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Client</p>
                    </div>
                    <p className="text-sm font-bold text-slate-800 truncate">
                      {activeCheckin.client_name || "—"}
                    </p>
                  </div>
                </div>

                {activeCheckin.check_in_lat && (
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <MapPin className="h-3.5 w-3.5 text-emerald-500" />
                    <span>Location verified at check-in</span>
                  </div>
                )}

                {/* Clock out button */}
                <button
                  onClick={() => setShowClockOut(true)}
                  disabled={!position}
                  className="w-full h-14 rounded-2xl text-white text-base font-bold flex items-center justify-center gap-3 transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-40 shadow-lg"
                  style={{ background: "linear-gradient(135deg, #f87171, #ef4444)" }}
                >
                  <LogOut className="h-5 w-5" />
                  Clock Out
                </button>

                {!position && (
                  <p className="text-center text-xs text-red-500 -mt-2">Enable location to clock out</p>
                )}
              </div>
            </motion.div>
          ) : (
            /* ── NOT ON SHIFT STATE ── */
            <motion.div
              key="not-on-shift"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              className="rounded-3xl overflow-hidden shadow-lg"
            >
              {/* Purple hero */}
              <div
                className="px-5 pt-6 pb-5"
                style={{ background: "linear-gradient(135deg, #a78bfa 0%, #8b5cf6 60%, #7c3aed 100%)" }}
              >
                <h2 className="text-2xl font-black text-white mb-1">Ready to Start?</h2>
                <p className="text-white/75 text-sm">Select your client and confirm location</p>
              </div>

              <div className="bg-white p-5 space-y-4">
                {/* Client picker */}
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">
                    Client <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={clientId}
                      onChange={(e) => setClientId(e.target.value)}
                      className="w-full h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-800 appearance-none focus:outline-none focus:ring-2 focus:ring-purple-400/50 focus:border-purple-300 transition-all"
                    >
                      <option value="">Select a client…</option>
                      {clientList.map((c: any) => (
                        <option key={c.id} value={c.id}>
                          {c.preferred_name ? `${c.preferred_name} ${c.last_name}` : `${c.first_name} ${c.last_name}`}
                        </option>
                      ))}
                    </select>
                    <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 rotate-90 pointer-events-none" />
                  </div>
                  {!clientId && (
                    <p className="text-[11px] text-amber-600 mt-1.5 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3 shrink-0" />
                      Required before clocking in
                    </p>
                  )}
                </div>

                {/* Optional start note */}
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Start Notes</label>
                  <textarea
                    value={startNote}
                    onChange={(e) => setStartNote(e.target.value)}
                    placeholder="Anything to note at the start of this shift…"
                    rows={2}
                    maxLength={500}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-400/50 resize-none transition-all"
                  />
                </div>

                {/* Clock In button */}
                <button
                  onClick={() => clockIn.mutate()}
                  disabled={clockIn.isPending || !canClockIn}
                  className="w-full h-14 rounded-2xl text-white text-[15px] font-bold flex items-center justify-center gap-3 transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-40 shadow-lg"
                  style={{ background: "linear-gradient(135deg, #a78bfa, #8b5cf6)" }}
                >
                  {clockIn.isPending
                    ? <Loader2 className="h-5 w-5 animate-spin" />
                    : <LogIn className="h-5 w-5" />
                  }
                  Clock In
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── MY SHIFT HISTORY ─────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="rounded-3xl bg-white shadow-sm overflow-hidden border border-white/80"
        >
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className="h-7 w-7 rounded-xl flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, #60a5fa, #3b82f6)" }}
              >
                <Clock className="h-3.5 w-3.5 text-white" />
              </div>
              <h3 className="text-sm font-bold text-slate-700">My Shifts</h3>
            </div>
            <span className="text-[11px] text-slate-400 font-medium">{myHistory.length} recent</span>
          </div>

          {checkinsLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-slate-300" />
            </div>
          ) : myHistory.length === 0 ? (
            <div className="py-10 text-center">
              <Calendar className="h-8 w-8 text-slate-200 mx-auto mb-2" />
              <p className="text-sm text-slate-400">No shifts recorded yet</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {myHistory.map((c: any) => {
                const isActive = c.status === "checked_in";
                const hasOut = !!c.check_out_time;
                return (
                  <div key={c.id} className="flex items-center gap-3 px-5 py-3.5">
                    {/* Status indicator */}
                    <div
                      className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0"
                      style={{
                        background: isActive
                          ? "linear-gradient(135deg, #dcfce7, #bbf7d0)"
                          : "linear-gradient(135deg, #f1f5f9, #e2e8f0)",
                      }}
                    >
                      {isActive
                        ? <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500" />
                        : <Clock className="h-4 w-4 text-slate-400" />
                      }
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-700 truncate">
                        {c.client_name || "No client assigned"}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {formatPerthTime(c.check_in_time!)}
                        {hasOut && ` → ${formatPerthTime(c.check_out_time)}`}
                        {c.check_in_lat && (
                          <span className="ml-1.5 inline-flex items-center gap-0.5 text-teal-500">
                            <MapPin className="h-2.5 w-2.5" /> GPS
                          </span>
                        )}
                      </p>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                        isActive
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {isActive ? "Active" : "Done"}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>

      {/* Clock-out slide-up sheet */}
      <ClockOutPanel
        open={showClockOut}
        onCancel={() => setShowClockOut(false)}
        onSubmit={(note) => clockOut.mutate(note)}
        isPending={clockOut.isPending}
        hasPosition={!!position}
      />
    </WorkerLayout>
  );
}
