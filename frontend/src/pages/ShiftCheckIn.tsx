import { useState, useEffect, useCallback } from "react";
import { AppLayout } from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin, Clock, LogIn, LogOut, Navigation, CheckCircle2,
  Loader2, History, FileText, AlertTriangle, MapPinCheck, User,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { getPerthDate, formatPerthTime } from "@/lib/perth-time";
import { fullName } from "@/lib/display-names";
import { Avatar } from "@/components/ui-kit";

interface GpsPosition { lat: number; lng: number; accuracy: number; }

function useGps() {
  const [position, setPosition] = useState<GpsPosition | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) { setError("Geolocation is not supported by your browser"); return; }
    setLoading(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => { setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy }); setLoading(false); },
      (err) => { setError(err.message); setLoading(false); },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, []);

  return { position, error, loading, requestLocation };
}

function useStaffProfile() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my-staff-profile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data: profile } = await supabase
        .from("profiles").select("staff_id, display_name").eq("user_id", user.id).single();
      if (!profile?.staff_id) return { staffId: null, staffName: profile?.display_name || user.email || "Unknown" };
      const { data: staff } = await supabase
        .from("staff").select("id, first_name, last_name, preferred_name").eq("id", profile.staff_id).single();
      if (!staff) return { staffId: profile.staff_id, staffName: profile.display_name || user.email || "Unknown" };
      const name = staff.preferred_name || staff.first_name;
      return { staffId: staff.id, staffName: `${name} ${staff.last_name}` };
    },
    enabled: !!user,
  });
}

export default function ShiftCheckIn() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { position, error: gpsError, loading: gpsLoading, requestLocation } = useGps();
  const { data: staffProfile, isLoading: staffLoading } = useStaffProfile();
  const [clientId, setClientId] = useState("");
  const [notes, setNotes] = useState("");
  const [clockOutNote, setClockOutNote] = useState("");
  const [showClockOutForm, setShowClockOutForm] = useState(false);

  useEffect(() => { requestLocation(); }, [requestLocation]);

  const { data: clientList = [] } = useQuery({
    queryKey: ["client-list-checkin"],
    queryFn: async () => {
      const { data, error } = await supabase.from("clients").select("id, first_name, last_name, preferred_name").eq("status", "active").order("first_name");
      if (error) throw error;
      return data;
    },
  });

  const { data: todayCheckins = [], isLoading } = useQuery({
    queryKey: ["shift-checkins-today"],
    queryFn: async () => {
      const today = getPerthDate();
      const { data, error } = await supabase.from("shift_checkins").select("*").eq("shift_date", today).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    refetchInterval: 30000,
  });

  const { data: recentHistory = [] } = useQuery({
    queryKey: ["shift-checkins-history"],
    queryFn: async () => {
      const { data, error } = await supabase.from("shift_checkins").select("*").order("created_at", { ascending: false }).limit(20);
      if (error) throw error;
      return data;
    },
  });

  const activeCheckin = todayCheckins.find((c: any) => c.status === "checked_in");

  const clockIn = useMutation({
    mutationFn: async () => {
      if (!staffProfile?.staffId) throw new Error("Your account is not linked to a staff record. Contact your administrator.");
      if (!position) throw new Error("GPS location required. Please enable location access.");
      if (!clientId) throw new Error("Please select a client before clocking in.");

      const selectedClient = clientList.find(c => c.id === clientId);
      const clientDisplayName = selectedClient ? fullName(selectedClient) : null;

      const { error } = await supabase.from("shift_checkins").insert({
        staff_id: staffProfile.staffId,
        staff_name: staffProfile.staffName,
        client_name: clientDisplayName,
        check_in_time: new Date().toISOString(),
        check_in_lat: position.lat,
        check_in_lng: position.lng,
        notes: notes.trim() || null,
        status: "checked_in",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Clocked in successfully!");
      queryClient.invalidateQueries({ queryKey: ["shift-checkins-today"] });
      queryClient.invalidateQueries({ queryKey: ["shift-checkins-history"] });
      setNotes("");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const clockOut = useMutation({
    mutationFn: async () => {
      if (!activeCheckin) throw new Error("No active check-in found");
      if (!position) throw new Error("GPS location required. Please enable location access.");
      if (!clockOutNote.trim()) throw new Error("A case note is required before clocking out.");

      if (staffProfile?.staffId && clientId) {
        const { error: noteError } = await supabase.from("case_notes").insert({
          client_id: clientId,
          staff_id: staffProfile.staffId,
          category: "general",
          content: clockOutNote.trim(),
        });
        if (noteError) throw new Error(`Failed to save case note: ${noteError.message}`);
      }

      const { error } = await supabase
        .from("shift_checkins")
        .update({ check_out_time: new Date().toISOString(), check_out_lat: position.lat, check_out_lng: position.lng, status: "checked_out" })
        .eq("id", activeCheckin.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Clocked out! Case note saved.");
      queryClient.invalidateQueries({ queryKey: ["shift-checkins-today"] });
      queryClient.invalidateQueries({ queryKey: ["shift-checkins-history"] });
      queryClient.invalidateQueries({ queryKey: ["case-notes"] });
      setClockOutNote("");
      setShowClockOutForm(false);
      setClientId("");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const canClockIn = !!position && !!staffProfile?.staffId && !staffLoading && !!clientId;

  return (
    <AppLayout title="Shift Check-In">
      <div className="max-w-2xl mx-auto space-y-5">

        {/* GPS Location Card */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-white border border-border/50 shadow-sm overflow-hidden"
        >
          <div className="h-1.5" style={{
            background: position ? "linear-gradient(90deg, #4ade80, #22c55e)" :
              gpsError ? "linear-gradient(90deg, #f87171, #ef4444)" : "linear-gradient(90deg, #94a3b8, #64748b)"
          }} />
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`h-11 w-11 rounded-2xl flex items-center justify-center shadow-sm ${
                position ? "" : gpsError ? "" : ""
              }`} style={{
                background: position ? "linear-gradient(135deg, #4ade80, #22c55e)" :
                  gpsError ? "linear-gradient(135deg, #f87171, #ef4444)" : "linear-gradient(135deg, #94a3b8, #64748b)"
              }}>
                {gpsLoading ? <Loader2 className="h-5 w-5 text-white animate-spin" /> : <Navigation className="h-5 w-5 text-white" />}
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">
                  {gpsLoading ? "Getting location..." : position ? "Location captured ✓" : "Location unavailable"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {position
                    ? `${position.lat.toFixed(5)}, ${position.lng.toFixed(5)} (±${Math.round(position.accuracy)}m)`
                    : gpsError || "Enable location services to continue"}
                </p>
              </div>
            </div>
            <button
              onClick={requestLocation}
              className="text-xs font-semibold text-purple-600 bg-purple-50 border border-purple-200 hover:bg-purple-100 transition-colors px-3 py-1.5 rounded-lg"
            >
              Refresh
            </button>
          </div>
        </motion.div>

        {/* Staff Identity Card */}
        {staffProfile && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.03 }}
            className={`rounded-2xl border shadow-sm p-4 flex items-center gap-3 ${
              staffProfile.staffId
                ? "bg-white border-border/50"
                : "bg-red-50 border-red-200"
            }`}
          >
            <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0" style={{
              background: staffProfile.staffId
                ? "linear-gradient(135deg, #a78bfa, #8b5cf6)"
                : "linear-gradient(135deg, #f87171, #ef4444)"
            }}>
              <User className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">{staffProfile.staffName}</p>
              {!staffProfile.staffId ? (
                <p className="text-xs text-red-600 mt-0.5">Account not linked to staff record — contact admin</p>
              ) : (
                <p className="text-xs text-muted-foreground">Linked staff account</p>
              )}
            </div>
          </motion.div>
        )}

        {/* Main Check-In / Check-Out Panel */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}
          className="rounded-2xl bg-white border border-border/50 shadow-sm overflow-hidden"
        >
          {activeCheckin ? (
            <div>
              {/* Active shift header */}
              <div className="p-5 flex items-center gap-4" style={{ background: "linear-gradient(135deg, #dcfce7, #bbf7d0)" }}>
                <div className="h-14 w-14 rounded-2xl flex items-center justify-center shadow-md" style={{ background: "linear-gradient(135deg, #4ade80, #22c55e)" }}>
                  <CheckCircle2 className="h-7 w-7 text-white" />
                </div>
                <div>
                  <p className="text-lg font-bold text-emerald-800">Currently On Shift</p>
                  <p className="text-sm text-emerald-700">
                    {activeCheckin.staff_name} · Since {formatPerthTime(activeCheckin.check_in_time!)}
                  </p>
                </div>
              </div>

              <div className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-slate-50 border border-slate-200 p-3">
                    <p className="text-xs text-muted-foreground mb-0.5">Duration</p>
                    <p className="text-sm font-bold text-foreground">{formatDistanceToNow(new Date(activeCheckin.check_in_time!))}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 border border-slate-200 p-3">
                    <p className="text-xs text-muted-foreground mb-0.5">Client</p>
                    <p className="text-sm font-bold text-foreground truncate">{activeCheckin.client_name || "—"}</p>
                  </div>
                </div>

                {!showClockOutForm ? (
                  <button
                    onClick={() => setShowClockOutForm(true)}
                    disabled={!position}
                    className="w-full h-14 rounded-2xl text-white text-base font-bold flex items-center justify-center gap-3 hover:opacity-90 transition-all disabled:opacity-50 shadow-lg"
                    style={{ background: "linear-gradient(135deg, #f87171, #ef4444)" }}
                  >
                    <LogOut className="h-5 w-5" /> Clock Out
                  </button>
                ) : (
                  <div className="space-y-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-amber-600" />
                      <p className="text-sm font-bold text-amber-800">Case Note Required to Clock Out</p>
                    </div>
                    <p className="text-xs text-amber-700">
                      A case note is <strong>compulsory</strong> after every shift. Describe support provided, observations, and client wellbeing.
                    </p>
                    <textarea
                      value={clockOutNote}
                      onChange={(e) => setClockOutNote(e.target.value)}
                      placeholder="Describe the support provided, client mood, activities completed..."
                      rows={4}
                      maxLength={2000}
                      className="w-full rounded-xl border border-amber-200 bg-white px-3 py-2.5 text-sm text-foreground placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400/50 resize-none"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowClockOutForm(false)}
                        className="flex-1 h-10 rounded-xl border border-slate-200 text-sm font-medium text-foreground hover:bg-slate-50 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => clockOut.mutate()}
                        disabled={clockOut.isPending || !position || !clockOutNote.trim()}
                        className="flex-1 h-10 rounded-xl text-white text-sm font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50 shadow-md"
                        style={{ background: "linear-gradient(135deg, #f87171, #ef4444)" }}
                      >
                        {clockOut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
                        Submit & Clock Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div>
              {/* Start shift header */}
              <div className="p-5 flex items-center gap-4" style={{ background: "linear-gradient(135deg, #ede9fe, #ddd6fe)" }}>
                <div className="h-14 w-14 rounded-2xl flex items-center justify-center shadow-md" style={{ background: "linear-gradient(135deg, #a78bfa, #8b5cf6)" }}>
                  <MapPinCheck className="h-7 w-7 text-white" />
                </div>
                <div>
                  <p className="text-lg font-bold text-purple-800">Start Your Shift</p>
                  <p className="text-sm text-purple-600">Select client and confirm location</p>
                </div>
              </div>

              <div className="p-5 space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2 block">Client <span className="text-red-400">*</span></label>
                  <select
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                    className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-purple-400/50 focus:border-purple-300 transition-all appearance-none"
                  >
                    <option value="">Select client...</option>
                    {clientList.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.preferred_name ? `${c.preferred_name} ${c.last_name}` : `${c.first_name} ${c.last_name}`}
                      </option>
                    ))}
                  </select>
                  {!clientId && (
                    <p className="text-[11px] text-amber-600 mt-1.5 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" /> Client selection is required to clock in
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2 block">Start Notes</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Any notes for this shift..."
                    rows={2}
                    maxLength={1000}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-foreground placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-400/50 resize-none"
                  />
                </div>

                <button
                  onClick={() => clockIn.mutate()}
                  disabled={clockIn.isPending || !canClockIn}
                  className="w-full h-14 rounded-2xl text-white text-base font-bold flex items-center justify-center gap-3 hover:opacity-90 transition-all disabled:opacity-50 shadow-lg"
                  style={{ background: "linear-gradient(135deg, #a78bfa, #8b5cf6)" }}
                >
                  {clockIn.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <LogIn className="h-5 w-5" />}
                  Clock In
                </button>
              </div>
            </div>
          )}
        </motion.div>

        {/* Today's Check-In Summary */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="rounded-2xl bg-white border border-border/50 shadow-sm overflow-hidden"
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #60a5fa, #3b82f6)" }}>
                <History className="h-3.5 w-3.5 text-white" />
              </div>
              <h3 className="text-sm font-bold text-foreground">Recent Check-Ins</h3>
            </div>
            <span className="text-xs text-muted-foreground">{recentHistory.length} entries</span>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : recentHistory.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No check-ins yet</p>
          ) : (
            <div className="divide-y divide-slate-100">
              <AnimatePresence>
                {recentHistory.map((checkin: any) => (
                  <motion.div
                    key={checkin.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50/50 transition-colors"
                  >
                    <Avatar name={checkin.staff_name || "??"} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {checkin.staff_name}
                        {checkin.client_name && (
                          <span className="text-muted-foreground font-normal"> → {checkin.client_name}</span>
                        )}
                      </p>
                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
                        <span>{formatPerthTime(checkin.check_in_time!)}</span>
                        {checkin.check_out_time && <span>→ {formatPerthTime(checkin.check_out_time)}</span>}
                        {checkin.check_in_lat && (
                          <span className="flex items-center gap-0.5 text-teal-500">
                            <MapPin className="h-2.5 w-2.5" /> GPS
                          </span>
                        )}
                      </div>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                      checkin.status === "checked_in"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-slate-100 text-slate-600"
                    }`}>
                      {checkin.status === "checked_in" ? "Active" : "Done"}
                    </span>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </motion.div>
      </div>
    </AppLayout>
  );
}
