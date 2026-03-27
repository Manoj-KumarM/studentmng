import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const ForgotPasswordPage = () => {
  const [step, setStep] = useState<"email" | "code" | "done">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [debugCode, setDebugCode] = useState("");
  const navigate = useNavigate();

  const sendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { data, error: fnError } = await supabase.functions.invoke("reset-password", {
      body: { action: "send_code", email },
    });

    if (fnError || data?.error) {
      setError(data?.error || "Failed to send code");
    } else {
      setMessage("Reset code sent to your email");
      setDebugCode(data?.code || ""); // For prototype testing
      setStep("code");
    }
    setLoading(false);
  };

  const resetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    const { data, error: fnError } = await supabase.functions.invoke("reset-password", {
      body: { action: "verify_and_reset", email, code, new_password: newPassword },
    });

    if (fnError || data?.error) {
      setError(data?.error || "Failed to reset password");
    } else {
      setStep("done");
    }
    setLoading(false);
  };

  if (step === "done") {
    return (
      <div style={{ maxWidth: 400, margin: "80px auto", padding: 20, fontFamily: "system-ui", textAlign: "center" }}>
        <h2 style={{ fontSize: 22, marginBottom: 12 }}>Password Reset Successful</h2>
        <p style={{ color: "#666", marginBottom: 20 }}>You can now login with your new password.</p>
        <Link to="/login" style={{ color: "#1a73e8", textDecoration: "none", fontSize: 16 }}>Go to Login</Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 400, margin: "80px auto", padding: 20, fontFamily: "system-ui" }}>
      <h1 style={{ fontSize: 24, marginBottom: 8, textAlign: "center" }}>Forgot Password</h1>
      <p style={{ color: "#666", marginBottom: 24, textAlign: "center" }}>
        {step === "email" ? "Enter your email to receive a reset code" : "Enter the code and your new password"}
      </p>

      {step === "email" && (
        <form onSubmit={sendCode}>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: "block", marginBottom: 4, fontWeight: 500 }}>Email</label>
            <input value={email} onChange={e => setEmail(e.target.value)} type="email" required style={inputStyle} placeholder="your@email.com" />
          </div>
          {error && <p style={{ color: "red", marginBottom: 12 }}>{error}</p>}
          <button type="submit" disabled={loading} style={{ ...btnStyle, width: "100%", background: "#1a73e8", color: "#fff", border: "none" }}>
            {loading ? "Sending..." : "Send Reset Code"}
          </button>
        </form>
      )}

      {step === "code" && (
        <form onSubmit={resetPassword}>
          {debugCode && (
            <div style={{ background: "#fff3cd", padding: 8, borderRadius: 6, marginBottom: 12, fontSize: 14 }}>
              <strong>Prototype:</strong> Your code is <strong>{debugCode}</strong>
            </div>
          )}
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: "block", marginBottom: 4, fontWeight: 500 }}>Reset Code</label>
            <input value={code} onChange={e => setCode(e.target.value)} required style={inputStyle} placeholder="6-digit code" />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: "block", marginBottom: 4, fontWeight: 500 }}>New Password</label>
            <input value={newPassword} onChange={e => setNewPassword(e.target.value)} type="password" required style={inputStyle} placeholder="New password" />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: "block", marginBottom: 4, fontWeight: 500 }}>Confirm Password</label>
            <input value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} type="password" required style={inputStyle} placeholder="Confirm password" />
          </div>
          {error && <p style={{ color: "red", marginBottom: 12 }}>{error}</p>}
          <button type="submit" disabled={loading} style={{ ...btnStyle, width: "100%", background: "#1a73e8", color: "#fff", border: "none" }}>
            {loading ? "Resetting..." : "Reset Password"}
          </button>
        </form>
      )}

      <div style={{ textAlign: "center", marginTop: 16 }}>
        <Link to="/login" style={{ color: "#1a73e8", textDecoration: "none" }}>Back to Login</Link>
      </div>
    </div>
  );
};

const inputStyle: React.CSSProperties = { width: "100%", padding: 8, fontSize: 16, borderRadius: 6, border: "1px solid #ccc", boxSizing: "border-box" };
const btnStyle: React.CSSProperties = { padding: "10px 20px", fontSize: 16, cursor: "pointer", borderRadius: 6, border: "1px solid #ccc", background: "#f5f5f5" };

export default ForgotPasswordPage;
