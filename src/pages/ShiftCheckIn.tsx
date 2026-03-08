import { useState, useEffect, useCallback } from "react";
import { AppLayout } from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  Clock,
  LogIn,
  LogOut,
  Navigation,
  CheckCircle2,
  AlertCircle,
  Loader2,
  History,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

interface GpsPosition {
  lat: number;
  lng: number;
  accuracy: number;
}

function useGps() {
  const [position, setPosition] = useState<GpsPosition | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      return;
    }
    setLoading(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, []);

  return { position, error, loading, requestLocation };
}

export default function ShiftCheckIn() {
  const queryClient = useQueryClient();
  const { position, error: gpsError, loading: gpsLoading, requestLocation } = useGps();
  const [staffName, setStaffName] = useState("");
  const [clientName, setClientName] = useState("");
  const [notes, setNotes] = useState("");

  // Request GPS on mount
  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  // Fetch today's check-ins
  const { data: todayCheckins = [], isLoading } = useQuery({
    queryKey: ["shift-checkins-today"],
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];
      const { data, error } = await supabase
        .from("shift_checkins")
        .select("*")
        .eq("shift_date", today)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    refetchInterval: 30000,
  });

  // Fetch recent history
  const { data: recentHistory = [] } = useQuery({
    queryKey: ["shift-checkins-history"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shift_checkins")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    },
  });

  // Active check-in (not yet checked out)
  const activeCheckin = todayCheckins.find((c: any) => c.status === "checked_in");

  // Clock In
  const clockIn = useMutation({
    mutationFn: async () => {
      if (!staffName.trim()) throw new Error("Please enter your name");
      if (!position) throw new Error("GPS location required. Please enable location access.");

      const { error } = await supabase.from("shift_checkins").insert({
        staff_name: staffName.trim(),
        client_name: clientName.trim() || null,
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

  // Clock Out
  const clockOut = useMutation({
    mutationFn: async () => {
      if (!activeCheckin) throw new Error("No active check-in found");
      if (!position) throw new Error("GPS location required. Please enable location access.");

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
      toast.success("Clocked out successfully!");
      queryClient.invalidateQueries({ queryKey: ["shift-checkins-today"] });
      queryClient.invalidateQueries({ queryKey: ["shift-checkins-history"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <AppLayout title="Shift Check-In">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* GPS Status */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl bg-card p-4 shadow-card border border-border/50"
        >
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
            <button
              onClick={requestLocation}
              className="text-xs text-primary hover:underline font-medium"
            >
              Refresh
            </button>
          </div>
        </motion.div>

        {/* Check-In / Check-Out Card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="rounded-xl bg-card p-6 shadow-card border border-border/50"
        >
          {activeCheckin ? (
            /* Active shift — show clock out */
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-success/10 flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6 text-success" />
                </div>
                <div>
                  <p className="text-lg font-semibold text-card-foreground">Currently Clocked In</p>
                  <p className="text-sm text-muted-foreground">
                    {activeCheckin.staff_name} · Since {format(new Date(activeCheckin.check_in_time!), "h:mm a")}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg bg-secondary/50 p-3">
                  <p className="text-xs text-muted-foreground">Duration</p>
                  <p className="font-medium text-card-foreground">
                    {formatDistanceToNow(new Date(activeCheckin.check_in_time!))}
                  </p>
                </div>
                <div className="rounded-lg bg-secondary/50 p-3">
                  <p className="text-xs text-muted-foreground">Client</p>
                  <p className="font-medium text-card-foreground">
                    {activeCheckin.client_name || "—"}
                  </p>
                </div>
              </div>

              <button
                onClick={() => clockOut.mutate()}
                disabled={clockOut.isPending || !position}
                className="w-full h-14 rounded-xl bg-destructive text-destructive-foreground text-lg font-semibold flex items-center justify-center gap-3 hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {clockOut.isPending ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <LogOut className="h-5 w-5" />
                )}
                Clock Out
              </button>
            </div>
          ) : (
            /* No active shift — show clock in form */
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-card-foreground flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Start Your Shift
              </h2>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Your Name *</label>
                  <input
                    type="text"
                    value={staffName}
                    onChange={(e) => setStaffName(e.target.value)}
                    placeholder="e.g. Sarah Mitchell"
                    className="w-full h-10 rounded-lg border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Client Name</label>
                  <input
                    type="text"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="e.g. Maria Thompson"
                    className="w-full h-10 rounded-lg border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Notes</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Any notes for this shift..."
                    rows={2}
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                  />
                </div>
              </div>

              <button
                onClick={() => clockIn.mutate()}
                disabled={clockIn.isPending || !position || !staffName.trim()}
                className="w-full h-14 rounded-xl bg-primary text-primary-foreground text-lg font-semibold flex items-center justify-center gap-3 hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {clockIn.isPending ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <LogIn className="h-5 w-5" />
                )}
                Clock In
              </button>
            </div>
          )}
        </motion.div>

        {/* Recent History */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-xl bg-card p-5 shadow-card border border-border/50"
        >
          <h2 className="text-sm font-semibold text-card-foreground mb-4 flex items-center gap-2">
            <History className="h-4 w-4 text-muted-foreground" />
            Recent Check-Ins
          </h2>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : recentHistory.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No check-ins yet</p>
          ) : (
            <div className="space-y-2">
              <AnimatePresence>
                {recentHistory.map((checkin: any) => (
                  <motion.div
                    key={checkin.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center justify-between py-3 px-3 rounded-lg bg-secondary/50"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${
                        checkin.status === "checked_in"
                          ? "bg-success/10 text-success"
                          : "bg-muted text-muted-foreground"
                      }`}>
                        {checkin.status === "checked_in" ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : (
                          <LogOut className="h-4 w-4" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-card-foreground truncate">
                          {checkin.staff_name}
                          {checkin.client_name && (
                            <span className="text-muted-foreground font-normal"> → {checkin.client_name}</span>
                          )}
                        </p>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                          <span>{format(new Date(checkin.check_in_time!), "MMM d, h:mm a")}</span>
                          {checkin.check_out_time && (
                            <span>→ {format(new Date(checkin.check_out_time), "h:mm a")}</span>
                          )}
                          {checkin.check_in_lat && (
                            <span className="flex items-center gap-0.5">
                              <MapPin className="h-2.5 w-2.5" />
                              GPS
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0 ${
                      checkin.status === "checked_in"
                        ? "bg-success/10 text-success"
                        : "bg-muted text-muted-foreground"
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
