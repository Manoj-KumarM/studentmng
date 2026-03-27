import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { session_id, subject_id } = await req.json();

    if (!session_id) {
      return new Response(JSON.stringify({ error: "session_id required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get session
    const { data: session } = await supabase
      .from("attendance_sessions")
      .select("*")
      .eq("id", session_id)
      .single();

    if (!session) {
      return new Response(JSON.stringify({ error: "Session not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get all submissions for this session
    const { data: submissions } = await supabase
      .from("attendance_submissions")
      .select("student_usn")
      .eq("session_id", session_id)
      .eq("attendance_status", "valid");

    const presentUSNs = (submissions || []).map(s => s.student_usn);

    // If subject_id provided, get all students for that subject's class
    if (subject_id) {
      const { data: subject } = await supabase
        .from("subjects")
        .select("branch, semester, section")
        .eq("id", subject_id)
        .single();

      if (subject) {
        const { data: allStudents } = await supabase
          .from("students")
          .select("id, usn, user_id")
          .eq("branch", subject.branch)
          .eq("semester", subject.semester)
          .eq("section", subject.section);

        // Create attendance records for all students
        const records = (allStudents || []).map(student => ({
          student_id: student.id,
          subject_id,
          session_id,
          date: new Date().toISOString().split("T")[0],
          status: presentUSNs.includes(student.usn) ? "Present" : "Absent",
        }));

        if (records.length > 0) {
          await supabase.from("attendance_records").insert(records);
        }

        // Get absent students with parent emails for notification
        const absentStudents = (allStudents || []).filter(s => !presentUSNs.includes(s.usn));
        // Log absent students (email would be sent in production)
        console.log("Absent students:", absentStudents.map(s => s.usn));
      }
    }

    // Deactivate session
    await supabase
      .from("attendance_sessions")
      .update({ is_active: false })
      .eq("id", session_id);

    return new Response(
      JSON.stringify({ message: "Session closed successfully", present_count: presentUSNs.length }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: "Server error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
