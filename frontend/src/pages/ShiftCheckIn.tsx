import { useState, useEffect, useCallback } from "react";
import { AppLayout } from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin, Clock, LogIn, LogOut, Navigation, CheckCircle2,
  Loader2, History, FileText, AlertTriangle,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { getPerthDate, formatPerthTime } from "@/lib/perth-time";
import { fullName } from "@/lib/display-names";

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

  // Fetch client list for dropdown
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

      // Save the case note
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
      toast.success("Clocked out successfully! Case note saved.");
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
      <div className="max-w-2xl mx-auto space-y-6">
        {/* GPS Status */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-xl bg-card p-4 shadow-card border border-border/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                position ? "bg-success/10 text-success" : gpsError ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground"
              }`}>
                {gpsLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Navigation className="h-5 w-5" />}
              </div>
              <div>
                <p className="text-sm font-medium text-card-foreground">
                  {gpsLoading ? "Getting location..." : position ? "Location captured" : "Location unavailable"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {position
                    ? `${position.lat.toFixed(5)}, ${position.lng.toFixed(5)} (±${Math.round(position.accuracy)}m)`
                    : gpsError || "Enable location services"}
                </p>
              </div>
            </div>
            <button onClick={requestLocation} className="text-xs text-primary hover:underline font-medium">Refresh</button>
          </div>
        </motion.div>

        {/* Staff Identity */}
        {staffProfile && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.03 }}
            className={`rounded-xl p-4 border ${staffProfile.staffId ? "bg-card border-border/50" : "bg-destructive/5 border-destructive/20"}`}>
            <p className="text-sm font-medium text-card-foreground">
              Signed in as: <span className="font-semibold">{staffProfile.staffName}</span>
            </p>
            {!staffProfile.staffId && (
              <p className="text-xs text-destructive mt-1">Your account is not linked to a staff record. Contact your administrator.</p>
            )}
          </motion.div>
        )}

        {/* Check-In / Check-Out Card */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="rounded-xl bg-card p-6 shadow-card border border-border/50">
          {activeCheckin ? (
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-success/10 flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6 text-success" />
                </div>
                <div>
                  <p className="text-lg font-semibold text-card-foreground">Currently Clocked In</p>
                  <p className="text-sm text-muted-foreground">
                    {activeCheckin.staff_name} · Since {formatPerthTime(activeCheckin.check_in_time!)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg bg-secondary/50 p-3">
                  <p className="text-xs text-muted-foreground">Duration</p>
                  <p className="font-medium text-card-foreground">{formatDistanceToNow(new Date(activeCheckin.check_in_time!))}</p>
                </div>
                <div className="rounded-lg bg-secondary/50 p-3">
                  <p className="text-xs text-muted-foreground">Client</p>
                  <p className="font-medium text-card-foreground">{activeCheckin.client_name || "—"}</p>
                </div>
              </div>

              {/* Mandatory case note before clock-out */}
              {!showClockOutForm ? (
                <button
                  onClick={() => setShowClockOutForm(true)}
                  disabled={!position}
                  className="w-full h-14 rounded-xl bg-destructive text-destructive-foreground text-lg font-semibold flex items-center justify-center gap-3 hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  <LogOut className="h-5 w-5" /> Clock Out
                </button>
              ) : (
                <div className="space-y-3 rounded-lg border border-warning/30 bg-warning/5 p-4">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-warning" />
                    <p className="text-sm font-semibold text-card-foreground">Case Note Required</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    A case note is <strong>compulsory</strong> after every shift. Describe the support provided, observations, and client wellbeing.
                  </p>
                  <textarea
                    value={clockOutNote}
                    onChange={(e) => setClockOutNote(e.target.value)}
                    placeholder="Describe the support provided, client mood, activities completed..."
                    rows={4}
                    maxLength={2000}
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowClockOutForm(false)}
                      className="flex-1 h-10 rounded-lg border text-sm font-medium text-foreground hover:bg-secondary transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => clockOut.mutate()}
                      disabled={clockOut.isPending || !position || !clockOutNote.trim()}
                      className="flex-1 h-10 rounded-lg bg-destructive text-destructive-foreground text-sm font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                      {clockOut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
                      Submit Note & Clock Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-card-foreground flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" /> Start Your Shift
              </h2>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Client *</label>
                  <select
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                    className="w-full h-10 rounded-lg border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">Select client...</option>
                    {clientList.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.preferred_name ? `${c.preferred_name} ${c.last_name}` : `${c.first_name} ${c.last_name}`}
                      </option>
                    ))}
                  </select>
                  {!clientId && (
                    <p className="text-[10px] text-warning mt-1 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" /> A client must be selected to clock in
                    </p>
                  )}
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Notes</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Any notes for this shift..."
                    rows={2}
                    maxLength={1000}
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                  />
                </div>
              </div>

              <button
                onClick={() => clockIn.mutate()}
                disabled={clockIn.isPending || !canClockIn}
                className="w-full h-14 rounded-xl bg-primary text-primary-foreground text-lg font-semibold flex items-center justify-center gap-3 hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {clockIn.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <LogIn className="h-5 w-5" />}
                Clock In
              </button>
            </div>
          )}
        </motion.div>

        {/* Recent History */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="rounded-xl bg-card p-5 shadow-card border border-border/50">
          <h2 className="text-sm font-semibold text-card-foreground mb-4 flex items-center gap-2">
            <History className="h-4 w-4 text-muted-foreground" /> Recent Check-Ins
          </h2>

          {isLoading ? (
            <div className="flex items-center justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : recentHistory.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No check-ins yet</p>
          ) : (
            <div className="space-y-2">
              <AnimatePresence>
                {recentHistory.map((checkin: any) => (
                  <motion.div key={checkin.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                    className="flex items-center justify-between py-3 px-3 rounded-lg bg-secondary/50">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${
                        checkin.status === "checked_in" ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"
                      }`}>
                        {checkin.status === "checked_in" ? <CheckCircle2 className="h-4 w-4" /> : <LogOut className="h-4 w-4" />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-card-foreground truncate">
                          {checkin.staff_name}
                          {checkin.client_name && <span className="text-muted-foreground font-normal"> → {checkin.client_name}</span>}
                        </p>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                          <span>{formatPerthTime(checkin.check_in_time!)}</span>
                          {checkin.check_out_time && <span>→ {formatPerthTime(checkin.check_out_time)}</span>}
                          {checkin.check_in_lat && (
                            <span className="flex items-center gap-0.5"><MapPin className="h-2.5 w-2.5" />GPS</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0 ${
                      checkin.status === "checked_in" ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"
                    }`}>
                      {checkin.status === "checked_in" ? "Active" : "Completed"}
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
