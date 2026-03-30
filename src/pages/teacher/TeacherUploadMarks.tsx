import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getStoredUser, getRoleData } from "@/lib/auth";
import DashboardLayout from "@/components/DashboardLayout";
import PageHeader from "@/components/PageHeader";
import { teacherMenuItems } from "@/pages/TeacherDashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const TeacherUploadMarks = () => {
  const navigate = useNavigate();
  const user = getStoredUser();
  const roleData = getRoleData();
  const [subjects, setSubjects] = useState<any[]>([]);
  const [marksSubject, setMarksSubject] = useState("");
  const [examName, setExamName] = useState("");
  const [entries, setEntries] = useState<{ usn: string; marks: string }[]>([{ usn: "", marks: "" }]);

  useEffect(() => {
    if (!user || user.role !== "teacher") { navigate("/login"); return; }
    loadSubjects();
  }, []);

  const loadSubjects = async () => {
    if (!roleData?.id) return;
    const { data } = await supabase.from("subjects").select("*").eq("teacher_id", roleData.id);
    setSubjects(data || []);
  };

  const uploadMarks = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!marksSubject || !examName) return;
    for (const entry of entries) {
      if (!entry.usn || !entry.marks) continue;
      const { data: student } = await supabase.from("students").select("id").eq("usn", entry.usn).single();
      if (student) {
        await supabase.from("marks").insert({
          student_id: student.id, subject_id: marksSubject, exam_name: examName, marks: parseFloat(entry.marks),
        });
      }
    }
    alert("Marks uploaded!");
    setEntries([{ usn: "", marks: "" }]);
  };

  if (!user) return null;

  return (
    <DashboardLayout menuItems={teacherMenuItems} roleLabel="Teacher" groupLabel="Teaching">
      <PageHeader title="Upload Marks" description="Enter marks for students" />
      <Card>
        <CardContent className="p-5">
          <form onSubmit={uploadMarks} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label>Subject</Label>
                <select value={marksSubject} onChange={e => setMarksSubject(e.target.value)} required
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1">
                  <option value="">Select Subject</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.subject_name}</option>)}
                </select>
              </div>
              <div><Label>Exam Name</Label><Input required placeholder="e.g. Internal 1" value={examName} onChange={e => setExamName(e.target.value)} className="mt-1" /></div>
            </div>
            <div className="space-y-2">
              {entries.map((entry, i) => (
                <div key={i} className="flex gap-3">
                  <Input placeholder="USN" value={entry.usn} onChange={e => { const c = [...entries]; c[i].usn = e.target.value; setEntries(c); }} />
                  <Input placeholder="Marks" value={entry.marks} onChange={e => { const c = [...entries]; c[i].marks = e.target.value; setEntries(c); }} className="w-24" />
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={() => setEntries([...entries, { usn: "", marks: "" }])}>+ Add Row</Button>
              <Button type="submit">Upload Marks</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default TeacherUploadMarks;
