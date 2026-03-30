import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getStoredUser } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { KeyRound } from "lucide-react";

const ChangePasswordPage = () => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const user = getStoredUser();

  if (!user) { navigate("/login"); return null; }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setSuccess("");
    if (newPassword !== confirmPassword) { setError("New passwords do not match"); return; }
    if (newPassword.length < 6) { setError("Password must be at least 6 characters"); return; }
    setLoading(true);
    const { data, error: fnError } = await supabase.functions.invoke("reset-password", {
      body: { action: "change_password", user_id: user.id, current_password: currentPassword, new_password: newPassword },
    });
    if (fnError || data?.error) { setError(data?.error || "Failed to change password"); }
    else { setSuccess("Password changed successfully!"); setCurrentPassword(""); setNewPassword(""); setConfirmPassword(""); }
    setLoading(false);
  };

  const goBack = () => {
    if (user.role === "admin") navigate("/admin-dashboard");
    else if (user.role === "teacher") navigate("/teacher-dashboard");
    else navigate("/student-dashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-3">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <KeyRound className="h-7 w-7 text-primary" />
            </div>
          </div>
          <CardTitle className="text-xl">Change Password</CardTitle>
          <CardDescription>Update your account password</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div><Label>Current Password</Label><Input value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} type="password" required className="mt-1" /></div>
            <div><Label>New Password</Label><Input value={newPassword} onChange={e => setNewPassword(e.target.value)} type="password" required className="mt-1" /></div>
            <div><Label>Confirm New Password</Label><Input value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} type="password" required className="mt-1" /></div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            {success && <p className="text-sm text-green-600">{success}</p>}
            <Button type="submit" disabled={loading} className="w-full">{loading ? "Changing..." : "Change Password"}</Button>
          </form>
          <div className="text-center mt-4">
            <Button variant="ghost" onClick={goBack} className="text-sm">← Back to Dashboard</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ChangePasswordPage;
