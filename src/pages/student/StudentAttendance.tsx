import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getStoredUser, getRoleData } from "@/lib/auth";
import DashboardLayout from "@/components/DashboardLayout";
import PageHeader from "@/components/PageHeader";
import { studentMenuItems } from "@/pages/StudentDashboard";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const StudentAttendance = () => {
  const navigate = useNavigate();
  const user = getStoredUser();
  const roleData = getRoleData();
  const [sessionCode, setSessionCode] = useState("");
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [locError, setLocError] = useState("");
  const [result, setResult] = useState<{ status: string; message: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [scanning, setScanning] = useState(false);
  const scannerRef = useRef<any>(null);

  useEffect(() => {
    if (!user || user.role !== "student") { navigate("/login"); return; }
  }, []);

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
    const scanner = new Html5Qrcode("qr-reader-student");
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

  if (!user || !roleData) return null;

  const statusColor = result ? (result.status === "marked" ? "text-green-600" : result.status === "duplicate" ? "text-yellow-600" : "text-destructive") : "";

  return (
    <DashboardLayout menuItems={studentMenuItems} roleLabel="Student" groupLabel="Academics">
      <PageHeader title="Submit Attendance" description="Scan QR code and submit your attendance" />
      <Card>
        <CardContent className="p-5 space-y-4">
          <div className="flex gap-3">
            {!scanning ? <Button variant="outline" onClick={startScan}>📷 Scan QR Code</Button>
            : <Button variant="destructive" onClick={() => { scannerRef.current?.stop().catch(() => {}); setScanning(false); }}>Stop Scanning</Button>}
          </div>
          <div id="qr-reader-student" style={{ display: scanning ? "block" : "none" }} />
          <div>
            <Label>Session Code</Label>
            <Input value={sessionCode} onChange={e => setSessionCode(e.target.value.toUpperCase())} placeholder="e.g. ABC123" className="mt-1" />
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={getLocation}>📍 Get My Location</Button>
            {lat != null && <span className="text-sm text-muted-foreground">Lat: {lat.toFixed(6)}, Lng: {lng!.toFixed(6)}</span>}
          </div>
          {locError && <p className="text-sm text-destructive">{locError}</p>}
          <Button onClick={submitAttendance} disabled={!sessionCode || lat == null || submitting}>
            {submitting ? "Submitting..." : "Submit Attendance"}
          </Button>
          {result && (
            <div className={`border rounded-lg p-3 ${statusColor}`}>
              <p className="font-medium text-sm">{result.message}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default StudentAttendance;
