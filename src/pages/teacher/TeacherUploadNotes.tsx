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

const TeacherUploadNotes = () => {
  const navigate = useNavigate();
  const user = getStoredUser();
  const roleData = getRoleData();
  const [subjects, setSubjects] = useState<any[]>([]);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteUrl, setNoteUrl] = useState("");
  const [noteSubject, setNoteSubject] = useState("");
  const [notesList, setNotesList] = useState<any[]>([]);

  useEffect(() => {
    if (!user || user.role !== "teacher") { navigate("/login"); return; }
    loadSubjects();
    loadNotes();
  }, []);

  const loadSubjects = async () => {
    if (!roleData?.id) return;
    const { data } = await supabase.from("subjects").select("*").eq("teacher_id", roleData.id);
    setSubjects(data || []);
  };

  const loadNotes = async () => {
    if (!user) return;
    const { data } = await supabase.from("notes").select("*, subjects(subject_name)").eq("uploaded_by", user.id).order("created_at", { ascending: false });
    setNotesList(data || []);
  };

  const uploadNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteTitle || !noteUrl || !noteSubject || !user) return;
    await supabase.from("notes").insert({
      title: noteTitle, file_url: noteUrl, subject_id: noteSubject, uploaded_by: user.id,
    });
    setNoteTitle(""); setNoteUrl("");
    loadNotes();
  };

  if (!user) return null;

  return (
    <DashboardLayout menuItems={teacherMenuItems} roleLabel="Teacher" groupLabel="Teaching">
      <PageHeader title="Upload Notes" description="Share notes and materials with students" />
      <Card className="mb-6">
        <CardContent className="p-5">
          <form onSubmit={uploadNote} className="space-y-3">
            <div>
              <Label>Subject</Label>
              <select value={noteSubject} onChange={e => setNoteSubject(e.target.value)} required
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1">
                <option value="">Select Subject</option>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.subject_name}</option>)}
              </select>
            </div>
            <div><Label>Title *</Label><Input required value={noteTitle} onChange={e => setNoteTitle(e.target.value)} /></div>
            <div><Label>File URL (Google Drive / PDF link) *</Label><Input required value={noteUrl} onChange={e => setNoteUrl(e.target.value)} /></div>
            <Button type="submit">Upload Note</Button>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="text-base">Uploaded Notes ({notesList.length})</CardTitle></CardHeader>
        <CardContent>
          {notesList.length === 0 ? <p className="text-sm text-muted-foreground">No notes yet</p> : (
            <div className="space-y-3">
              {notesList.map(n => (
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

export default TeacherUploadNotes;
