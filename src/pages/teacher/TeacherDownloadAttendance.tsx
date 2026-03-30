import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getStoredUser, getRoleData } from "@/lib/auth";
import DashboardLayout from "@/components/DashboardLayout";
import PageHeader from "@/components/PageHeader";
import { teacherMenuItems } from "@/pages/TeacherDashboard";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const TeacherDownloadAttendance = () => {
  const navigate = useNavigate();
  const user = getStoredUser();
  const roleData = getRoleData();
  const [subjects, setSubjects] = useState<any[]>([]);
  const [records, setRecords] = useState<any[]>([]);
  const [filterDate, setFilterDate] = useState("");

  useEffect(() => {
    if (!user || user.role !== "teacher") { navigate("/login"); return; }
    loadSubjects();
  }, []);

  const loadSubjects = async () => {
    if (!roleData?.id) return;
    const { data } = await supabase.from("subjects").select("*").eq("teacher_id", roleData.id);
    setSubjects(data || []);
    if (data && data.length > 0) loadRecords(data);
  };

  const loadRecords = async (subs?: any[]) => {
    const subjectIds = (subs || subjects).map(s => s.id);
    if (subjectIds.length === 0) return;
    let query = supabase.from("attendance_records").select("*, students(usn, users:user_id(name)), subjects(subject_name)").in("subject_id", subjectIds).order("date", { ascending: false });
    if (filterDate) query = query.eq("date", filterDate);
    const { data } = await query.limit(200);
    setRecords(data || []);
  };

  const downloadCSV = () => {
    const headers = "Date,Subject,USN,Student Name,Status\n";
    const rows = records.map(r =>
      `${r.date},${(r as any).subjects?.subject_name || ""},${(r as any).students?.usn || ""},${(r as any).students?.users?.name || ""},${r.status}`
    ).join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `attendance_${filterDate || "all"}.csv`; a.click();
  };

  if (!user) return null;

  return (
    <DashboardLayout menuItems={teacherMenuItems} roleLabel="Teacher" groupLabel="Teaching">
      <PageHeader title="Download Attendance" description="Export attendance records as CSV" />
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} className="w-auto" />
            <Button variant="outline" onClick={() => loadRecords()}>Filter</Button>
            <Button onClick={downloadCSV}>Download CSV</Button>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{records.length} records found</p>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default TeacherDownloadAttendance;
