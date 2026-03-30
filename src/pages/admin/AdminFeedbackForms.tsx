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

const AdminFeedbackForms = () => {
  const navigate = useNavigate();
  const user = getStoredUser();
  const [feedbackForms, setFeedbackForms] = useState<any[]>([]);
  const [form, setForm] = useState({ event_name: "", questions: "" });

  useEffect(() => {
    if (!user || user.role !== "admin") { navigate("/login"); return; }
    loadForms();
  }, []);

  const loadForms = async () => {
    const { data } = await supabase.from("feedback_forms").select("*").order("created_at", { ascending: false });
    setFeedbackForms(data || []);
  };

  const addForm = async (e: React.FormEvent) => {
    e.preventDefault();
    const questions = form.questions.split("\n").filter(q => q.trim());
    await supabase.from("feedback_forms").insert({ event_name: form.event_name, questions: JSON.stringify(questions) });
    setForm({ event_name: "", questions: "" });
    loadForms();
  };

  if (!user) return null;

  return (
    <DashboardLayout menuItems={adminMenuItems} roleLabel="Administrator" groupLabel="Management">
      <PageHeader title="Feedback Forms" description="Create feedback forms for events" />
      <Card className="mb-6">
        <CardHeader><CardTitle className="text-base">Create Feedback Form</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={addForm} className="space-y-3">
            <div><Label>Event Name *</Label><Input required value={form.event_name} onChange={e => setForm({ ...form, event_name: e.target.value })} /></div>
            <div><Label>Questions (one per line) *</Label><Textarea required value={form.questions} onChange={e => setForm({ ...form, questions: e.target.value })} className="min-h-[100px]" /></div>
            <Button type="submit">Create Form</Button>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="text-base">Feedback Forms ({feedbackForms.length})</CardTitle></CardHeader>
        <CardContent>
          {feedbackForms.length === 0 ? <p className="text-sm text-muted-foreground">No forms yet</p> : (
            <div className="space-y-3">
              {feedbackForms.map(f => (
                <div key={f.id} className="border rounded-lg p-4">
                  <p className="font-medium">{f.event_name}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {(() => { try { return JSON.parse(f.questions).length; } catch { return 0; } })()} questions
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default AdminFeedbackForms;
