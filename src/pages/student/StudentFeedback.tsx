import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getStoredUser, getRoleData } from "@/lib/auth";
import DashboardLayout from "@/components/DashboardLayout";
import PageHeader from "@/components/PageHeader";
import { studentMenuItems } from "@/pages/StudentDashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

const StudentFeedback = () => {
  const navigate = useNavigate();
  const user = getStoredUser();
  const roleData = getRoleData();
  const [forms, setForms] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [rating, setRating] = useState(3);
  const [comments, setComments] = useState("");

  useEffect(() => {
    if (!user || user.role !== "student") { navigate("/login"); return; }
    loadForms();
  }, []);

  const loadForms = async () => {
    const { data } = await supabase.from("feedback_forms").select("*").order("created_at", { ascending: false });
    setForms(data || []);
  };

  const submitFeedback = async () => {
    if (!selected || !roleData) return;
    await supabase.from("feedback_responses").insert({
      form_id: selected.id, student_id: roleData.id, rating, comments,
    });
    alert("Feedback submitted!");
    setSelected(null); setComments(""); setRating(3);
  };

  if (!user) return null;

  return (
    <DashboardLayout menuItems={studentMenuItems} roleLabel="Student" groupLabel="Academics">
      <PageHeader title="Feedback" description="Submit feedback for events" />
      {!selected ? (
        <Card>
          <CardContent className="p-5">
            {forms.length === 0 ? <p className="text-sm text-muted-foreground">No feedback forms</p> : (
              <div className="space-y-3">
                {forms.map(f => (
                  <div key={f.id} className="border rounded-lg p-4 cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setSelected(f)}>
                    <p className="font-medium">{f.event_name}</p>
                    <p className="text-xs text-muted-foreground mt-1">Click to submit feedback</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader><CardTitle className="text-base">{selected.event_name}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium mb-2">Questions:</p>
              {(() => { try { return JSON.parse(selected.questions); } catch { return []; } })().map((q: string, i: number) => (
                <p key={i} className="text-sm text-muted-foreground">Q{i + 1}: {q}</p>
              ))}
            </div>
            <div>
              <Label>Rating (1-5)</Label>
              <select value={rating} onChange={e => setRating(Number(e.target.value))}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1">
                {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n} ⭐</option>)}
              </select>
            </div>
            <div><Label>Comments (optional)</Label><Textarea value={comments} onChange={e => setComments(e.target.value)} className="mt-1" /></div>
            <div className="flex gap-3">
              <Button onClick={submitFeedback}>Submit Feedback</Button>
              <Button variant="outline" onClick={() => setSelected(null)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </DashboardLayout>
  );
};

export default StudentFeedback;
