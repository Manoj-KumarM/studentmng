import { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import { supabase } from "@/integrations/supabase/client";

function generateCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

const TeacherPage = () => {
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [locError, setLocError] = useState("");
  const [sessionCode, setSessionCode] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [qrGenerated, setQrGenerated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submissions, setSubmissions] = useState<any[]>([]);

  const getLocation = () => {
    setLocError("");
    if (!navigator.geolocation) {
      setLocError("Geolocation not supported");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => { setLat(pos.coords.latitude); setLng(pos.coords.longitude); },
      (err) => setLocError("Location permission denied"),
      { enableHighAccuracy: true }
    );
  };

  const generateQR = async () => {
    if (lat == null || lng == null) return;
    setLoading(true);
    const code = generateCode();
    const { data, error } = await supabase.from("attendance_sessions").insert({
      session_code: code,
      teacher_latitude: lat,
      teacher_longitude: lng,
      allowed_radius_meters: 20,
    }).select().single();

    if (data) {
      setSessionCode(code);
      setSessionId(data.id);
      setQrGenerated(true);
    }
    setLoading(false);
  };

  // Poll submissions
  useEffect(() => {
    if (!sessionId) return;
    const interval = setInterval(async () => {
      const { data } = await supabase
        .from("attendance_submissions")
        .select("*")
        .eq("session_id", sessionId)
        .order("submitted_at", { ascending: false });
      if (data) setSubmissions(data);
    }, 3000);
    return () => clearInterval(interval);
  }, [sessionId]);

  return (
    <div style={{ maxWidth: 500, margin: "40px auto", padding: 20, fontFamily: "system-ui" }}>
      <h1 style={{ fontSize: 24, marginBottom: 20 }}>Teacher - Attendance Session</h1>

      <button onClick={getLocation} style={btnStyle}>📍 Get My Location</button>
      {locError && <p style={{ color: "red" }}>{locError}</p>}
      {lat != null && <p>Lat: {lat.toFixed(6)}, Lng: {lng!.toFixed(6)}</p>}

      <button onClick={generateQR} disabled={lat == null || loading || qrGenerated} style={{ ...btnStyle, marginTop: 12, opacity: lat == null || qrGenerated ? 0.5 : 1 }}>
        {loading ? "Generating..." : "Generate Attendance QR"}
      </button>

      {qrGenerated && (
        <div style={{ marginTop: 20 }}>
          <QRCodeSVG value={sessionCode} size={200} />
          <p style={{ marginTop: 8 }}>Session Code: <strong>{sessionCode}</strong></p>
        </div>
      )}

      {sessionId && (
        <div style={{ marginTop: 24 }}>
          <h3 style={{ fontSize: 16 }}>Submissions ({submissions.length})</h3>
          {submissions.length === 0 ? <p style={{ color: "#888" }}>No submissions yet...</p> : (
            <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 8, fontSize: 14 }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #ddd", textAlign: "left" }}>
                  <th style={{ padding: 6 }}>Name</th>
                  <th style={{ padding: 6 }}>USN</th>
                  <th style={{ padding: 6 }}>Distance</th>
                  <th style={{ padding: 6 }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((s) => (
                  <tr key={s.id} style={{ borderBottom: "1px solid #eee" }}>
                    <td style={{ padding: 6 }}>{s.student_name}</td>
                    <td style={{ padding: 6 }}>{s.student_usn}</td>
                    <td style={{ padding: 6 }}>{s.distance_meters}m</td>
                    <td style={{ padding: 6, color: s.attendance_status === "valid" ? "green" : "red" }}>
                      {s.attendance_status === "valid" ? "✅ Valid" : "❌ Invalid"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
};

const btnStyle: React.CSSProperties = {
  padding: "10px 20px", fontSize: 16, cursor: "pointer", borderRadius: 6,
  border: "1px solid #ccc", background: "#f5f5f5",
};

export default TeacherPage;
