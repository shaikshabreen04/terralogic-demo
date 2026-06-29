import { dashboardStyles as styles } from "./dashboardStyles";
import type { LoggedInUser, PropertyRecord } from "../types";

type NavbarProps = {
  loggedInUser: LoggedInUser;
  property: string;
  properties: PropertyRecord[];
  canChangeProperty: boolean;
  onPropertyChange: (nextProperty: string) => void;
  onLogout: () => void;
};

export default function Navbar({ loggedInUser, property, properties, canChangeProperty, onPropertyChange, onLogout }: NavbarProps) {
  const isStoreKeeper = loggedInUser.role === "Store Keeper";

  return (
    <nav style={styles.navbar}>
      <div style={styles.brandWrap}>
        <div style={styles.brandMark}>S</div>
        <div>
          <div style={styles.brand}>StockRoom</div>
          <div style={styles.subtitle}>Multi-Property Hotel Inventory & Procurement Management Platform</div>
        </div>
      </div>
      <div style={styles.navActions}>
        <div style={styles.propertyPill}>Property • {property || "Select"}</div>
        {canChangeProperty ? (
          <select
            value={property}
            onChange={(e) => onPropertyChange(e.target.value)}
            style={styles.select}
            className="dashboard-input"
          >
            {properties.map((item) => (
              <option key={item.id} value={item.property_name}>
                {item.property_name}
              </option>
            ))}
          </select>
        ) : null}
        {isStoreKeeper ? (
          <div style={{ ...styles.propertyPill, background: "rgba(37, 99, 235, 0.08)", color: "#1d4ed8" }}>
            Locked to your assigned property
          </div>
        ) : null}
        <div style={styles.userInfo}>
          <div style={styles.userName}>{loggedInUser.name}</div>
          <div style={styles.userDetails}>
            <span style={styles.userRole}>{loggedInUser.role}</span>
            <span style={styles.userSeparator}>•</span>
            <span style={styles.userSubRole}>{loggedInUser.sub_role}</span>
          </div>
        </div>
        <button onClick={onLogout} style={styles.logoutButton} className="dashboard-button">
          Logout
        </button>
      </div>
    </nav>
  );
}
