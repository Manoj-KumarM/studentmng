import { Link } from "react-router-dom";

const Index = () => (
  <div style={{ maxWidth: 400, margin: "80px auto", padding: 20, fontFamily: "system-ui", textAlign: "center" }}>
    <h1 style={{ fontSize: 28, marginBottom: 8 }}>QR Attendance</h1>
    <p style={{ color: "#666", marginBottom: 32 }}>Prototype for location-based attendance</p>
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Link to="/teacher" style={{ padding: "14px 24px", fontSize: 18, background: "#e8f0fe", borderRadius: 8, textDecoration: "none", color: "#1a73e8", border: "1px solid #c2d7f7" }}>
        🧑‍🏫 Teacher Page
      </Link>
      <Link to="/student" style={{ padding: "14px 24px", fontSize: 18, background: "#e6f4ea", borderRadius: 8, textDecoration: "none", color: "#137333", border: "1px solid #b7dfc3" }}>
        🎓 Student Page
      </Link>
    </div>
  </div>
);

export default Index;
