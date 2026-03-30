import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getStoredUser, getRoleData } from "@/lib/auth";
import DashboardLayout from "@/components/DashboardLayout";
import PageHeader from "@/components/PageHeader";
import { studentMenuItems } from "@/pages/StudentDashboard";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const StudentMarks = () => {
  const navigate = useNavigate();
  const user = getStoredUser();
  const roleData = getRoleData();
  const [marks, setMarks] = useState<any[]>([]);

  useEffect(() => {
    if (!user || user.role !== "student") { navigate("/login"); return; }
    loadMarks();
  }, []);

  const loadMarks = async () => {
    if (!roleData?.id) return;
    const { data } = await supabase.from("marks").select("*, subjects(subject_name)").eq("student_id", roleData.id).order("created_at", { ascending: false });
    setMarks(data || []);
  };

  if (!user) return null;

  return (
    <DashboardLayout menuItems={studentMenuItems} roleLabel="Student" groupLabel="Academics">
      <PageHeader title="Marks" description="View your exam marks" />
      <Card>
        <CardContent className="p-5">
          {marks.length === 0 ? <p className="text-sm text-muted-foreground">No marks yet</p> : (
            <Table>
              <TableHeader><TableRow><TableHead>Subject</TableHead><TableHead>Exam</TableHead><TableHead>Marks</TableHead></TableRow></TableHeader>
              <TableBody>
                {marks.map(m => (
                  <TableRow key={m.id}>
                    <TableCell>{(m as any).subjects?.subject_name}</TableCell>
                    <TableCell>{m.exam_name}</TableCell>
                    <TableCell className="font-bold">{m.marks}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default StudentMarks;
