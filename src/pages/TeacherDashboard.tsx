import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getStoredUser, getRoleData, clearUser } from "@/lib/auth";
import { QRCodeSVG } from "qrcode.react";

function generateCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

const TeacherDashboard = () => {
  const navigate = useNavigate();
  const user = getStoredUser();
  const roleData = getRoleData();
  const [tab, setTab] = useState<"attendance" | "modify" | "marks" | "notes" | "csv">("attendance");

  // Attendance state
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [locError, setLocError] = useState("");
  const [sessionCode, setSessionCode] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [qrGenerated, setQrGenerated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [selectedSubject, setSelectedSubject] = useState("");

  // Marks state
  const [marksSubject, setMarksSubject] = useState("");
  const [examName, setExamName] = useState("");
  const [marksEntries, setMarksEntries] = useState<{ usn: string; marks: string }[]>([{ usn: "", marks: "" }]);

  // Notes state
  const [noteTitle, setNoteTitle] = useState("");
  const [noteUrl, setNoteUrl] = useState("");
  const [noteSubject, setNoteSubject] = useState("");
  const [notesList, setNotesList] = useState<any[]>([]);

  // Attendance records for CSV/modify
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [filterDate, setFilterDate] = useState("");

  useEffect(() => {
    if (!user || user.role !== "teacher") { navigate("/login"); return; }
    loadSubjects();
  }, []);

  useEffect(() => {
    if (tab === "notes") loadNotes();
    if (tab === "csv" || tab === "modify") loadAttendanceRecords();
  }, [tab]);

  const loadSubjects = async () => {
    if (!roleData?.id) return;
    const { data } = await supabase.from("subjects").select("*").eq("teacher_id", roleData.id);
    setSubjects(data || []);
  };

  const loadNotes = async () => {
    if (!user) return;
    const { data } = await supabase.from("notes").select("*, subjects(subject_name)").eq("uploaded_by", user.id).order("created_at", { ascending: false });
    setNotesList(data || []);
  };

  const loadAttendanceRecords = async () => {
    if (!roleData?.id) return;
    const subjectIds = subjects.map(s => s.id);
    if (subjectIds.length === 0) return;
    let query = supabase.from("attendance_records").select("*, students(usn, users:user_id(name)), subjects(subject_name)").in("subject_id", subjectIds).order("date", { ascending: false });
    if (filterDate) query = query.eq("date", filterDate);
    const { data } = await query.limit(200);
    setAttendanceRecords(data || []);
  };

  // Attendance
  const getLocation = () => {
    setLocError("");
    if (!navigator.geolocation) { setLocError("Geolocation not supported"); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => { setLat(pos.coords.latitude); setLng(pos.coords.longitude); },
      () => setLocError("Location permission denied"),
      { enableHighAccuracy: true }
    );
  };

  const generateQR = async () => {
    if (lat == null || lng == null || !selectedSubject) return;
    setLoading(true);
    const code = generateCode();
    const { data, error } = await supabase.from("attendance_sessions").insert({
      session_code: code, teacher_latitude: lat, teacher_longitude: lng,
      allowed_radius_meters: 20, subject_id: selectedSubject,
    }).select().single();
    if (data) { setSessionCode(code); setSessionId(data.id); setQrGenerated(true); }
    setLoading(false);
  };

  const closeSession = async () => {
    if (!sessionId) return;
    await supabase.functions.invoke("close-session", {
      body: { session_id: sessionId, subject_id: selectedSubject },
    });
    setQrGenerated(false);
    setSessionCode("");
    setSessionId("");
    setSubmissions([]);
    alert("Session closed. Absent students marked.");
  };

  // Poll submissions
  useEffect(() => {
    if (!sessionId) return;
    const interval = setInterval(async () => {
      const { data } = await supabase.from("attendance_submissions").select("*").eq("session_id", sessionId).order("submitted_at", { ascending: false });
      if (data) setSubmissions(data);
    }, 3000);
    return () => clearInterval(interval);
  }, [sessionId]);

  // Marks
  const uploadMarks = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!marksSubject || !examName) return;
    for (const entry of marksEntries) {
      if (!entry.usn || !entry.marks) continue;
      const { data: student } = await supabase.from("students").select("id").eq("usn", entry.usn).single();
      if (student) {
        await supabase.from("marks").insert({
          student_id: student.id, subject_id: marksSubject, exam_name: examName, marks: parseFloat(entry.marks),
        });
      }
    }
    alert("Marks uploaded!");
    setMarksEntries([{ usn: "", marks: "" }]);
  };

  // Notes
  const uploadNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteTitle || !noteUrl || !noteSubject || !user) return;
    await supabase.from("notes").insert({
      title: noteTitle, file_url: noteUrl, subject_id: noteSubject, uploaded_by: user.id,
    });
    setNoteTitle(""); setNoteUrl("");
    loadNotes();
  };

  // CSV download
  const downloadCSV = () => {
    const headers = "Date,Subject,USN,Student Name,Status\n";
    const rows = attendanceRecords.map(r =>
      `${r.date},${(r as any).subjects?.subject_name || ""},${(r as any).students?.usn || ""},${(r as any).students?.users?.name || ""},${r.status}`
    ).join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `attendance_${filterDate || "all"}.csv`; a.click();
  };

  const toggleAttendance = async (recordId: string, currentStatus: string) => {
    const newStatus = currentStatus === "Present" ? "Absent" : "Present";
    await supabase.from("attendance_records").update({ status: newStatus }).eq("id", recordId);
    loadAttendanceRecords();
  };

  const logout = () => { clearUser(); navigate("/login"); };

  if (!user) return null;

  return (
    <div style={{ maxWidth: 800, margin: "20px auto", padding: 20, fontFamily: "system-ui" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h1 style={{ fontSize: 22 }}>Teacher Dashboard - {user.name}</h1>
        <div>
          <button onClick={() => navigate("/change-password")} style={{ ...btnStyle, marginRight: 8 }}>Change Password</button>
          <button onClick={logout} style={{ ...btnStyle, background: "#fee", color: "red" }}>Logout</button>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        {(["attendance", "modify", "marks", "notes", "csv"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ ...btnStyle, background: tab === t ? "#1a73e8" : "#f5f5f5", color: tab === t ? "#fff" : "#333" }}>
            {t === "csv" ? "Download CSV" : t === "modify" ? "Modify Attendance" : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === "attendance" && (
        <div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: "block", marginBottom: 4, fontWeight: 500 }}>Select Subject</label>
            <select value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)} style={inputStyle}>
              <option value="">-- Select --</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.subject_name} ({s.subject_code})</option>)}
            </select>
          </div>
          <button onClick={getLocation} style={btnStyle}>📍 Get My Location</button>
          {locError && <p style={{ color: "red" }}>{locError}</p>}
          {lat != null && <p>Lat: {lat.toFixed(6)}, Lng: {lng!.toFixed(6)}</p>}

          <button onClick={generateQR} disabled={lat == null || loading || qrGenerated || !selectedSubject} style={{ ...btnStyle, marginTop: 12, opacity: (lat == null || qrGenerated || !selectedSubject) ? 0.5 : 1 }}>
            {loading ? "Generating..." : "Generate Attendance QR"}
          </button>

          {qrGenerated && (
            <div style={{ marginTop: 20 }}>
              <QRCodeSVG value={sessionCode} size={200} />
              <p>Session Code: <strong>{sessionCode}</strong></p>
              <button onClick={closeSession} style={{ ...btnStyle, background: "#fee", color: "red", marginTop: 8 }}>Close Session</button>
            </div>
          )}

          {sessionId && (
            <div style={{ marginTop: 24 }}>
              <h3 style={{ fontSize: 16 }}>Submissions ({submissions.length})</h3>
              {submissions.length === 0 ? <p style={{ color: "#888" }}>No submissions yet...</p> : (
                <table style={tableStyle}>
                  <thead><tr style={thRowStyle}><th style={thStyle}>Name</th><th style={thStyle}>USN</th><th style={thStyle}>Distance</th><th style={thStyle}>Status</th></tr></thead>
                  <tbody>
                    {submissions.map(s => (
                      <tr key={s.id} style={trStyle}>
                        <td style={tdStyle}>{s.student_name}</td><td style={tdStyle}>{s.student_usn}</td>
                        <td style={tdStyle}>{s.distance_meters}m</td>
                        <td style={{ ...tdStyle, color: s.attendance_status === "valid" ? "green" : "red" }}>{s.attendance_status === "valid" ? "✅" : "❌"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      )}

      {tab === "modify" && (
        <div>
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} style={inputStyle} />
            <button onClick={loadAttendanceRecords} style={btnStyle}>Filter</button>
          </div>
          <table style={tableStyle}>
            <thead><tr style={thRowStyle}><th style={thStyle}>Date</th><th style={thStyle}>Subject</th><th style={thStyle}>USN</th><th style={thStyle}>Name</th><th style={thStyle}>Status</th><th style={thStyle}>Toggle</th></tr></thead>
            <tbody>
              {attendanceRecords.map(r => (
                <tr key={r.id} style={trStyle}>
                  <td style={tdStyle}>{r.date}</td>
                  <td style={tdStyle}>{(r as any).subjects?.subject_name}</td>
                  <td style={tdStyle}>{(r as any).students?.usn}</td>
                  <td style={tdStyle}>{(r as any).students?.users?.name}</td>
                  <td style={{ ...tdStyle, color: r.status === "Present" ? "green" : "red" }}>{r.status}</td>
                  <td style={tdStyle}><button onClick={() => toggleAttendance(r.id, r.status)} style={{ ...btnStyle, fontSize: 12, padding: "4px 8px" }}>Toggle</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "marks" && (
        <div>
          <form onSubmit={uploadMarks}>
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              <select value={marksSubject} onChange={e => setMarksSubject(e.target.value)} style={inputStyle} required>
                <option value="">Select Subject</option>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.subject_name}</option>)}
              </select>
              <input placeholder="Exam Name (e.g. Internal 1)" required value={examName} onChange={e => setExamName(e.target.value)} style={inputStyle} />
            </div>
            {marksEntries.map((entry, i) => (
              <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                <input placeholder="USN" value={entry.usn} onChange={e => { const copy = [...marksEntries]; copy[i].usn = e.target.value; setMarksEntries(copy); }} style={inputStyle} />
                <input placeholder="Marks" value={entry.marks} onChange={e => { const copy = [...marksEntries]; copy[i].marks = e.target.value; setMarksEntries(copy); }} style={{ ...inputStyle, width: 100 }} />
              </div>
            ))}
            <div style={{ display: "flex", gap: 8 }}>
              <button type="button" onClick={() => setMarksEntries([...marksEntries, { usn: "", marks: "" }])} style={btnStyle}>+ Add Row</button>
              <button type="submit" style={{ ...btnStyle, background: "#1a73e8", color: "#fff", border: "none" }}>Upload Marks</button>
            </div>
          </form>
        </div>
      )}

      {tab === "notes" && (
        <div>
          <form onSubmit={uploadNote} style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
            <select value={noteSubject} onChange={e => setNoteSubject(e.target.value)} style={inputStyle} required>
              <option value="">Select Subject</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.subject_name}</option>)}
            </select>
            <input placeholder="Title *" required value={noteTitle} onChange={e => setNoteTitle(e.target.value)} style={inputStyle} />
            <input placeholder="File URL (Google Drive / PDF link) *" required value={noteUrl} onChange={e => setNoteUrl(e.target.value)} style={inputStyle} />
            <button type="submit" style={{ ...btnStyle, background: "#1a73e8", color: "#fff", border: "none" }}>Upload Note</button>
          </form>
          <h3 style={{ fontSize: 16, marginBottom: 8 }}>Uploaded Notes ({notesList.length})</h3>
          {notesList.map(n => (
            <div key={n.id} style={{ border: "1px solid #ddd", padding: 8, borderRadius: 6, marginBottom: 6 }}>
              <strong>{n.title}</strong> — {(n as any).subjects?.subject_name}
              <br /><a href={n.file_url} target="_blank" style={{ color: "#1a73e8" }}>Download</a>
            </div>
          ))}
        </div>
      )}

      {tab === "csv" && (
        <div>
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} style={inputStyle} />
            <button onClick={loadAttendanceRecords} style={btnStyle}>Filter</button>
            <button onClick={downloadCSV} style={{ ...btnStyle, background: "#1a73e8", color: "#fff", border: "none" }}>Download CSV</button>
          </div>
          <p style={{ color: "#888" }}>{attendanceRecords.length} records found</p>
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

export default TeacherDashboard;
