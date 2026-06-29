"use client";

import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { dashboardStyles as styles } from "./dashboardStyles";

type LoginPageCredentials = {
  role: string;
  username: string;
  password: string;
};

type UserRecord = {
  id: number;
  name: string;
  role: string;
  sub_role: string;
  password: string;
  property_id: number;
  created_at: string;
};

type PropertyRecord = {
  id: number;
  property_name: string;
};

type LoginPageProps = {
  users: UserRecord[];
  properties: PropertyRecord[];
  onLogin: (credentials: LoginPageCredentials) => Promise<string | null>;
};

const EyeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOffIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
    <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
    <path d="M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
    <line x1="2" y1="2" x2="22" y2="22" />
  </svg>
);

export default function LoginPage({ users, properties, onLogin }: LoginPageProps) {
  const [showPassword, setShowPassword] = useState(false);
  const {
    loginRole,
    loginUsername,
    loginPassword,
    loginError,
    loginLoading,
    availableUsers,
    handleRoleChange,
    handleUsernameChange,
    handlePasswordChange,
    handleSubmit,
    canSubmit,
  } = useAuth({ users, onLogin });

  const getPropertyName = (propertyId: number) =>
    properties.find((p) => p.id === propertyId)?.property_name ?? "Unknown";

  return (
    <main
      style={{
        ...styles.page,
        background: "linear-gradient(rgba(0, 0, 0, 0.55), rgba(0, 0, 0, 0.55)), url('/image.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 0,
      }}
    >
      <div style={styles.loginContainer}>
        <div
          style={{
            ...styles.loginCard,
            background: "rgba(255, 255, 255, 0.92)",
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
            borderRadius: 24,
            boxShadow: "0 20px 60px rgba(0, 0, 0, 0.25)",
            border: "1px solid rgba(255, 255, 255, 0.4)",
          }}
        >
          <div style={styles.loginHeader}>
            <div>
              <div style={{ ...styles.brand, color: "#1e3a8a" }}>StockRoom</div>
              <div style={{ ...styles.subtitle, color: "#475569" }}>
                Multi-Property Hotel Inventory & Procurement Management Platform
              </div>
            </div>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit();
            }}
            style={styles.loginForm}
          >
            <label style={styles.fieldBlock}>
              <span style={{ ...styles.fieldLabel, color: "#334155" }}>Role</span>
              <select
                value={loginRole}
                onChange={(e) => {
                  handleRoleChange(e.target.value);
                }}
                style={{ ...styles.input, background: "#ffffff" }}
                className="dashboard-input"
              >
                <option value="">Select a role</option>
                {["Manager", "Purchase Manager", "Store Keeper", "Chef"].map((role) =>
                  users.some((user) => user.role === role) ? (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ) : null
                )}
              </select>
            </label>

            {loginRole && loginRole === "Manager" && availableUsers.length === 1 ? (
              <div style={{ ...styles.fieldBlock, marginBottom: 10 }}>
                <div
                  style={{
                    padding: "10px 12px",
                    borderRadius: 12,
                    background: "rgba(37, 99, 235, 0.08)",
                    border: "1px solid rgba(37, 99, 235, 0.16)",
                    color: "#1d4ed8",
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  Manager Authentication
                </div>
              </div>
            ) : loginRole && loginRole.toLowerCase() !== "purchase manager" ? (
              <label style={styles.fieldBlock}>
                <span style={{ ...styles.fieldLabel, color: "#334155" }}>User</span>
                <select
                  value={loginUsername}
                  onChange={(e) => {
                    handleUsernameChange(e.target.value);
                  }}
                  style={{ ...styles.input, background: "#ffffff" }}
                  className="dashboard-input"
                >
                  <option value="">Select a user</option>
                  {availableUsers.map((user) => {
                    const label = `${user.name} (${user.sub_role} - ${getPropertyName(
                      user.property_id
                    )})`;

                    return (
                      <option key={user.id} value={user.name}>
                        {label}
                      </option>
                    );
                  })}
                </select>
              </label>
            ) : null}

            {loginRole && loginRole.toLowerCase() === "purchase manager" && (
              <div style={{ ...styles.fieldBlock, marginBottom: 10 }}>
                <div
                  style={{
                    padding: "10px 12px",
                    borderRadius: 12,
                    background: "rgba(37, 99, 235, 0.08)",
                    border: "1px solid rgba(37, 99, 235, 0.16)",
                    color: "#1d4ed8",
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  Purchase Manager Authentication
                </div>
              </div>
            )}

            <label style={styles.fieldBlock}>
              <span style={{ ...styles.fieldLabel, color: "#334155" }}>Password</span>
              <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter password"
                  value={loginPassword}
                  onChange={(e) => {
                    handlePasswordChange(e.target.value);
                  }}
                  style={{ ...styles.input, paddingRight: 42, background: "#ffffff" }}
                  className="dashboard-input"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute",
                    right: 12,
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    color: "#64748b",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: 0,
                  }}
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </label>

            {loginError && <div style={styles.errorMessage}>{loginError}</div>}

            <button
              type="submit"
              disabled={loginLoading || !canSubmit}
              style={{
                ...styles.primaryButton,
                width: "100%",
                marginTop: 4,
                opacity: loginLoading || !canSubmit ? 0.6 : 1,
              }}
              className="dashboard-button"
            >
              {loginLoading ? "Logging in..." : "Login"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
