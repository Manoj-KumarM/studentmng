import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { storeUser, storeRoleData } from "@/lib/auth";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { data, error: fnError } = await supabase.functions.invoke("auth-login", {
        body: { email, password },
      });

      if (fnError || !data?.user) {
        setError(data?.error || "Invalid email or password");
        setLoading(false);
        return;
      }

      storeUser(data.user);
      if (data.roleData) storeRoleData(data.roleData);

      // Redirect based on role
      if (data.user.role === "admin") navigate("/admin");
      else if (data.user.role === "teacher") navigate("/teacher-dashboard");
      else navigate("/student-dashboard");
    } catch {
      setError("Something went wrong");
    }
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: 400, margin: "80px auto", padding: 20, fontFamily: "system-ui" }}>
      <h1 style={{ fontSize: 24, marginBottom: 8, textAlign: "center" }}>Smart Student Management</h1>
      <p style={{ color: "#666", marginBottom: 24, textAlign: "center" }}>Login to continue</p>

      <form onSubmit={handleLogin}>
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: "block", marginBottom: 4, fontWeight: 500 }}>Email</label>
          <input value={email} onChange={e => setEmail(e.target.value)} type="email" required style={inputStyle} placeholder="your@email.com" />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: "block", marginBottom: 4, fontWeight: 500 }}>Password</label>
          <input value={password} onChange={e => setPassword(e.target.value)} type="password" required style={inputStyle} placeholder="Password" />
        </div>
        {error && <p style={{ color: "red", marginBottom: 12 }}>{error}</p>}
        <button type="submit" disabled={loading} style={{ ...btnStyle, width: "100%", background: "#1a73e8", color: "#fff", border: "none" }}>
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>

      <div style={{ textAlign: "center", marginTop: 16 }}>
        <Link to="/forgot-password" style={{ color: "#1a73e8", textDecoration: "none" }}>Forgot Password?</Link>
      </div>
    </div>
  );
};

const inputStyle: React.CSSProperties = { width: "100%", padding: 8, fontSize: 16, borderRadius: 6, border: "1px solid #ccc", boxSizing: "border-box" };
const btnStyle: React.CSSProperties = { padding: "10px 20px", fontSize: 16, cursor: "pointer", borderRadius: 6, border: "1px solid #ccc", background: "#f5f5f5" };

export default LoginPage;
