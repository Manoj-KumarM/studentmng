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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const TeacherModifyAttendance = () => {
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

  const toggleAttendance = async (recordId: string, currentStatus: string) => {
    const newStatus = currentStatus === "Present" ? "Absent" : "Present";
    await supabase.from("attendance_records").update({ status: newStatus }).eq("id", recordId);
    loadRecords();
  };

  if (!user) return null;

  return (
    <DashboardLayout menuItems={teacherMenuItems} roleLabel="Teacher" groupLabel="Teaching">
      <PageHeader title="Modify Attendance" description="View and toggle attendance records" />
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} className="w-auto" />
            <Button variant="outline" onClick={() => loadRecords()}>Filter</Button>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow><TableHead>Date</TableHead><TableHead>Subject</TableHead><TableHead>USN</TableHead><TableHead>Name</TableHead><TableHead>Status</TableHead><TableHead>Action</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {records.map(r => (
                <TableRow key={r.id}>
                  <TableCell>{r.date}</TableCell>
                  <TableCell>{(r as any).subjects?.subject_name}</TableCell>
                  <TableCell className="font-mono text-xs">{(r as any).students?.usn}</TableCell>
                  <TableCell>{(r as any).students?.users?.name}</TableCell>
                  <TableCell className={r.status === "Present" ? "text-green-600 font-medium" : "text-destructive font-medium"}>{r.status}</TableCell>
                  <TableCell><Button variant="outline" size="sm" onClick={() => toggleAttendance(r.id, r.status)}>Toggle</Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {records.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No records found</p>}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default TeacherModifyAttendance;
