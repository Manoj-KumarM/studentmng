import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getStoredUser, getRoleData } from "@/lib/auth";
import DashboardLayout from "@/components/DashboardLayout";
import PageHeader from "@/components/PageHeader";
import StatCard from "@/components/StatCard";
import { LayoutDashboard, QrCode, PenLine, FileUp, FileText, Download, XCircle, KeyRound } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const teacherMenuItems = [
  { title: "Dashboard", url: "/teacher-dashboard", icon: LayoutDashboard },
  { title: "Take Attendance", url: "/teacher/attendance", icon: QrCode },
  { title: "Modify Attendance", url: "/teacher/modify-attendance", icon: PenLine },
  { title: "Upload Marks", url: "/teacher/upload-marks", icon: FileUp },
  { title: "Upload Notes", url: "/teacher/upload-notes", icon: FileText },
  { title: "Download Attendance", url: "/teacher/download-attendance", icon: Download },
  { title: "Change Password", url: "/change-password", icon: KeyRound },
];

export { teacherMenuItems };

const TeacherDashboard = () => {
  const navigate = useNavigate();
  const user = getStoredUser();
  const roleData = getRoleData();
  const [subjects, setSubjects] = useState<any[]>([]);
  const [activeSessions, setActiveSessions] = useState(0);

  useEffect(() => {
    if (!user || user.role !== "teacher") { navigate("/login"); return; }
    loadData();
  }, []);

  const loadData = async () => {
    if (!roleData?.id) return;
    const [subs, sess] = await Promise.all([
      supabase.from("subjects").select("*").eq("teacher_id", roleData.id),
      supabase.from("attendance_sessions").select("id", { count: "exact", head: true }).eq("is_active", true),
    ]);
    setSubjects(subs.data || []);
    setActiveSessions(sess.count || 0);
  };

  if (!user) return null;

  return (
    <DashboardLayout menuItems={teacherMenuItems} roleLabel="Teacher" groupLabel="Teaching">
      <PageHeader title="Teacher Dashboard" description={`Welcome back, ${user.name}`} />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard title="My Subjects" value={subjects.length} icon={FileText} />
        <StatCard title="Active Sessions" value={activeSessions} icon={QrCode} />
        <StatCard title="Role" value="Teacher" icon={LayoutDashboard} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate("/teacher/attendance")}>
          <CardContent className="p-5 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center"><QrCode className="h-5 w-5 text-primary" /></div>
            <div><p className="font-medium text-sm">Take Attendance</p><p className="text-xs text-muted-foreground">Generate QR code</p></div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate("/teacher/upload-marks")}>
          <CardContent className="p-5 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center"><FileUp className="h-5 w-5 text-primary" /></div>
            <div><p className="font-medium text-sm">Upload Marks</p><p className="text-xs text-muted-foreground">Enter exam marks</p></div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate("/teacher/upload-notes")}>
          <CardContent className="p-5 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center"><FileText className="h-5 w-5 text-primary" /></div>
            <div><p className="font-medium text-sm">Upload Notes</p><p className="text-xs text-muted-foreground">Share materials</p></div>
          </CardContent>
        </Card>
      </div>
      {subjects.length > 0 && (
        <Card className="mt-6">
          <CardHeader><CardTitle className="text-base">My Subjects</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {subjects.map(s => (
                <div key={s.id} className="border rounded-lg p-3">
                  <p className="font-medium text-sm">{s.subject_name}</p>
                  <p className="text-xs text-muted-foreground">{s.subject_code} · {s.branch} · Sem {s.semester} · Sec {s.section}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </DashboardLayout>
  );
};

export default TeacherDashboard;
