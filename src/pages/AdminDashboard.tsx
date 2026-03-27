import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getStoredUser, clearUser } from "@/lib/auth";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const user = getStoredUser();
  const [tab, setTab] = useState<"students" | "teachers" | "subjects" | "announcements" | "feedback">("students");

  // Students state
  const [students, setStudents] = useState<any[]>([]);
  const [studentForm, setStudentForm] = useState({ name: "", email: "", usn: "", branch: "", semester: "", section: "", phone: "", parent_phone: "", parent_email: "" });
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);

  // Teachers state
  const [teachers, setTeachers] = useState<any[]>([]);
  const [teacherForm, setTeacherForm] = useState({ name: "", email: "", phone: "" });
  const [editingTeacherId, setEditingTeacherId] = useState<string | null>(null);

  // Subjects state
  const [subjects, setSubjects] = useState<any[]>([]);
  const [subjectForm, setSubjectForm] = useState({ subject_name: "", subject_code: "", branch: "", semester: "", section: "", teacher_id: "" });

  // Announcements state
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [announcementForm, setAnnouncementForm] = useState({ title: "", message: "", branch: "", semester: "", section: "" });

  // Feedback state
  const [feedbackForms, setFeedbackForms] = useState<any[]>([]);
  const [feedbackForm, setFeedbackForm] = useState({ event_name: "", questions: "" });

  useEffect(() => {
    if (!user || user.role !== "admin") { navigate("/login"); return; }
    loadData();
  }, [tab]);

  const loadData = async () => {
    if (tab === "students") {
      const { data: studs } = await supabase.from("students").select("*, users!inner(name, email)");
      setStudents(studs || []);
    } else if (tab === "teachers") {
      const { data: tchs } = await supabase.from("teachers").select("*, users!inner(name, email)");
      setTeachers(tchs || []);
    } else if (tab === "subjects") {
      const { data: subs } = await supabase.from("subjects").select("*, teachers(users(name))");
      setSubjects(subs || []);
      // Also load teachers for dropdown
      const { data: tchs } = await supabase.from("teachers").select("id, users!inner(name)");
      setTeachers(tchs || []);
    } else if (tab === "announcements") {
      const { data } = await supabase.from("announcements").select("*").order("created_at", { ascending: false });
      setAnnouncements(data || []);
    } else if (tab === "feedback") {
      const { data } = await supabase.from("feedback_forms").select("*").order("created_at", { ascending: false });
      setFeedbackForms(data || []);
    }
  };

  const addStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    const password = "student123";
    // Create user first
    const { data: userData, error: userErr } = await supabase.from("users").insert({
      name: studentForm.name, email: studentForm.email.toLowerCase(), password_hash: password + "_hashed", role: "student"
    }).select().single();

    if (userErr || !userData) { alert("Error: " + (userErr?.message || "Failed")); return; }

    await supabase.from("students").insert({
      user_id: userData.id, usn: studentForm.usn, branch: studentForm.branch,
      semester: studentForm.semester, section: studentForm.section, phone: studentForm.phone,
      parent_phone: studentForm.parent_phone, parent_email: studentForm.parent_email,
    });

    setStudentForm({ name: "", email: "", usn: "", branch: "", semester: "", section: "", phone: "", parent_phone: "", parent_email: "" });
    loadData();
  };

  const deleteStudent = async (student: any) => {
    if (!confirm("Delete this student?")) return;
    await supabase.from("users").delete().eq("id", student.user_id);
    loadData();
  };

  const addTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    const password = "teacher123";
    const { data: userData, error: userErr } = await supabase.from("users").insert({
      name: teacherForm.name, email: teacherForm.email.toLowerCase(), password_hash: password + "_hashed", role: "teacher"
    }).select().single();

    if (userErr || !userData) { alert("Error: " + (userErr?.message || "Failed")); return; }

    await supabase.from("teachers").insert({ user_id: userData.id, phone: teacherForm.phone });
    setTeacherForm({ name: "", email: "", phone: "" });
    loadData();
  };

  const deleteTeacher = async (teacher: any) => {
    if (!confirm("Delete this teacher?")) return;
    await supabase.from("users").delete().eq("id", teacher.user_id);
    loadData();
  };

  const addSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    await supabase.from("subjects").insert({
      subject_name: subjectForm.subject_name, subject_code: subjectForm.subject_code,
      branch: subjectForm.branch, semester: subjectForm.semester, section: subjectForm.section,
      teacher_id: subjectForm.teacher_id || null,
    });
    setSubjectForm({ subject_name: "", subject_code: "", branch: "", semester: "", section: "", teacher_id: "" });
    loadData();
  };

  const addAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    await supabase.from("announcements").insert({
      title: announcementForm.title, message: announcementForm.message,
      branch: announcementForm.branch || null, semester: announcementForm.semester || null,
      section: announcementForm.section || null,
    });
    setAnnouncementForm({ title: "", message: "", branch: "", semester: "", section: "" });
    loadData();
  };

  const addFeedbackForm = async (e: React.FormEvent) => {
    e.preventDefault();
    const questions = feedbackForm.questions.split("\n").filter(q => q.trim());
    await supabase.from("feedback_forms").insert({
      event_name: feedbackForm.event_name,
      questions: JSON.stringify(questions),
    });
    setFeedbackForm({ event_name: "", questions: "" });
    loadData();
  };

  const logout = () => { clearUser(); navigate("/login"); };

  if (!user) return null;

  return (
    <div style={{ maxWidth: 900, margin: "20px auto", padding: 20, fontFamily: "system-ui" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h1 style={{ fontSize: 22 }}>Admin Dashboard</h1>
        <div>
          <button onClick={() => navigate("/change-password")} style={{ ...btnStyle, marginRight: 8 }}>Change Password</button>
          <button onClick={logout} style={{ ...btnStyle, background: "#fee", color: "red" }}>Logout</button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        {(["students", "teachers", "subjects", "announcements", "feedback"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ ...btnStyle, background: tab === t ? "#1a73e8" : "#f5f5f5", color: tab === t ? "#fff" : "#333" }}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Students Tab */}
      {tab === "students" && (
        <div>
          <h2 style={{ fontSize: 18, marginBottom: 12 }}>Add Student</h2>
          <form onSubmit={addStudent} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 20 }}>
            <input placeholder="Name *" required value={studentForm.name} onChange={e => setStudentForm({ ...studentForm, name: e.target.value })} style={inputStyle} />
            <input placeholder="Email *" required type="email" value={studentForm.email} onChange={e => setStudentForm({ ...studentForm, email: e.target.value })} style={inputStyle} />
            <input placeholder="USN *" required value={studentForm.usn} onChange={e => setStudentForm({ ...studentForm, usn: e.target.value })} style={inputStyle} />
            <input placeholder="Branch *" required value={studentForm.branch} onChange={e => setStudentForm({ ...studentForm, branch: e.target.value })} style={inputStyle} />
            <input placeholder="Semester *" required value={studentForm.semester} onChange={e => setStudentForm({ ...studentForm, semester: e.target.value })} style={inputStyle} />
            <input placeholder="Section *" required value={studentForm.section} onChange={e => setStudentForm({ ...studentForm, section: e.target.value })} style={inputStyle} />
            <input placeholder="Phone" value={studentForm.phone} onChange={e => setStudentForm({ ...studentForm, phone: e.target.value })} style={inputStyle} />
            <input placeholder="Parent Phone" value={studentForm.parent_phone} onChange={e => setStudentForm({ ...studentForm, parent_phone: e.target.value })} style={inputStyle} />
            <input placeholder="Parent Email" value={studentForm.parent_email} onChange={e => setStudentForm({ ...studentForm, parent_email: e.target.value })} style={inputStyle} />
            <button type="submit" style={{ ...btnStyle, background: "#1a73e8", color: "#fff", border: "none" }}>Add Student</button>
          </form>
          <p style={{ fontSize: 12, color: "#888", marginBottom: 12 }}>Default password: student123</p>

          <h2 style={{ fontSize: 18, marginBottom: 8 }}>Students ({students.length})</h2>
          <table style={tableStyle}>
            <thead><tr style={thRowStyle}><th style={thStyle}>Name</th><th style={thStyle}>Email</th><th style={thStyle}>USN</th><th style={thStyle}>Branch</th><th style={thStyle}>Sem</th><th style={thStyle}>Sec</th><th style={thStyle}>Actions</th></tr></thead>
            <tbody>
              {students.map(s => (
                <tr key={s.id} style={trStyle}>
                  <td style={tdStyle}>{(s as any).users?.name}</td>
                  <td style={tdStyle}>{(s as any).users?.email}</td>
                  <td style={tdStyle}>{s.usn}</td>
                  <td style={tdStyle}>{s.branch}</td>
                  <td style={tdStyle}>{s.semester}</td>
                  <td style={tdStyle}>{s.section}</td>
                  <td style={tdStyle}><button onClick={() => deleteStudent(s)} style={{ color: "red", cursor: "pointer", border: "none", background: "none" }}>Delete</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Teachers Tab */}
      {tab === "teachers" && (
        <div>
          <h2 style={{ fontSize: 18, marginBottom: 12 }}>Add Teacher</h2>
          <form onSubmit={addTeacher} style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
            <input placeholder="Name *" required value={teacherForm.name} onChange={e => setTeacherForm({ ...teacherForm, name: e.target.value })} style={inputStyle} />
            <input placeholder="Email *" required type="email" value={teacherForm.email} onChange={e => setTeacherForm({ ...teacherForm, email: e.target.value })} style={inputStyle} />
            <input placeholder="Phone" value={teacherForm.phone} onChange={e => setTeacherForm({ ...teacherForm, phone: e.target.value })} style={inputStyle} />
            <button type="submit" style={{ ...btnStyle, background: "#1a73e8", color: "#fff", border: "none" }}>Add Teacher</button>
          </form>
          <p style={{ fontSize: 12, color: "#888", marginBottom: 12 }}>Default password: teacher123</p>

          <h2 style={{ fontSize: 18, marginBottom: 8 }}>Teachers ({teachers.length})</h2>
          <table style={tableStyle}>
            <thead><tr style={thRowStyle}><th style={thStyle}>Name</th><th style={thStyle}>Email</th><th style={thStyle}>Phone</th><th style={thStyle}>Actions</th></tr></thead>
            <tbody>
              {teachers.map(t => (
                <tr key={t.id} style={trStyle}>
                  <td style={tdStyle}>{(t as any).users?.name}</td>
                  <td style={tdStyle}>{(t as any).users?.email}</td>
                  <td style={tdStyle}>{t.phone || "-"}</td>
                  <td style={tdStyle}><button onClick={() => deleteTeacher(t)} style={{ color: "red", cursor: "pointer", border: "none", background: "none" }}>Delete</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Subjects Tab */}
      {tab === "subjects" && (
        <div>
          <h2 style={{ fontSize: 18, marginBottom: 12 }}>Assign Subject</h2>
          <form onSubmit={addSubject} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 20 }}>
            <input placeholder="Subject Name *" required value={subjectForm.subject_name} onChange={e => setSubjectForm({ ...subjectForm, subject_name: e.target.value })} style={inputStyle} />
            <input placeholder="Subject Code *" required value={subjectForm.subject_code} onChange={e => setSubjectForm({ ...subjectForm, subject_code: e.target.value })} style={inputStyle} />
            <input placeholder="Branch *" required value={subjectForm.branch} onChange={e => setSubjectForm({ ...subjectForm, branch: e.target.value })} style={inputStyle} />
            <input placeholder="Semester *" required value={subjectForm.semester} onChange={e => setSubjectForm({ ...subjectForm, semester: e.target.value })} style={inputStyle} />
            <input placeholder="Section *" required value={subjectForm.section} onChange={e => setSubjectForm({ ...subjectForm, section: e.target.value })} style={inputStyle} />
            <select value={subjectForm.teacher_id} onChange={e => setSubjectForm({ ...subjectForm, teacher_id: e.target.value })} style={inputStyle}>
              <option value="">Select Teacher</option>
              {teachers.map(t => <option key={t.id} value={t.id}>{(t as any).users?.name}</option>)}
            </select>
            <button type="submit" style={{ ...btnStyle, background: "#1a73e8", color: "#fff", border: "none", gridColumn: "span 2" }}>Add Subject</button>
          </form>

          <h2 style={{ fontSize: 18, marginBottom: 8 }}>Subjects ({subjects.length})</h2>
          <table style={tableStyle}>
            <thead><tr style={thRowStyle}><th style={thStyle}>Name</th><th style={thStyle}>Code</th><th style={thStyle}>Branch</th><th style={thStyle}>Sem</th><th style={thStyle}>Sec</th><th style={thStyle}>Teacher</th></tr></thead>
            <tbody>
              {subjects.map(s => (
                <tr key={s.id} style={trStyle}>
                  <td style={tdStyle}>{s.subject_name}</td>
                  <td style={tdStyle}>{s.subject_code}</td>
                  <td style={tdStyle}>{s.branch}</td>
                  <td style={tdStyle}>{s.semester}</td>
                  <td style={tdStyle}>{s.section}</td>
                  <td style={tdStyle}>{(s as any).teachers?.users?.name || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Announcements Tab */}
      {tab === "announcements" && (
        <div>
          <h2 style={{ fontSize: 18, marginBottom: 12 }}>Create Announcement</h2>
          <form onSubmit={addAnnouncement} style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
            <input placeholder="Title *" required value={announcementForm.title} onChange={e => setAnnouncementForm({ ...announcementForm, title: e.target.value })} style={inputStyle} />
            <textarea placeholder="Message *" required value={announcementForm.message} onChange={e => setAnnouncementForm({ ...announcementForm, message: e.target.value })} style={{ ...inputStyle, minHeight: 80 }} />
            <div style={{ display: "flex", gap: 8 }}>
              <input placeholder="Branch (optional)" value={announcementForm.branch} onChange={e => setAnnouncementForm({ ...announcementForm, branch: e.target.value })} style={inputStyle} />
              <input placeholder="Semester (optional)" value={announcementForm.semester} onChange={e => setAnnouncementForm({ ...announcementForm, semester: e.target.value })} style={inputStyle} />
              <input placeholder="Section (optional)" value={announcementForm.section} onChange={e => setAnnouncementForm({ ...announcementForm, section: e.target.value })} style={inputStyle} />
            </div>
            <button type="submit" style={{ ...btnStyle, background: "#1a73e8", color: "#fff", border: "none" }}>Post Announcement</button>
          </form>

          <h2 style={{ fontSize: 18, marginBottom: 8 }}>Announcements ({announcements.length})</h2>
          {announcements.map(a => (
            <div key={a.id} style={{ border: "1px solid #ddd", padding: 12, borderRadius: 6, marginBottom: 8 }}>
              <strong>{a.title}</strong>
              <p style={{ margin: "4px 0", color: "#555" }}>{a.message}</p>
              <small style={{ color: "#888" }}>{a.branch || "All"} | {a.semester || "All"} | {a.section || "All"} | {new Date(a.created_at).toLocaleDateString()}</small>
            </div>
          ))}
        </div>
      )}

      {/* Feedback Tab */}
      {tab === "feedback" && (
        <div>
          <h2 style={{ fontSize: 18, marginBottom: 12 }}>Create Feedback Form</h2>
          <form onSubmit={addFeedbackForm} style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
            <input placeholder="Event Name *" required value={feedbackForm.event_name} onChange={e => setFeedbackForm({ ...feedbackForm, event_name: e.target.value })} style={inputStyle} />
            <textarea placeholder="Questions (one per line) *" required value={feedbackForm.questions} onChange={e => setFeedbackForm({ ...feedbackForm, questions: e.target.value })} style={{ ...inputStyle, minHeight: 80 }} />
            <button type="submit" style={{ ...btnStyle, background: "#1a73e8", color: "#fff", border: "none" }}>Create Form</button>
          </form>

          <h2 style={{ fontSize: 18, marginBottom: 8 }}>Feedback Forms ({feedbackForms.length})</h2>
          {feedbackForms.map(f => (
            <div key={f.id} style={{ border: "1px solid #ddd", padding: 12, borderRadius: 6, marginBottom: 8 }}>
              <strong>{f.event_name}</strong>
              <p style={{ margin: "4px 0", color: "#555", fontSize: 14 }}>
                {(() => { try { return JSON.parse(f.questions).length; } catch { return 0; } })() } questions
              </p>
            </div>
          ))}
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

export default AdminDashboard;
