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
import { Trash2 } from "lucide-react";

const AdminStudents = () => {
  const navigate = useNavigate();
  const user = getStoredUser();
  const [students, setStudents] = useState<any[]>([]);
  const [form, setForm] = useState({ name: "", email: "", usn: "", branch: "", semester: "", section: "", phone: "", parent_phone: "", parent_email: "" });

  useEffect(() => {
    if (!user || user.role !== "admin") { navigate("/login"); return; }
    loadStudents();
  }, []);

  const loadStudents = async () => {
    const { data } = await supabase.from("students").select("*, users!inner(name, email)");
    setStudents(data || []);
  };

  const addStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: userData, error: userErr } = await supabase.from("users").insert({
      name: form.name, email: form.email.toLowerCase(), password_hash: "student123_hashed", role: "student"
    }).select().single();
    if (userErr || !userData) { alert("Error: " + (userErr?.message || "Failed")); return; }
    await supabase.from("students").insert({
      user_id: userData.id, usn: form.usn, branch: form.branch,
      semester: form.semester, section: form.section, phone: form.phone,
      parent_phone: form.parent_phone, parent_email: form.parent_email,
    });
    setForm({ name: "", email: "", usn: "", branch: "", semester: "", section: "", phone: "", parent_phone: "", parent_email: "" });
    loadStudents();
  };

  const deleteStudent = async (student: any) => {
    if (!confirm("Delete this student?")) return;
    await supabase.from("users").delete().eq("id", student.user_id);
    loadStudents();
  };

  if (!user) return null;

  return (
    <DashboardLayout menuItems={adminMenuItems} roleLabel="Administrator" groupLabel="Management">
      <PageHeader title="Manage Students" description="Add, view and remove students" />
      <Card className="mb-6">
        <CardHeader><CardTitle className="text-base">Add New Student</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={addStudent} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div><Label>Name *</Label><Input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
            <div><Label>Email *</Label><Input required type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
            <div><Label>USN *</Label><Input required value={form.usn} onChange={e => setForm({ ...form, usn: e.target.value })} /></div>
            <div><Label>Branch *</Label><Input required value={form.branch} onChange={e => setForm({ ...form, branch: e.target.value })} /></div>
            <div><Label>Semester *</Label><Input required value={form.semester} onChange={e => setForm({ ...form, semester: e.target.value })} /></div>
            <div><Label>Section *</Label><Input required value={form.section} onChange={e => setForm({ ...form, section: e.target.value })} /></div>
            <div><Label>Phone</Label><Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
            <div><Label>Parent Phone</Label><Input value={form.parent_phone} onChange={e => setForm({ ...form, parent_phone: e.target.value })} /></div>
            <div><Label>Parent Email</Label><Input value={form.parent_email} onChange={e => setForm({ ...form, parent_email: e.target.value })} /></div>
            <div className="sm:col-span-2 lg:col-span-3">
              <Button type="submit" className="w-full sm:w-auto">Add Student</Button>
              <p className="text-xs text-muted-foreground mt-2">Default password: student123</p>
            </div>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="text-base">Students ({students.length})</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>USN</TableHead><TableHead>Branch</TableHead><TableHead>Sem</TableHead><TableHead>Sec</TableHead><TableHead>Actions</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {students.map(s => (
                <TableRow key={s.id}>
                  <TableCell>{(s as any).users?.name}</TableCell>
                  <TableCell>{(s as any).users?.email}</TableCell>
                  <TableCell className="font-mono text-xs">{s.usn}</TableCell>
                  <TableCell>{s.branch}</TableCell>
                  <TableCell>{s.semester}</TableCell>
                  <TableCell>{s.section}</TableCell>
                  <TableCell><Button variant="ghost" size="icon" onClick={() => deleteStudent(s)}><Trash2 className="h-4 w-4 text-destructive" /></Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default AdminStudents;
