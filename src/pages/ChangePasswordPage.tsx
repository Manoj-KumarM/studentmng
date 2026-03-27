import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getStoredUser } from "@/lib/auth";

const ChangePasswordPage = () => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const user = getStoredUser();

  if (!user) {
    navigate("/login");
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match");
      return;
    }
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    const { data, error: fnError } = await supabase.functions.invoke("reset-password", {
      body: { action: "change_password", user_id: user.id, current_password: currentPassword, new_password: newPassword },
    });

    if (fnError || data?.error) {
      setError(data?.error || "Failed to change password");
    } else {
      setSuccess("Password changed successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }
    setLoading(false);
  };

  const goBack = () => {
    if (user.role === "admin") navigate("/admin");
    else if (user.role === "teacher") navigate("/teacher-dashboard");
    else navigate("/student-dashboard");
  };

  return (
    <div style={{ maxWidth: 400, margin: "60px auto", padding: 20, fontFamily: "system-ui" }}>
      <h1 style={{ fontSize: 24, marginBottom: 20, textAlign: "center" }}>Change Password</h1>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: "block", marginBottom: 4, fontWeight: 500 }}>Current Password</label>
          <input value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} type="password" required style={inputStyle} />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: "block", marginBottom: 4, fontWeight: 500 }}>New Password</label>
          <input value={newPassword} onChange={e => setNewPassword(e.target.value)} type="password" required style={inputStyle} />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: "block", marginBottom: 4, fontWeight: 500 }}>Confirm New Password</label>
          <input value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} type="password" required style={inputStyle} />
        </div>
        {error && <p style={{ color: "red", marginBottom: 12 }}>{error}</p>}
        {success && <p style={{ color: "green", marginBottom: 12 }}>{success}</p>}
        <button type="submit" disabled={loading} style={{ ...btnStyle, width: "100%", background: "#1a73e8", color: "#fff", border: "none" }}>
          {loading ? "Changing..." : "Change Password"}
        </button>
      </form>
      <div style={{ textAlign: "center", marginTop: 16 }}>
        <button onClick={goBack} style={{ ...btnStyle, background: "transparent", border: "none", color: "#1a73e8", cursor: "pointer" }}>← Back to Dashboard</button>
      </div>
    </div>
  );
};

const inputStyle: React.CSSProperties = { width: "100%", padding: 8, fontSize: 16, borderRadius: 6, border: "1px solid #ccc", boxSizing: "border-box" };
const btnStyle: React.CSSProperties = { padding: "10px 20px", fontSize: 16, cursor: "pointer", borderRadius: 6, border: "1px solid #ccc", background: "#f5f5f5" };

export default ChangePasswordPage;
