import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const StudentPage = () => {
  const [name, setName] = useState("");
  const [usn, setUsn] = useState("");
  const [sessionCode, setSessionCode] = useState("");
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [locError, setLocError] = useState("");
  const [result, setResult] = useState<{ status: string; message: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [scanning, setScanning] = useState(false);
  const scannerRef = useRef<any>(null);
  const videoRef = useRef<HTMLDivElement>(null);

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
    const scanner = new Html5Qrcode("qr-reader");
    scannerRef.current = scanner;
    try {
      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: 250 },
        (text: string) => {
          setSessionCode(text);
          scanner.stop().catch(() => {});
          setScanning(false);
        },
        () => {}
      );
    } catch {
      setScanning(false);
    }
  };

  const stopScan = () => {
    scannerRef.current?.stop().catch(() => {});
    setScanning(false);
  };

  useEffect(() => {
    return () => { scannerRef.current?.stop().catch(() => {}); };
  }, []);

  const submit = async () => {
    if (!name || !usn || !sessionCode || lat == null || lng == null) return;
    setSubmitting(true);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("submit-attendance", {
        body: { session_code: sessionCode, student_name: name, student_usn: usn, student_latitude: lat, student_longitude: lng },
      });
      if (error) {
        setResult({ status: "error", message: "Network error" });
      } else {
        setResult({ status: data.status, message: data.message });
      }
    } catch {
      setResult({ status: "error", message: "Something went wrong" });
    }
    setSubmitting(false);
  };

  const statusColor = result ? (result.status === "marked" ? "green" : result.status === "duplicate" ? "orange" : "red") : "black";

  return (
    <div style={{ maxWidth: 500, margin: "40px auto", padding: 20, fontFamily: "system-ui" }}>
      <h1 style={{ fontSize: 24, marginBottom: 20 }}>Student - Mark Attendance</h1>

      <div style={{ marginBottom: 12 }}>
        <label style={{ display: "block", marginBottom: 4, fontWeight: 500 }}>Name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" style={inputStyle} />
      </div>

      <div style={{ marginBottom: 12 }}>
        <label style={{ display: "block", marginBottom: 4, fontWeight: 500 }}>USN / Roll Number</label>
        <input value={usn} onChange={(e) => setUsn(e.target.value)} placeholder="e.g. 1XX21CS001" style={inputStyle} />
      </div>

      <div style={{ marginBottom: 12 }}>
        {!scanning ? (
          <button onClick={startScan} style={btnStyle}>📷 Scan QR Code</button>
        ) : (
          <button onClick={stopScan} style={{ ...btnStyle, background: "#fee" }}>Stop Scanning</button>
        )}
        <div id="qr-reader" style={{ marginTop: 8, display: scanning ? "block" : "none" }} />
      </div>

      <div style={{ marginBottom: 12 }}>
        <label style={{ display: "block", marginBottom: 4, fontWeight: 500 }}>Session Code (or enter manually)</label>
        <input value={sessionCode} onChange={(e) => setSessionCode(e.target.value.toUpperCase())} placeholder="e.g. ABC123" style={inputStyle} />
      </div>

      <button onClick={getLocation} style={{ ...btnStyle, marginBottom: 12 }}>📍 Get My Location</button>
      {locError && <p style={{ color: "red" }}>{locError}</p>}
      {lat != null && <p>Lat: {lat.toFixed(6)}, Lng: {lng!.toFixed(6)}</p>}

      <button
        onClick={submit}
        disabled={!name || !usn || !sessionCode || lat == null || submitting}
        style={{ ...btnStyle, marginTop: 8, background: "#e0f7e0", opacity: (!name || !usn || !sessionCode || lat == null) ? 0.5 : 1 }}
      >
        {submitting ? "Submitting..." : "Submit Attendance"}
      </button>

      {result && (
        <div style={{ marginTop: 16, padding: 12, borderRadius: 6, border: `2px solid ${statusColor}`, background: `${statusColor}11` }}>
          <strong style={{ color: statusColor }}>{result.message}</strong>
        </div>
      )}
    </div>
  );
};

const inputStyle: React.CSSProperties = { width: "100%", padding: 8, fontSize: 16, borderRadius: 6, border: "1px solid #ccc", boxSizing: "border-box" };
const btnStyle: React.CSSProperties = { padding: "10px 20px", fontSize: 16, cursor: "pointer", borderRadius: 6, border: "1px solid #ccc", background: "#f5f5f5" };

export default StudentPage;
