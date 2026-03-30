import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getStoredUser, getRoleData } from "@/lib/auth";
import DashboardLayout from "@/components/DashboardLayout";
import PageHeader from "@/components/PageHeader";
import { studentMenuItems } from "@/pages/StudentDashboard";
import { Card, CardContent } from "@/components/ui/card";

const StudentNotes = () => {
  const navigate = useNavigate();
  const user = getStoredUser();
  const roleData = getRoleData();
  const [notes, setNotes] = useState<any[]>([]);

  useEffect(() => {
    if (!user || user.role !== "student") { navigate("/login"); return; }
    loadNotes();
  }, []);

  const loadNotes = async () => {
    if (!roleData) return;
    const { data: subjects } = await supabase.from("subjects").select("id").eq("branch", roleData.branch).eq("semester", roleData.semester).eq("section", roleData.section);
    const subjectIds = (subjects || []).map(s => s.id);
    const { data } = await supabase.from("notes").select("*, subjects(subject_name)").in("subject_id", subjectIds).order("created_at", { ascending: false });
    setNotes(data || []);
  };

  if (!user) return null;

  return (
    <DashboardLayout menuItems={studentMenuItems} roleLabel="Student" groupLabel="Academics">
      <PageHeader title="Notes" description="Download notes and materials" />
      <Card>
        <CardContent className="p-5">
          {notes.length === 0 ? <p className="text-sm text-muted-foreground">No notes available</p> : (
            <div className="space-y-3">
              {notes.map(n => (
                <div key={n.id} className="border rounded-lg p-3 flex justify-between items-center">
                  <div>
                    <p className="font-medium text-sm">{n.title}</p>
                    <p className="text-xs text-muted-foreground">{(n as any).subjects?.subject_name}</p>
                  </div>
                  <a href={n.file_url} target="_blank" className="text-sm text-primary hover:underline">Download</a>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default StudentNotes;
