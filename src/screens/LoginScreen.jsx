// LoginScreen — simple credential gate before the persona gateway
import { useState } from "react";
import { COLORS } from "../theme/colors";
import BrandWordmark from "../components/BrandWordmark";
import { useAppVersion, useAppBuilt } from "../hooks/useAppVersion";

export default function LoginScreen({ onLogin }) {
  const appVersion = useAppVersion();
  const appBuilt = useAppBuilt();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    if (username === "wrenchiq" && password === "wrenchiq2026") {
      onLogin();
    } else {
      setError("Invalid username or password.");
    }
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: COLORS.bgDark,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    }}>
      <div style={{
        width: 360,
        background: "#fff",
        borderRadius: 16,
        padding: "40px 36px",
        boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
      }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 28 }}>
          <BrandWordmark size="bar" />
        </div>

        <div style={{ marginBottom: 24, textAlign: "center" }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: COLORS.textPrimary, marginBottom: 4 }}>
            Sign in to continue
          </div>
          <div style={{ fontSize: 13, color: COLORS.textMuted }}>
            Enter your credentials to access the demo
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: COLORS.textSecondary, display: "block", marginBottom: 6 }}>
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={e => { setUsername(e.target.value); setError(""); }}
              autoFocus
              autoComplete="username"
              style={{
                width: "100%", boxSizing: "border-box",
                border: `1px solid ${error ? "#EF4444" : "#E5E7EB"}`,
                borderRadius: 8, padding: "9px 12px",
                fontSize: 14, color: COLORS.textPrimary,
                outline: "none", background: "#F9FAFB",
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: COLORS.textSecondary, display: "block", marginBottom: 6 }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={e => { setPassword(e.target.value); setError(""); }}
              autoComplete="current-password"
              style={{
                width: "100%", boxSizing: "border-box",
                border: `1px solid ${error ? "#EF4444" : "#E5E7EB"}`,
                borderRadius: 8, padding: "9px 12px",
                fontSize: 14, color: COLORS.textPrimary,
                outline: "none", background: "#F9FAFB",
              }}
            />
          </div>

          {error && (
            <div style={{ fontSize: 12, color: "#EF4444", textAlign: "center" }}>{error}</div>
          )}

          <button
            type="submit"
            style={{
              marginTop: 4,
              background: COLORS.primary,
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "10px",
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Sign In
          </button>
        </form>

        <div style={{ marginTop: 28, borderTop: "1px solid #F3F4F6", paddingTop: 16, textAlign: "center" }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#9CA3AF", letterSpacing: 0.5 }}>PREDII CONFIDENTIAL</div>
          <div style={{ marginTop: 4, fontSize: 10, color: "#D1D5DB", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <span>{appVersion}</span>
            {appBuilt && <><span style={{ color: "#E5E7EB" }}>·</span><span>{appBuilt}</span></>}
          </div>
        </div>
      </div>
    </div>
  );
}
