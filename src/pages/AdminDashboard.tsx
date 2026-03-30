import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getStoredUser } from "@/lib/auth";
import DashboardLayout from "@/components/DashboardLayout";
import PageHeader from "@/components/PageHeader";
import StatCard from "@/components/StatCard";
import { LayoutDashboard, Users, GraduationCap, BookOpen, Megaphone, MessageSquare } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const adminMenuItems = [
  { title: "Dashboard", url: "/admin-dashboard", icon: LayoutDashboard },
  { title: "Students", url: "/admin/students", icon: Users },
  { title: "Teachers", url: "/admin/teachers", icon: GraduationCap },
  { title: "Subjects", url: "/admin/subjects", icon: BookOpen },
  { title: "Announcements", url: "/admin/announcements", icon: Megaphone },
  { title: "Feedback Forms", url: "/admin/feedback-forms", icon: MessageSquare },
];

export { adminMenuItems };

const AdminDashboard = () => {
  const navigate = useNavigate();
  const user = getStoredUser();
  const [stats, setStats] = useState({ students: 0, teachers: 0, subjects: 0, sessions: 0 });
  const [recentAnnouncements, setRecentAnnouncements] = useState<any[]>([]);

  useEffect(() => {
    if (!user || user.role !== "admin") { navigate("/login"); return; }
    loadStats();
  }, []);

  const loadStats = async () => {
    const [s, t, sub, sess, ann] = await Promise.all([
      supabase.from("students").select("id", { count: "exact", head: true }),
      supabase.from("teachers").select("id", { count: "exact", head: true }),
      supabase.from("subjects").select("id", { count: "exact", head: true }),
      supabase.from("attendance_sessions").select("id", { count: "exact", head: true }).eq("is_active", true),
      supabase.from("announcements").select("*").order("created_at", { ascending: false }).limit(5),
    ]);
    setStats({
      students: s.count || 0,
      teachers: t.count || 0,
      subjects: sub.count || 0,
      sessions: sess.count || 0,
    });
    setRecentAnnouncements(ann.data || []);
  };

  if (!user) return null;

  return (
    <DashboardLayout menuItems={adminMenuItems} roleLabel="Administrator" groupLabel="Management">
      <PageHeader title="Admin Dashboard" description="System overview and management" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Total Students" value={stats.students} icon={Users} />
        <StatCard title="Total Teachers" value={stats.teachers} icon={GraduationCap} />
        <StatCard title="Total Subjects" value={stats.subjects} icon={BookOpen} />
        <StatCard title="Active Sessions" value={stats.sessions} icon={LayoutDashboard} />
      </div>
      <Card>
        <CardHeader><CardTitle className="text-lg">Recent Announcements</CardTitle></CardHeader>
        <CardContent>
          {recentAnnouncements.length === 0 ? (
            <p className="text-sm text-muted-foreground">No announcements yet</p>
          ) : (
            <div className="space-y-3">
              {recentAnnouncements.map(a => (
                <div key={a.id} className="border-b pb-3 last:border-b-0 last:pb-0">
                  <p className="font-medium text-sm">{a.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">{a.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">{new Date(a.created_at).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default AdminDashboard;
