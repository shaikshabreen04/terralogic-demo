import { dashboardStyles as styles } from "./dashboardStyles";
import { formatQuantity, getRequestBadgeStyle, getRequestStatusLabel } from "../lib/stockUtils";
import type { RequestItem } from "../types";

type PurchaseConsoleProps = {
  requests: RequestItem[];
  onConvertToVendorOrder: (requestId: number) => void;
};

export default function PurchaseConsole({ requests, onConvertToVendorOrder }: PurchaseConsoleProps) {
  const purchaseRequests = requests.filter(
    (request) => request.status === "approved_by_manager" && request.requestSource === "store_room",
  );

  return (
    <div style={styles.card} className="dashboard-card">
      <div style={styles.cardHeader}>
        <div>
          <h2 style={styles.cardTitle}>Purchase Console</h2>
          <p style={styles.cardSubtitle}>Manage approved requests and vendor orders</p>
        </div>
      </div>

      {purchaseRequests.length === 0 ? (
        <div style={styles.emptyState}>No approved requests pending conversion</div>
      ) : (
        purchaseRequests.map((request) => (
          <div key={request.id} style={styles.consoleCard}>
            <div>
              <div style={{ fontWeight: 700, color: "#0f172a" }}>{request.name}</div>
              <div style={styles.metaText}>
                {formatQuantity(request.qty)} units • {request.property}
              </div>
            </div>
            <div style={styles.requestActions}>
              <span style={{ ...styles.statusBadge, ...getRequestBadgeStyle(request.status) }}>{getRequestStatusLabel(request.status)}</span>
              {String(request.status).toLowerCase() === "approved_by_manager" && (
                <button onClick={() => onConvertToVendorOrder(request.id)} style={styles.secondaryButton} className="dashboard-button">
                  Convert to Order
                </button>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
