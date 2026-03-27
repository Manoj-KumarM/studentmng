import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getStoredUser, getRoleData, clearUser } from "@/lib/auth";

const StudentDashboard = () => {
  const navigate = useNavigate();
  const user = getStoredUser();
  const roleData = getRoleData();
  const [tab, setTab] = useState<"attendance" | "percentage" | "marks" | "notes" | "feedback" | "announcements" | "profile">("attendance");

  // Attendance submission state
  const [sessionCode, setSessionCode] = useState("");
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [locError, setLocError] = useState("");
  const [result, setResult] = useState<{ status: string; message: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [scanning, setScanning] = useState(false);
  const scannerRef = useRef<any>(null);

  // Data state
  const [attendanceData, setAttendanceData] = useState<{ subject: string; present: number; total: number }[]>([]);
  const [marksData, setMarksData] = useState<any[]>([]);
  const [notesData, setNotesData] = useState<any[]>([]);
  const [feedbackForms, setFeedbackForms] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);

  // Feedback form state
  const [selectedFeedback, setSelectedFeedback] = useState<any>(null);
  const [feedbackRating, setFeedbackRating] = useState(3);
  const [feedbackComments, setFeedbackComments] = useState("");

  useEffect(() => {
    if (!user || user.role !== "student") { navigate("/login"); return; }
  }, []);

  useEffect(() => {
    if (!roleData?.id) return;
    if (tab === "percentage") loadAttendancePercentage();
    if (tab === "marks") loadMarks();
    if (tab === "notes") loadNotes();
    if (tab === "feedback") loadFeedbackForms();
    if (tab === "announcements") loadAnnouncements();
  }, [tab]);

  const loadAttendancePercentage = async () => {
    if (!roleData?.id) return;
    const { data: records } = await supabase.from("attendance_records").select("subject_id, status, subjects(subject_name)").eq("student_id", roleData.id);
    if (!records) return;

    const bySubject: Record<string, { subject: string; present: number; total: number }> = {};
    records.forEach(r => {
      const subId = r.subject_id;
      const subName = (r as any).subjects?.subject_name || "Unknown";
      if (!bySubject[subId]) bySubject[subId] = { subject: subName, present: 0, total: 0 };
      bySubject[subId].total++;
      if (r.status === "Present") bySubject[subId].present++;
    });
    setAttendanceData(Object.values(bySubject));
  };

  const loadMarks = async () => {
    if (!roleData?.id) return;
    const { data } = await supabase.from("marks").select("*, subjects(subject_name)").eq("student_id", roleData.id).order("created_at", { ascending: false });
    setMarksData(data || []);
  };

  const loadNotes = async () => {
    if (!roleData) return;
    const { data } = await supabase.from("notes").select("*, subjects(subject_name)").eq("subjects.branch", roleData.branch).eq("subjects.semester", roleData.semester).order("created_at", { ascending: false });
    // Filter notes matching student's branch/semester
    const { data: subjects } = await supabase.from("subjects").select("id").eq("branch", roleData.branch).eq("semester", roleData.semester).eq("section", roleData.section);
    const subjectIds = (subjects || []).map(s => s.id);
    const { data: notes } = await supabase.from("notes").select("*, subjects(subject_name)").in("subject_id", subjectIds).order("created_at", { ascending: false });
    setNotesData(notes || []);
  };

  const loadFeedbackForms = async () => {
    const { data } = await supabase.from("feedback_forms").select("*").order("created_at", { ascending: false });
    setFeedbackForms(data || []);
  };

  const loadAnnouncements = async () => {
    if (!roleData) return;
    const { data } = await supabase.from("announcements").select("*").order("created_at", { ascending: false });
    // Filter by student's branch/semester/section or "all"
    const filtered = (data || []).filter(a =>
      (!a.branch || a.branch === roleData.branch) &&
      (!a.semester || a.semester === roleData.semester) &&
      (!a.section || a.section === roleData.section)
    );
    setAnnouncements(filtered);
  };

  // Attendance submission
  const getLocation = () => {
    setLocError("");
    if (!navigator.geolocation) { setLocError("Geolocation not supported"); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => { setLat(pos.coords.latitude); setLng(pos.coords.longitude); },
      () => setLocError("Location permission denied"),
      { enableHighAccuracy: true }
    );
  };

  const startScan = async () => {
    setScanning(true);
    const { Html5Qrcode } = await import("html5-qrcode");
    const scanner = new Html5Qrcode("qr-reader-dash");
    scannerRef.current = scanner;
    try {
      await scanner.start(
        { facingMode: "environment" }, { fps: 10, qrbox: 250 },
        (text: string) => { setSessionCode(text); scanner.stop().catch(() => {}); setScanning(false); },
        () => {}
      );
    } catch { setScanning(false); }
  };

  useEffect(() => { return () => { scannerRef.current?.stop().catch(() => {}); }; }, []);

  const submitAttendance = async () => {
    if (!sessionCode || lat == null || lng == null || !user || !roleData) return;
    setSubmitting(true); setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("submit-attendance", {
        body: { session_code: sessionCode, student_name: user.name, student_usn: roleData.usn, student_latitude: lat, student_longitude: lng },
      });
      if (error) setResult({ status: "error", message: "Network error" });
      else setResult({ status: data.status, message: data.message });
    } catch { setResult({ status: "error", message: "Something went wrong" }); }
    setSubmitting(false);
  };

  // Feedback submission
  const submitFeedback = async () => {
    if (!selectedFeedback || !roleData) return;
    await supabase.from("feedback_responses").insert({
      form_id: selectedFeedback.id, student_id: roleData.id,
      rating: feedbackRating, comments: feedbackComments,
    });
    alert("Feedback submitted!");
    setSelectedFeedback(null); setFeedbackComments(""); setFeedbackRating(3);
  };

  const logout = () => { clearUser(); navigate("/login"); };
  const statusColor = result ? (result.status === "marked" ? "green" : result.status === "duplicate" ? "orange" : "red") : "black";

  if (!user || !roleData) return null;

  return (
    <div style={{ maxWidth: 700, margin: "20px auto", padding: 20, fontFamily: "system-ui" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h1 style={{ fontSize: 22 }}>Student Dashboard - {user.name}</h1>
        <div>
          <button onClick={() => navigate("/change-password")} style={{ ...btnStyle, marginRight: 8 }}>Change Password</button>
          <button onClick={logout} style={{ ...btnStyle, background: "#fee", color: "red" }}>Logout</button>
        </div>
      </div>

      <div style={{ display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap" }}>
        {(["attendance", "percentage", "marks", "notes", "feedback", "announcements", "profile"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ ...btnStyle, fontSize: 12, background: tab === t ? "#1a73e8" : "#f5f5f5", color: tab === t ? "#fff" : "#333" }}>
            {t === "percentage" ? "Attendance %" : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === "attendance" && (
        <div>
          <div style={{ marginBottom: 12 }}>
            {!scanning ? <button onClick={startScan} style={btnStyle}>📷 Scan QR Code</button>
            : <button onClick={() => { scannerRef.current?.stop().catch(() => {}); setScanning(false); }} style={{ ...btnStyle, background: "#fee" }}>Stop Scanning</button>}
            <div id="qr-reader-dash" style={{ marginTop: 8, display: scanning ? "block" : "none" }} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: "block", marginBottom: 4, fontWeight: 500 }}>Session Code</label>
            <input value={sessionCode} onChange={e => setSessionCode(e.target.value.toUpperCase())} placeholder="e.g. ABC123" style={inputStyle} />
          </div>
          <button onClick={getLocation} style={{ ...btnStyle, marginBottom: 12 }}>📍 Get My Location</button>
          {locError && <p style={{ color: "red" }}>{locError}</p>}
          {lat != null && <p>Lat: {lat.toFixed(6)}, Lng: {lng!.toFixed(6)}</p>}
          <button onClick={submitAttendance} disabled={!sessionCode || lat == null || submitting}
            style={{ ...btnStyle, marginTop: 8, background: "#e0f7e0", opacity: (!sessionCode || lat == null) ? 0.5 : 1 }}>
            {submitting ? "Submitting..." : "Submit Attendance"}
          </button>
          {result && (
            <div style={{ marginTop: 16, padding: 12, borderRadius: 6, border: `2px solid ${statusColor}`, background: `${statusColor}11` }}>
              <strong style={{ color: statusColor }}>{result.message}</strong>
            </div>
          )}
        </div>
      )}

      {tab === "percentage" && (
        <div>
          <h2 style={{ fontSize: 18, marginBottom: 12 }}>Attendance Percentage</h2>
          {attendanceData.length === 0 ? <p style={{ color: "#888" }}>No attendance records yet</p> : (
            <table style={tableStyle}>
              <thead><tr style={thRowStyle}><th style={thStyle}>Subject</th><th style={thStyle}>Present</th><th style={thStyle}>Total</th><th style={thStyle}>%</th></tr></thead>
              <tbody>
                {attendanceData.map((a, i) => (
                  <tr key={i} style={trStyle}>
                    <td style={tdStyle}>{a.subject}</td><td style={tdStyle}>{a.present}</td><td style={tdStyle}>{a.total}</td>
                    <td style={{ ...tdStyle, color: (a.present / a.total * 100) < 75 ? "red" : "green" }}>{(a.present / a.total * 100).toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === "marks" && (
        <div>
          <h2 style={{ fontSize: 18, marginBottom: 12 }}>Marks</h2>
          {marksData.length === 0 ? <p style={{ color: "#888" }}>No marks yet</p> : (
            <table style={tableStyle}>
              <thead><tr style={thRowStyle}><th style={thStyle}>Subject</th><th style={thStyle}>Exam</th><th style={thStyle}>Marks</th></tr></thead>
              <tbody>
                {marksData.map(m => (
                  <tr key={m.id} style={trStyle}>
                    <td style={tdStyle}>{(m as any).subjects?.subject_name}</td><td style={tdStyle}>{m.exam_name}</td><td style={tdStyle}>{m.marks}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === "notes" && (
        <div>
          <h2 style={{ fontSize: 18, marginBottom: 12 }}>Notes / Assignments</h2>
          {notesData.length === 0 ? <p style={{ color: "#888" }}>No notes available</p> :
            notesData.map(n => (
              <div key={n.id} style={{ border: "1px solid #ddd", padding: 8, borderRadius: 6, marginBottom: 6 }}>
                <strong>{n.title}</strong> — {(n as any).subjects?.subject_name}
                <br /><a href={n.file_url} target="_blank" style={{ color: "#1a73e8" }}>Download</a>
              </div>
            ))}
        </div>
      )}

      {tab === "feedback" && (
        <div>
          <h2 style={{ fontSize: 18, marginBottom: 12 }}>Feedback Forms</h2>
          {!selectedFeedback ? (
            feedbackForms.length === 0 ? <p style={{ color: "#888" }}>No feedback forms</p> :
            feedbackForms.map(f => (
              <div key={f.id} style={{ border: "1px solid #ddd", padding: 8, borderRadius: 6, marginBottom: 6, cursor: "pointer" }} onClick={() => setSelectedFeedback(f)}>
                <strong>{f.event_name}</strong>
              </div>
            ))
          ) : (
            <div>
              <h3>{selectedFeedback.event_name}</h3>
              {(() => { try { return JSON.parse(selectedFeedback.questions); } catch { return []; } })().map((q: string, i: number) => (
                <p key={i} style={{ margin: "4px 0" }}>Q{i + 1}: {q}</p>
              ))}
              <div style={{ marginTop: 12 }}>
                <label style={{ fontWeight: 500 }}>Rating (1-5): </label>
                <select value={feedbackRating} onChange={e => setFeedbackRating(Number(e.target.value))} style={inputStyle}>
                  {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n} ⭐</option>)}
                </select>
              </div>
              <div style={{ marginTop: 8 }}>
                <textarea placeholder="Comments (optional)" value={feedbackComments} onChange={e => setFeedbackComments(e.target.value)} style={{ ...inputStyle, minHeight: 60, width: "100%" }} />
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                <button onClick={submitFeedback} style={{ ...btnStyle, background: "#1a73e8", color: "#fff", border: "none" }}>Submit Feedback</button>
                <button onClick={() => setSelectedFeedback(null)} style={btnStyle}>Cancel</button>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === "announcements" && (
        <div>
          <h2 style={{ fontSize: 18, marginBottom: 12 }}>Announcements</h2>
          {announcements.length === 0 ? <p style={{ color: "#888" }}>No announcements</p> :
            announcements.map(a => (
              <div key={a.id} style={{ border: "1px solid #ddd", padding: 12, borderRadius: 6, marginBottom: 8 }}>
                <strong>{a.title}</strong>
                <p style={{ margin: "4px 0", color: "#555" }}>{a.message}</p>
                <small style={{ color: "#888" }}>{new Date(a.created_at).toLocaleDateString()}</small>
              </div>
            ))}
        </div>
      )}

      {tab === "profile" && (
        <div>
          <h2 style={{ fontSize: 18, marginBottom: 12 }}>Profile</h2>
          <table style={tableStyle}>
            <tbody>
              <tr style={trStyle}><td style={{ ...tdStyle, fontWeight: 500 }}>Name</td><td style={tdStyle}>{user.name}</td></tr>
              <tr style={trStyle}><td style={{ ...tdStyle, fontWeight: 500 }}>Email</td><td style={tdStyle}>{user.email}</td></tr>
              <tr style={trStyle}><td style={{ ...tdStyle, fontWeight: 500 }}>USN</td><td style={tdStyle}>{roleData.usn}</td></tr>
              <tr style={trStyle}><td style={{ ...tdStyle, fontWeight: 500 }}>Branch</td><td style={tdStyle}>{roleData.branch}</td></tr>
              <tr style={trStyle}><td style={{ ...tdStyle, fontWeight: 500 }}>Semester</td><td style={tdStyle}>{roleData.semester}</td></tr>
              <tr style={trStyle}><td style={{ ...tdStyle, fontWeight: 500 }}>Section</td><td style={tdStyle}>{roleData.section}</td></tr>
              <tr style={trStyle}><td style={{ ...tdStyle, fontWeight: 500 }}>Phone</td><td style={tdStyle}>{roleData.phone || "-"}</td></tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const inputStyle: React.CSSProperties = { padding: 8, fontSize: 14, borderRadius: 6, border: "1px solid #ccc", boxSizing: "border-box" };
const btnStyle: React.CSSProperties = { padding: "8px 16px", fontSize: 14, cursor: "pointer", borderRadius: 6, border: "1px solid #ccc", background: "#f5f5f5" };
const tableStyle: React.CSSProperties = { width: "100%", borderCollapse: "collapse", fontSize: 13 };
const thRowStyle: React.CSSProperties = { borderBottom: "2px solid #ddd", textAlign: "left" };
const thStyle: React.CSSProperties = { padding: 6 };
const trStyle: React.CSSProperties = { borderBottom: "1px solid #eee" };
const tdStyle: React.CSSProperties = { padding: 6 };

export default StudentDashboard;
