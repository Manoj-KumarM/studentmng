import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getStoredUser } from "@/lib/auth";
import DashboardLayout from "@/components/DashboardLayout";
import PageHeader from "@/components/PageHeader";
import StatCard from "@/components/StatCard";
import { LayoutDashboard, Users, GraduationCap, BookOpen, Megaphone, MessageSquare, Radio, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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
    setStats({ students: s.count || 0, teachers: t.count || 0, subjects: sub.count || 0, sessions: sess.count || 0 });
    setRecentAnnouncements(ann.data || []);
  };

  if (!user) return null;

  return (
    <DashboardLayout menuItems={adminMenuItems} roleLabel="Administrator" groupLabel="Management">
      <PageHeader title="Dashboard" description="Overview of your institution" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard title="Total Students" value={stats.students} icon={Users} color="primary" />
        <StatCard title="Total Teachers" value={stats.teachers} icon={GraduationCap} color="success" />
        <StatCard title="Total Subjects" value={stats.subjects} icon={BookOpen} color="info" />
        <StatCard title="Active Sessions" value={stats.sessions} icon={Radio} color="warning" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {adminMenuItems.slice(1).map((item) => (
                <button
                  key={item.url}
                  onClick={() => navigate(item.url)}
                  className="flex items-center gap-3 p-3 rounded-xl border border-border/60 hover:border-primary/30 hover:bg-accent/50 transition-all duration-150 text-left group"
                >
                  <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <item.icon className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-sm font-medium">{item.title}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Announcements */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Megaphone className="h-4 w-4 text-primary" />
              Recent Announcements
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentAnnouncements.length === 0 ? (
              <div className="text-center py-8">
                <Megaphone className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No announcements yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentAnnouncements.map(a => (
                  <div key={a.id} className="p-3 rounded-lg bg-muted/50 border border-border/40">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium text-sm">{a.title}</p>
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

export default AdminDashboard;
