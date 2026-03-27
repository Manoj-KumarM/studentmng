import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { session_code, student_name, student_usn, student_latitude, student_longitude } = await req.json();

    if (!session_code || !student_name || !student_usn || student_latitude == null || student_longitude == null) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Find session
    const { data: session, error: sessionError } = await supabase
      .from("attendance_sessions")
      .select("*")
      .eq("session_code", session_code)
      .single();

    if (sessionError || !session) {
      return new Response(JSON.stringify({ status: "invalid_session", message: "Invalid session code" }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (!session.is_active) {
      return new Response(JSON.stringify({ status: "invalid_session", message: "Session is no longer active" }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Calculate distance
    const distance = haversineDistance(
      session.teacher_latitude, session.teacher_longitude,
      student_latitude, student_longitude
    );

    const attendance_status = distance <= session.allowed_radius_meters ? "valid" : "invalid";

    // Check duplicate
    const { data: existing } = await supabase
      .from("attendance_submissions")
      .select("id")
      .eq("session_id", session.id)
      .eq("student_usn", student_usn)
      .maybeSingle();

    if (existing) {
      return new Response(JSON.stringify({ status: "duplicate", message: "Attendance already submitted for this USN" }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Insert submission
    const { error: insertError } = await supabase.from("attendance_submissions").insert({
      session_id: session.id,
      student_name,
      student_usn,
      student_latitude,
      student_longitude,
      distance_meters: Math.round(distance * 100) / 100,
      attendance_status,
    });

    if (insertError) {
      return new Response(JSON.stringify({ error: "Failed to record attendance" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({
      status: attendance_status === "valid" ? "marked" : "out_of_range",
      message: attendance_status === "valid" ? "Attendance marked successfully" : `Out of range (${Math.round(distance)}m away, max ${session.allowed_radius_meters}m)`,
      distance_meters: Math.round(distance * 100) / 100,
    }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (e) {
    return new Response(JSON.stringify({ error: "Server error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
