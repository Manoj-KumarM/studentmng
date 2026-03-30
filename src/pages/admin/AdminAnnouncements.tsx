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
import { Textarea } from "@/components/ui/textarea";

const AdminAnnouncements = () => {
  const navigate = useNavigate();
  const user = getStoredUser();
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [form, setForm] = useState({ title: "", message: "", branch: "", semester: "", section: "" });

  useEffect(() => {
    if (!user || user.role !== "admin") { navigate("/login"); return; }
    loadAnnouncements();
  }, []);

  const loadAnnouncements = async () => {
    const { data } = await supabase.from("announcements").select("*").order("created_at", { ascending: false });
    setAnnouncements(data || []);
  };

  const addAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    await supabase.from("announcements").insert({
      title: form.title, message: form.message,
      branch: form.branch || null, semester: form.semester || null, section: form.section || null,
    });
    setForm({ title: "", message: "", branch: "", semester: "", section: "" });
    loadAnnouncements();
  };

  if (!user) return null;

  return (
    <DashboardLayout menuItems={adminMenuItems} roleLabel="Administrator" groupLabel="Management">
      <PageHeader title="Announcements" description="Create and manage campus announcements" />
      <Card className="mb-6">
        <CardHeader><CardTitle className="text-base">Create Announcement</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={addAnnouncement} className="space-y-3">
            <div><Label>Title *</Label><Input required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></div>
            <div><Label>Message *</Label><Textarea required value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} /></div>
            <div className="grid grid-cols-3 gap-3">
              <div><Label>Branch</Label><Input placeholder="All" value={form.branch} onChange={e => setForm({ ...form, branch: e.target.value })} /></div>
              <div><Label>Semester</Label><Input placeholder="All" value={form.semester} onChange={e => setForm({ ...form, semester: e.target.value })} /></div>
              <div><Label>Section</Label><Input placeholder="All" value={form.section} onChange={e => setForm({ ...form, section: e.target.value })} /></div>
            </div>
            <Button type="submit">Post Announcement</Button>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="text-base">Announcements ({announcements.length})</CardTitle></CardHeader>
        <CardContent>
          {announcements.length === 0 ? <p className="text-sm text-muted-foreground">No announcements yet</p> : (
            <div className="space-y-3">
              {announcements.map(a => (
                <div key={a.id} className="border rounded-lg p-4">
                  <p className="font-medium">{a.title}</p>
                  <p className="text-sm text-muted-foreground mt-1">{a.message}</p>
                  <p className="text-xs text-muted-foreground mt-2">{a.branch || "All"} · {a.semester || "All"} · {a.section || "All"} · {new Date(a.created_at).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default AdminAnnouncements;
