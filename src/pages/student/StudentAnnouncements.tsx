import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getStoredUser, getRoleData } from "@/lib/auth";
import DashboardLayout from "@/components/DashboardLayout";
import PageHeader from "@/components/PageHeader";
import { studentMenuItems } from "@/pages/StudentDashboard";
import { Card, CardContent } from "@/components/ui/card";

const StudentAnnouncements = () => {
  const navigate = useNavigate();
  const user = getStoredUser();
  const roleData = getRoleData();
  const [announcements, setAnnouncements] = useState<any[]>([]);

  useEffect(() => {
    if (!user || user.role !== "student") { navigate("/login"); return; }
    loadAnnouncements();
  }, []);

  const loadAnnouncements = async () => {
    if (!roleData) return;
    const { data } = await supabase.from("announcements").select("*").order("created_at", { ascending: false });
    const filtered = (data || []).filter(a =>
      (!a.branch || a.branch === roleData.branch) &&
      (!a.semester || a.semester === roleData.semester) &&
      (!a.section || a.section === roleData.section)
    );
    setAnnouncements(filtered);
  };

  if (!user) return null;

  return (
    <DashboardLayout menuItems={studentMenuItems} roleLabel="Student" groupLabel="Academics">
      <PageHeader title="Announcements" description="Campus announcements" />
      <Card>
        <CardContent className="p-5">
          {announcements.length === 0 ? <p className="text-sm text-muted-foreground">No announcements</p> : (
            <div className="space-y-3">
              {announcements.map(a => (
                <div key={a.id} className="border rounded-lg p-4">
                  <p className="font-medium">{a.title}</p>
                  <p className="text-sm text-muted-foreground mt-1">{a.message}</p>
                  <p className="text-xs text-muted-foreground mt-2">{new Date(a.created_at).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default StudentAnnouncements;
