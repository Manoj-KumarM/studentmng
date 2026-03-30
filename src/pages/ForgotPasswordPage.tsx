import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GraduationCap } from "lucide-react";

const ForgotPasswordPage = () => {
  const [step, setStep] = useState<"email" | "code" | "done">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [debugCode, setDebugCode] = useState("");
  const navigate = useNavigate();

  const sendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setLoading(true);
    const { data, error: fnError } = await supabase.functions.invoke("reset-password", {
      body: { action: "send_code", email },
    });
    if (fnError || data?.error) { setError(data?.error || "Failed to send code"); }
    else { setDebugCode(data?.code || ""); setStep("code"); }
    setLoading(false);
  };

  const resetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (newPassword !== confirmPassword) { setError("Passwords do not match"); return; }
    if (newPassword.length < 6) { setError("Password must be at least 6 characters"); return; }
    setLoading(true);
    const { data, error: fnError } = await supabase.functions.invoke("reset-password", {
      body: { action: "verify_and_reset", email, code, new_password: newPassword },
    });
    if (fnError || data?.error) { setError(data?.error || "Failed to reset password"); }
    else { setStep("done"); }
    setLoading(false);
  };

  if (step === "done") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="p-8">
            <div className="h-12 w-12 rounded-xl bg-green-100 flex items-center justify-center mx-auto mb-4">
              <GraduationCap className="h-7 w-7 text-green-600" />
            </div>
            <h2 className="text-xl font-bold mb-2">Password Reset Successful</h2>
            <p className="text-sm text-muted-foreground mb-4">You can now sign in with your new password.</p>
            <Button onClick={() => navigate("/login")} className="w-full">Go to Login</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-3">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <GraduationCap className="h-7 w-7 text-primary" />
            </div>
          </div>
          <CardTitle className="text-xl">Forgot Password</CardTitle>
          <CardDescription>{step === "email" ? "Enter your email to receive a reset code" : "Enter the code and your new password"}</CardDescription>
        </CardHeader>
        <CardContent>
          {step === "email" && (
            <form onSubmit={sendCode} className="space-y-4">
              <div><Label>Email</Label><Input value={email} onChange={e => setEmail(e.target.value)} type="email" required placeholder="your@email.com" className="mt-1" /></div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" disabled={loading} className="w-full">{loading ? "Sending..." : "Send Reset Code"}</Button>
            </form>
          )}
          {step === "code" && (
            <form onSubmit={resetPassword} className="space-y-4">
              {debugCode && (
                <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg p-3 text-sm">
                  <strong>Prototype:</strong> Your code is <strong>{debugCode}</strong>
                </div>
              )}
              <div><Label>Reset Code</Label><Input value={code} onChange={e => setCode(e.target.value)} required placeholder="6-digit code" className="mt-1" /></div>
              <div><Label>New Password</Label><Input value={newPassword} onChange={e => setNewPassword(e.target.value)} type="password" required placeholder="New password" className="mt-1" /></div>
              <div><Label>Confirm Password</Label><Input value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} type="password" required placeholder="Confirm password" className="mt-1" /></div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" disabled={loading} className="w-full">{loading ? "Resetting..." : "Reset Password"}</Button>
            </form>
          )}
          <div className="text-center mt-4">
            <Link to="/login" className="text-sm text-primary hover:underline">Back to Login</Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ForgotPasswordPage;
