import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GraduationCap, Mail, KeyRound, CheckCircle2, ArrowLeft, ShieldCheck } from "lucide-react";

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

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex h-14 w-14 rounded-2xl gradient-primary items-center justify-center shadow-lg mb-4">
            {step === "done" ? <CheckCircle2 className="h-7 w-7 text-white" /> : <ShieldCheck className="h-7 w-7 text-white" />}
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            {step === "done" ? "Password Reset!" : step === "code" ? "Enter Reset Code" : "Forgot Password"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {step === "done"
              ? "Your password has been updated successfully"
              : step === "code"
              ? "Enter the code sent to your email"
              : "We'll send a reset code to your email"}
          </p>
        </div>

        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            {step === "done" ? (
              <div className="text-center py-4">
                <div className="h-16 w-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="h-8 w-8 text-emerald-600" />
                </div>
                <p className="text-sm text-muted-foreground mb-6">You can now sign in with your new password.</p>
                <Button onClick={() => navigate("/login")} className="w-full h-11 font-semibold">
                  Back to Sign In
                </Button>
              </div>
            ) : step === "email" ? (
              <form onSubmit={sendCode} className="space-y-5">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input value={email} onChange={e => setEmail(e.target.value)} type="email" required placeholder="you@college.edu" className="pl-10 h-11 bg-background" />
                  </div>
                </div>
                {error && <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm px-4 py-2.5 rounded-lg">{error}</div>}
                <Button type="submit" disabled={loading} className="w-full h-11 font-semibold">
                  {loading ? "Sending..." : "Send Reset Code"}
                </Button>
              </form>
            ) : (
              <form onSubmit={resetPassword} className="space-y-5">
                {debugCode && (
                  <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-lg p-3 text-sm flex items-center gap-2">
                    <KeyRound className="h-4 w-4 shrink-0" />
                    <span><strong>Prototype:</strong> Your code is <strong className="font-mono">{debugCode}</strong></span>
                  </div>
                )}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Reset Code</Label>
                  <Input value={code} onChange={e => setCode(e.target.value)} required placeholder="6-digit code" className="h-11 bg-background text-center text-lg font-mono tracking-[0.5em]" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">New Password</Label>
                  <Input value={newPassword} onChange={e => setNewPassword(e.target.value)} type="password" required placeholder="••••••••" className="h-11 bg-background" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Confirm Password</Label>
                  <Input value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} type="password" required placeholder="••••••••" className="h-11 bg-background" />
                </div>
                {error && <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm px-4 py-2.5 rounded-lg">{error}</div>}
                <Button type="submit" disabled={loading} className="w-full h-11 font-semibold">
                  {loading ? "Resetting..." : "Reset Password"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        <div className="text-center mt-6">
          <Link to="/login" className="text-sm text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1">
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
