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

const AdminTeachers = () => {
  const navigate = useNavigate();
  const user = getStoredUser();
  const [teachers, setTeachers] = useState<any[]>([]);
  const [form, setForm] = useState({ name: "", email: "", phone: "" });

  useEffect(() => {
    if (!user || user.role !== "admin") { navigate("/login"); return; }
    loadTeachers();
  }, []);

  const loadTeachers = async () => {
    const { data } = await supabase.from("teachers").select("*, users!inner(name, email)");
    setTeachers(data || []);
  };

  const addTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: userData, error: userErr } = await supabase.from("users").insert({
      name: form.name, email: form.email.toLowerCase(), password_hash: "teacher123_hashed", role: "teacher"
    }).select().single();
    if (userErr || !userData) { alert("Error: " + (userErr?.message || "Failed")); return; }
    await supabase.from("teachers").insert({ user_id: userData.id, phone: form.phone });
    setForm({ name: "", email: "", phone: "" });
    loadTeachers();
  };

  const deleteTeacher = async (teacher: any) => {
    if (!confirm("Delete this teacher?")) return;
    await supabase.from("users").delete().eq("id", teacher.user_id);
    loadTeachers();
  };

  if (!user) return null;

  return (
    <DashboardLayout menuItems={adminMenuItems} roleLabel="Administrator" groupLabel="Management">
      <PageHeader title="Manage Teachers" description="Add, view and remove teachers" />
      <Card className="mb-6">
        <CardHeader><CardTitle className="text-base">Add New Teacher</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={addTeacher} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div><Label>Name *</Label><Input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
            <div><Label>Email *</Label><Input required type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
            <div><Label>Phone</Label><Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
            <div className="sm:col-span-3">
              <Button type="submit">Add Teacher</Button>
              <p className="text-xs text-muted-foreground mt-2">Default password: teacher123</p>
            </div>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="text-base">Teachers ({teachers.length})</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Phone</TableHead><TableHead>Actions</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {teachers.map(t => (
                <TableRow key={t.id}>
                  <TableCell>{(t as any).users?.name}</TableCell>
                  <TableCell>{(t as any).users?.email}</TableCell>
                  <TableCell>{t.phone || "-"}</TableCell>
                  <TableCell><Button variant="ghost" size="icon" onClick={() => deleteTeacher(t)}><Trash2 className="h-4 w-4 text-destructive" /></Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default AdminTeachers;
