import { useState } from "react";
import { dashboardStyles as styles } from "./dashboardStyles";
import ManagerDashboard from "./ManagerDashboard";
import type { PropertyRecord, ReconciliationSummary, RequestItem } from "../types";

type ManagerViewProps = {
  summary: ReconciliationSummary;
  requests: RequestItem[];
  properties: PropertyRecord[];
  onApproveRequest: (requestId: number) => void;
  onCreateChef: (name: string, role: string, subRole: string, password: string, propertyId: number) => Promise<void>;
};

export default function ManagerView({ summary, requests, properties, onApproveRequest, onCreateChef }: ManagerViewProps) {
  const [chefName, setChefName] = useState("");
  const [chefRole] = useState("Chef");
  const [chefSubRole, setChefSubRole] = useState("Saucier Chef");
  const [chefPassword, setChefPassword] = useState("");
  const [chefPropertyId, setChefPropertyId] = useState<number>(properties[0]?.id ?? 0);

  const handleCreateChef = async () => {
    if (!chefName.trim()) return alert("Enter chef name.");
    if (!chefPassword.trim()) return alert("Enter password.");
    if (!chefPropertyId) return alert("Select a property.");

    await onCreateChef(chefName.trim(), chefRole, chefSubRole, chefPassword.trim(), chefPropertyId);
    setChefName("");
    setChefPassword("");
  };

  return (
    <section style={styles.gridTwo}>
      <ManagerDashboard summary={summary} requests={requests} onApproveRequest={onApproveRequest} />
      <div style={styles.card} className="dashboard-card">
        <div style={styles.cardHeader}>
          <div>
            <h2 style={styles.cardTitle}>Add Chef</h2>
            <p style={styles.cardSubtitle}>Create a new professional chef with assigned ingredients</p>
          </div>
        </div>
        <div style={styles.formGrid}>
          <label style={styles.fieldBlock}>
            <span style={styles.fieldLabel}>Chef Name</span>
            <input
              value={chefName}
              onChange={(e) => setChefName(e.target.value)}
              style={styles.input}
              className="dashboard-input"
              placeholder="Chef name"
            />
          </label>

          <label style={styles.fieldBlock}>
            <span style={styles.fieldLabel}>Chef Role</span>
            <select
              value={chefSubRole}
              onChange={(e) => setChefSubRole(e.target.value)}
              style={styles.input}
              className="dashboard-input"
            >
              <option value="Saucier Chef">Saucier Chef</option>
              <option value="Poissonnier Chef">Poissonnier Chef</option>
            </select>
          </label>

          <label style={styles.fieldBlock}>
            <span style={styles.fieldLabel}>Property</span>
            <select
              value={chefPropertyId}
              onChange={(e) => setChefPropertyId(Number(e.target.value))}
              style={styles.input}
              className="dashboard-input"
            >
              {properties.map((property) => (
                <option key={property.id} value={property.id}>
                  {property.property_name}
                </option>
              ))}
            </select>
          </label>

          <label style={styles.fieldBlock}>
            <span style={styles.fieldLabel}>Password</span>
            <input
              type="password"
              value={chefPassword}
              onChange={(e) => setChefPassword(e.target.value)}
              style={styles.input}
              className="dashboard-input"
              placeholder="Password"
            />
          </label>

          <button onClick={handleCreateChef} style={styles.primaryButton} className="dashboard-button">
            Create Chef
          </button>
        </div>
      </div>
    </section>
  );
}
