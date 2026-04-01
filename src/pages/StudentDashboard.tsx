import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getStoredUser, getRoleData } from "@/lib/auth";
import DashboardLayout from "@/components/DashboardLayout";
import PageHeader from "@/components/PageHeader";
import StatCard from "@/components/StatCard";
import { LayoutDashboard, QrCode, BarChart3, FileText, BookOpen, Megaphone, MessageSquare, User, KeyRound } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const studentMenuItems = [
  { title: "Dashboard", url: "/student-dashboard", icon: LayoutDashboard },
  { title: "Submit Attendance", url: "/student/attendance", icon: QrCode },
  { title: "Attendance %", url: "/student/attendance-percentage", icon: BarChart3 },
  { title: "Marks", url: "/student/marks", icon: FileText },
  { title: "Notes", url: "/student/notes", icon: BookOpen },
  { title: "Announcements", url: "/student/announcements", icon: Megaphone },
  { title: "Feedback", url: "/student/feedback", icon: MessageSquare },
  { title: "Profile", url: "/student/profile", icon: User },
  { title: "Change Password", url: "/change-password", icon: KeyRound },
];

export { studentMenuItems };

const StudentDashboard = () => {
  const navigate = useNavigate();
  const user = getStoredUser();
  const roleData = getRoleData();
  const [attendancePct, setAttendancePct] = useState<number | null>(null);
  const [recentMarks, setRecentMarks] = useState<any[]>([]);
  const [recentAnnouncements, setRecentAnnouncements] = useState<any[]>([]);

  useEffect(() => {
    if (!user || user.role !== "student") { navigate("/login"); return; }
    loadData();
  }, []);

  const loadData = async () => {
    if (!roleData?.id) return;
    const { data: records } = await supabase.from("attendance_records").select("status").eq("student_id", roleData.id);
    if (records && records.length > 0) {
      const present = records.filter(r => r.status === "Present").length;
      setAttendancePct(Math.round((present / records.length) * 100));
    }
    const { data: marks } = await supabase.from("marks").select("*, subjects(subject_name)").eq("student_id", roleData.id).order("created_at", { ascending: false }).limit(5);
    setRecentMarks(marks || []);
    const { data: ann } = await supabase.from("announcements").select("*").order("created_at", { ascending: false }).limit(5);
    const filtered = (ann || []).filter(a =>
      (!a.branch || a.branch === roleData.branch) &&
      (!a.semester || a.semester === roleData.semester) &&
      (!a.section || a.section === roleData.section)
    );
    setRecentAnnouncements(filtered.slice(0, 3));
  };

  if (!user || !roleData) return null;

  return (
    <DashboardLayout menuItems={studentMenuItems} roleLabel="Student" groupLabel="Academics">
      <PageHeader title="Dashboard" description={`Welcome, ${user.name} — ${roleData.usn}`} />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard
          title="Attendance"
          value={attendancePct != null ? `${attendancePct}%` : "N/A"}
          icon={BarChart3}
          color={attendancePct != null && attendancePct >= 75 ? "success" : "warning"}
        />
        <StatCard title="Recent Marks" value={recentMarks.length} icon={FileText} description="Latest entries" color="primary" />
        <StatCard title="Branch" value={`${roleData.branch} - ${roleData.section}`} icon={User} description={`Semester ${roleData.semester}`} color="info" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Marks */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              Recent Marks
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentMarks.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No marks available</p>
              </div>
            ) : (
              <div className="space-y-2">
                {recentMarks.map(m => (
                  <div key={m.id} className="flex justify-between items-center p-3 rounded-lg bg-muted/50 border border-border/40">
                    <div>
                      <p className="text-sm font-medium">{(m as any).subjects?.subject_name}</p>
                      <p className="text-xs text-muted-foreground">{m.exam_name}</p>
                    </div>
                    <Badge variant="secondary" className="font-bold text-sm">{m.marks}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Announcements */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Megaphone className="h-4 w-4 text-primary" />
              Announcements
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentAnnouncements.length === 0 ? (
              <div className="text-center py-8">
                <Megaphone className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No announcements</p>
              </div>
            ) : (
              <div className="space-y-2">
                {recentAnnouncements.map(a => (
                  <div key={a.id} className="p-3 rounded-lg bg-muted/50 border border-border/40">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium">{a.title}</p>
                      <Badge variant="secondary" className="text-[10px] shrink-0">
                        {new Date(a.created_at).toLocaleDateString()}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{a.message}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default StudentDashboard;
