import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getStoredUser, getRoleData } from "@/lib/auth";
import { QRCodeSVG } from "qrcode.react";
import DashboardLayout from "@/components/DashboardLayout";
import PageHeader from "@/components/PageHeader";
import { teacherMenuItems } from "@/pages/TeacherDashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

function generateCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

const TeacherAttendance = () => {
  const navigate = useNavigate();
  const user = getStoredUser();
  const roleData = getRoleData();
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

  useEffect(() => {
    if (!user || user.role !== "teacher") { navigate("/login"); return; }
    loadSubjects();
  }, []);

  const loadSubjects = async () => {
    if (!roleData?.id) return;
    const { data } = await supabase.from("subjects").select("*").eq("teacher_id", roleData.id);
    setSubjects(data || []);
  };

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
    const { data } = await supabase.from("attendance_sessions").insert({
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
    setQrGenerated(false); setSessionCode(""); setSessionId(""); setSubmissions([]);
    alert("Session closed. Absent students marked.");
  };

  useEffect(() => {
    if (!sessionId) return;
    const interval = setInterval(async () => {
      const { data } = await supabase.from("attendance_submissions").select("*").eq("session_id", sessionId).order("submitted_at", { ascending: false });
      if (data) setSubmissions(data);
    }, 3000);
    return () => clearInterval(interval);
  }, [sessionId]);

  if (!user) return null;

  return (
    <DashboardLayout menuItems={teacherMenuItems} roleLabel="Teacher" groupLabel="Teaching">
      <PageHeader title="Take Attendance" description="Generate QR code for attendance session" />
      <Card className="mb-6">
        <CardContent className="p-5 space-y-4">
          <div>
            <Label>Select Subject</Label>
            <select value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1">
              <option value="">-- Select --</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.subject_name} ({s.subject_code})</option>)}
            </select>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={getLocation}>📍 Get My Location</Button>
            {lat != null && <span className="text-sm text-muted-foreground">Lat: {lat.toFixed(6)}, Lng: {lng!.toFixed(6)}</span>}
          </div>
          {locError && <p className="text-sm text-destructive">{locError}</p>}
          <Button onClick={generateQR} disabled={lat == null || loading || qrGenerated || !selectedSubject}>
            {loading ? "Generating..." : "Generate Attendance QR"}
          </Button>
        </CardContent>
      </Card>

      {qrGenerated && (
        <Card className="mb-6">
          <CardContent className="p-5 flex flex-col items-center gap-4">
            <QRCodeSVG value={sessionCode} size={200} />
            <p className="text-sm">Session Code: <span className="font-bold font-mono">{sessionCode}</span></p>
            <Button variant="destructive" onClick={closeSession}>Close Session</Button>
          </CardContent>
        </Card>
      )}

      {sessionId && (
        <Card>
          <CardHeader><CardTitle className="text-base">Submissions ({submissions.length})</CardTitle></CardHeader>
          <CardContent>
            {submissions.length === 0 ? <p className="text-sm text-muted-foreground">No submissions yet...</p> : (
              <Table>
                <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>USN</TableHead><TableHead>Distance</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                <TableBody>
                  {submissions.map(s => (
                    <TableRow key={s.id}>
                      <TableCell>{s.student_name}</TableCell>
                      <TableCell className="font-mono text-xs">{s.student_usn}</TableCell>
                      <TableCell>{s.distance_meters}m</TableCell>
                      <TableCell className={s.attendance_status === "valid" ? "text-green-600" : "text-destructive"}>
                        {s.attendance_status === "valid" ? "✅ Valid" : "❌ Invalid"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </DashboardLayout>
  );
};

export default TeacherAttendance;
