import { useState, useEffect, useRef } from "react";
import { X } from "lucide-react";
import { COLORS } from "../theme/colors";
import BrandWordmark from "./BrandWordmark";

const CREDS = {
  "wrenchiq":       { password: "wrenchiq2026", role: "user" },
  "wrenchiq-admin": { password: "wrenchiq-admin", role: "admin" },
};

export default function LoginModal({ personaLabel, onSuccess, onCancel }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  function handleSubmit(e) {
    e.preventDefault();
    const entry = CREDS[username.trim().toLowerCase()];
    if (entry && password === entry.password) {
      onSuccess(entry.role);
    } else {
      setError("Invalid username or password.");
    }
  }

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
      style={{
        position: "fixed", inset: 0,
        background: "rgba(0,0,0,0.55)",
        backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 1000,
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      <div style={{
        width: 380,
        background: "#fff",
        borderRadius: 18,
        padding: "36px 32px 32px",
        boxShadow: "0 24px 80px rgba(0,0,0,0.3)",
        position: "relative",
      }}>

        {/* Close button */}
        <button
          onClick={onCancel}
          style={{
            position: "absolute", top: 14, right: 14,
            background: "#F3F4F6", border: "none",
            borderRadius: 8, padding: 6,
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            color: COLORS.textMuted,
          }}
        >
          <X size={16} />
        </button>

        {/* Logo */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
          <BrandWordmark size="bar" />
        </div>

        {/* Heading */}
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: COLORS.textPrimary, marginBottom: 4 }}>
            Sign in to continue
          </div>
          {personaLabel && (
            <div style={{ fontSize: 13, color: COLORS.textMuted }}>
              Accessing: <strong style={{ color: COLORS.textSecondary }}>{personaLabel}</strong>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: COLORS.textSecondary, display: "block", marginBottom: 6 }}>
              Username
            </label>
            <input
              ref={inputRef}
              type="text"
              value={username}
              onChange={e => { setUsername(e.target.value); setError(""); }}
              autoComplete="username"
              placeholder="wrenchiq"
              style={{
                width: "100%", boxSizing: "border-box",
                border: `1.5px solid ${error ? "#EF4444" : "#E5E7EB"}`,
                borderRadius: 9, padding: "10px 13px",
                fontSize: 14, color: COLORS.textPrimary,
                outline: "none", background: "#F9FAFB",
                transition: "border-color 0.15s",
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
                border: `1.5px solid ${error ? "#EF4444" : "#E5E7EB"}`,
                borderRadius: 9, padding: "10px 13px",
                fontSize: 14, color: COLORS.textPrimary,
                outline: "none", background: "#F9FAFB",
                transition: "border-color 0.15s",
              }}
            />
          </div>

          {error && (
            <div style={{ fontSize: 12, color: "#EF4444", textAlign: "center", fontWeight: 500 }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            style={{
              marginTop: 4,
              background: COLORS.primary,
              color: "#fff",
              border: "none",
              borderRadius: 9,
              padding: "11px",
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
              letterSpacing: 0.2,
            }}
          >
            Sign In
          </button>
        </form>

        <button
          onClick={onCancel}
          style={{
            marginTop: 14,
            width: "100%",
            background: "none",
            border: "none",
            fontSize: 13,
            color: COLORS.textMuted,
            cursor: "pointer",
            padding: "6px 0",
          }}
        >
          Cancel
        </button>

        <div style={{
          marginTop: 20,
          borderTop: "1px solid #F3F4F6",
          paddingTop: 14,
          textAlign: "center",
          fontSize: 10,
          fontWeight: 700,
          color: "#9CA3AF",
          letterSpacing: 0.5,
        }}>
          PREDII CONFIDENTIAL
        </div>
      </div>
    </div>
  );
}
