import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getStoredUser } from "@/lib/auth";
import DashboardLayout from "@/components/DashboardLayout";
import PageHeader from "@/components/PageHeader";
import { adminMenuItems } from "@/pages/AdminDashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const AdminSubjects = () => {
  const navigate = useNavigate();
  const user = getStoredUser();
  const [subjects, setSubjects] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [form, setForm] = useState({ subject_name: "", subject_code: "", branch: "", semester: "", section: "", teacher_id: "" });

  useEffect(() => {
    if (!user || user.role !== "admin") { navigate("/login"); return; }
    loadData();
  }, []);

  const loadData = async () => {
    const [subs, tchs] = await Promise.all([
      supabase.from("subjects").select("*, teachers(users(name))"),
      supabase.from("teachers").select("id, users!inner(name)"),
    ]);
    setSubjects(subs.data || []);
    setTeachers(tchs.data || []);
  };

  const addSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    await supabase.from("subjects").insert({
      subject_name: form.subject_name, subject_code: form.subject_code,
      branch: form.branch, semester: form.semester, section: form.section,
      teacher_id: form.teacher_id || null,
    });
    setForm({ subject_name: "", subject_code: "", branch: "", semester: "", section: "", teacher_id: "" });
    loadData();
  };

  if (!user) return null;

  return (
    <DashboardLayout menuItems={adminMenuItems} roleLabel="Administrator" groupLabel="Management">
      <PageHeader title="Manage Subjects" description="Add and assign subjects to teachers" />
      <Card className="mb-6">
        <CardHeader><CardTitle className="text-base">Add Subject</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={addSubject} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div><Label>Subject Name *</Label><Input required value={form.subject_name} onChange={e => setForm({ ...form, subject_name: e.target.value })} /></div>
            <div><Label>Subject Code *</Label><Input required value={form.subject_code} onChange={e => setForm({ ...form, subject_code: e.target.value })} /></div>
            <div><Label>Branch *</Label><Input required value={form.branch} onChange={e => setForm({ ...form, branch: e.target.value })} /></div>
            <div><Label>Semester *</Label><Input required value={form.semester} onChange={e => setForm({ ...form, semester: e.target.value })} /></div>
            <div><Label>Section *</Label><Input required value={form.section} onChange={e => setForm({ ...form, section: e.target.value })} /></div>
            <div>
              <Label>Teacher</Label>
              <select value={form.teacher_id} onChange={e => setForm({ ...form, teacher_id: e.target.value })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                <option value="">Select Teacher</option>
                {teachers.map(t => <option key={t.id} value={t.id}>{(t as any).users?.name}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2 lg:col-span-3"><Button type="submit">Add Subject</Button></div>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="text-base">Subjects ({subjects.length})</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow><TableHead>Name</TableHead><TableHead>Code</TableHead><TableHead>Branch</TableHead><TableHead>Sem</TableHead><TableHead>Sec</TableHead><TableHead>Teacher</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {subjects.map(s => (
                <TableRow key={s.id}>
                  <TableCell>{s.subject_name}</TableCell>
                  <TableCell className="font-mono text-xs">{s.subject_code}</TableCell>
                  <TableCell>{s.branch}</TableCell>
                  <TableCell>{s.semester}</TableCell>
                  <TableCell>{s.section}</TableCell>
                  <TableCell>{(s as any).teachers?.users?.name || "-"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default AdminSubjects;
