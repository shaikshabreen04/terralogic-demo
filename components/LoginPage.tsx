"use client";

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

export default function LoginPage({ users, properties, onLogin }: LoginPageProps) {
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

  console.log("all users", users);
  console.log("chef users", users.filter((u) => u.role === "Chef"));

  const propertyNameById = new Map(properties.map((property) => [property.id, property.property_name]));

  return (
    <main style={styles.page}>
      <div style={styles.loginContainer}>
        <div style={styles.loginCard}>
          <div style={styles.loginHeader}>
            <div>
              <div style={styles.brand}>StockRoom</div>
              <div style={styles.subtitle}>Multi-Property Hotel Inventory & Procurement Management Platform</div>
            </div>
          </div>

          <div style={styles.loginForm}>
            <label style={styles.fieldBlock}>
              <span style={styles.fieldLabel}>Role</span>
              <select
                value={loginRole}
                onChange={(e) => {
                    handleRoleChange(e.target.value);
                }}
                style={styles.input}
                className="dashboard-input"
              >
                <option value="">Select a role</option>
                {['Manager', 'Purchase Manager', 'Store Keeper', 'Chef'].map((role) => (
                  users.some((user) => user.role === role) ? (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ) : null
                ))}
              </select>
            </label>

            {loginRole && loginRole.toLowerCase() !== "purchase manager" && (
              <label style={styles.fieldBlock}>
                <span style={styles.fieldLabel}>User</span>
                <select
                  value={loginUsername}
                  onChange={(e) => {
                      handleUsernameChange(e.target.value);
                  }}
                  style={styles.input}
                  className="dashboard-input"
                >
                  <option value="">Select a user</option>
                  {availableUsers.map((user) => {
                    const propertyName = propertyNameById.get(user.property_id);
                    const label = propertyName ? `${user.name} (${user.sub_role} - ${propertyName})` : `${user.name} (${user.sub_role})`;

                    return (
                      <option key={user.id} value={user.name}>
                        {label}
                      </option>
                    );
                  })}
                </select>
              </label>
            )}

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
                  Chain Purchase Manager Authentication
                </div>
              </div>
            )}

            <label style={styles.fieldBlock}>
              <span style={styles.fieldLabel}>Password</span>
              <input
                type="password"
                placeholder="Enter password"
                value={loginPassword}
                onChange={(e) => {
                  handlePasswordChange(e.target.value);
                }}
                style={styles.input}
                className="dashboard-input"
              />
            </label>

            {loginError && <div style={styles.errorMessage}>{loginError}</div>}

            <button
              onClick={handleSubmit}
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
          </div>
        </div>
      </div>
    </main>
  );
}
