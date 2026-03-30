import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getStoredUser, getRoleData } from "@/lib/auth";
import DashboardLayout from "@/components/DashboardLayout";
import PageHeader from "@/components/PageHeader";
import { studentMenuItems } from "@/pages/StudentDashboard";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const StudentAttendancePercentage = () => {
  const navigate = useNavigate();
  const user = getStoredUser();
  const roleData = getRoleData();
  const [data, setData] = useState<{ subject: string; present: number; total: number }[]>([]);

  useEffect(() => {
    if (!user || user.role !== "student") { navigate("/login"); return; }
    loadData();
  }, []);

  const loadData = async () => {
    if (!roleData?.id) return;
    const { data: records } = await supabase.from("attendance_records").select("subject_id, status, subjects(subject_name)").eq("student_id", roleData.id);
    if (!records) return;
    const bySubject: Record<string, { subject: string; present: number; total: number }> = {};
    records.forEach(r => {
      const subId = r.subject_id;
      const subName = (r as any).subjects?.subject_name || "Unknown";
      if (!bySubject[subId]) bySubject[subId] = { subject: subName, present: 0, total: 0 };
      bySubject[subId].total++;
      if (r.status === "Present") bySubject[subId].present++;
    });
    setData(Object.values(bySubject));
  };

  if (!user) return null;

  return (
    <DashboardLayout menuItems={studentMenuItems} roleLabel="Student" groupLabel="Academics">
      <PageHeader title="Attendance Percentage" description="Subject-wise attendance overview" />
      <Card>
        <CardContent className="p-5">
          {data.length === 0 ? <p className="text-sm text-muted-foreground">No attendance records yet</p> : (
            <Table>
              <TableHeader><TableRow><TableHead>Subject</TableHead><TableHead>Present</TableHead><TableHead>Total</TableHead><TableHead>%</TableHead></TableRow></TableHeader>
              <TableBody>
                {data.map((a, i) => {
                  const pct = (a.present / a.total * 100);
                  return (
                    <TableRow key={i}>
                      <TableCell>{a.subject}</TableCell>
                      <TableCell>{a.present}</TableCell>
                      <TableCell>{a.total}</TableCell>
                      <TableCell className={`font-bold ${pct < 75 ? "text-destructive" : "text-green-600"}`}>{pct.toFixed(1)}%</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default StudentAttendancePercentage;
