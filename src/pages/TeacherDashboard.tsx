import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getStoredUser, getRoleData } from "@/lib/auth";
import DashboardLayout from "@/components/DashboardLayout";
import PageHeader from "@/components/PageHeader";
import StatCard from "@/components/StatCard";
import { LayoutDashboard, QrCode, PenLine, FileUp, FileText, Download, KeyRound, Radio, BookOpen } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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

  const quickActions = [
    { title: "Take Attendance", desc: "Generate QR code", icon: QrCode, url: "/teacher/attendance", color: "bg-primary/10 text-primary" },
    { title: "Upload Marks", desc: "Enter exam marks", icon: FileUp, url: "/teacher/upload-marks", color: "bg-emerald-50 text-emerald-600" },
    { title: "Upload Notes", desc: "Share materials", icon: FileText, url: "/teacher/upload-notes", color: "bg-amber-50 text-amber-600" },
    { title: "Download Attendance", desc: "Export CSV", icon: Download, url: "/teacher/download-attendance", color: "bg-sky-50 text-sky-600" },
  ];

  return (
    <DashboardLayout menuItems={teacherMenuItems} roleLabel="Teacher" groupLabel="Teaching">
      <PageHeader title="Dashboard" description={`Welcome back, ${user.name}`} />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard title="My Subjects" value={subjects.length} icon={BookOpen} color="primary" />
        <StatCard title="Active Sessions" value={activeSessions} icon={Radio} color="warning" />
        <StatCard title="Role" value="Teacher" icon={LayoutDashboard} color="info" />
      </div>

      {/* Quick Actions */}
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Quick Actions</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {quickActions.map((action) => (
          <Card
            key={action.url}
            className="border-0 shadow-sm card-hover cursor-pointer group"
            onClick={() => navigate(action.url)}
          >
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${action.color} group-hover:scale-105 transition-transform`}>
                <action.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium text-sm">{action.title}</p>
                <p className="text-xs text-muted-foreground">{action.desc}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* My Subjects */}
      {subjects.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" />
              My Subjects
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {subjects.map(s => (
                <div key={s.id} className="p-3 rounded-xl border border-border/60 bg-muted/30">
                  <p className="font-medium text-sm">{s.subject_name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{s.subject_code} · {s.branch} · Sem {s.semester} · Sec {s.section}</p>
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
