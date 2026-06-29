import { dashboardStyles as styles } from "./dashboardStyles";
import { formatCurrency, formatQuantity, getRequestBadgeStyle, getRequestStatusLabel } from "../lib/stockUtils";
import type { ReconciliationSummary, RequestItem } from "../types";

type ManagerDashboardProps = {
  summary: ReconciliationSummary;
  requests: RequestItem[];
  onApproveRequest: (requestId: number) => void;
};

export default function ManagerDashboard({ summary, requests, onApproveRequest }: ManagerDashboardProps) {
  return (
    <div style={styles.card} className="dashboard-card">
      <div style={styles.cardHeader}>
        <div>
          <h2 style={styles.cardTitle}>Manager Dashboard</h2>
          <p style={styles.cardSubtitle}>Oversee approvals and property performance</p>
        </div>
      </div>

      <div style={styles.widgetGrid}>
        <div style={{ ...styles.widgetCard, borderColor: "rgba(37, 99, 235, 0.16)" }}>
          <div style={styles.widgetLabel}>Food Cost</div>
          <div style={{ ...styles.widgetValue, color: "#2563eb", ...styles.metricValueWrap }}>{formatCurrency(summary.foodCost)}</div>
        </div>
        <div style={{ ...styles.widgetCard, borderColor: "rgba(245, 158, 11, 0.16)" }}>
          <div style={styles.widgetLabel}>Pending</div>
          <div style={{ ...styles.widgetValue, color: "#f59e0b" }}>{requests.filter((request) => request.status === "pending_manager_approval" && request.requestSource === "store_room").length}</div>
        </div>
        <div style={{ ...styles.widgetCard, borderColor: "rgba(16, 185, 129, 0.16)" }}>
          <div style={styles.widgetLabel}>Approved</div>
          <div style={{ ...styles.widgetValue, color: "#10b981" }}>{summary.approvedRequests}</div>
        </div>
      </div>

      <div style={styles.reconciliationGrid}>
        <div style={styles.reconciliationCard}>
          <div style={styles.reconciliationLabel}>Theoretical</div>
          <div style={styles.reconciliationValue}>{formatCurrency(summary.theoreticalConsumptionCost)}</div>
        </div>
        <div style={styles.reconciliationCard}>
          <div style={styles.reconciliationLabel}>Actual</div>
          <div style={styles.reconciliationValue}>{formatCurrency(summary.actualConsumptionCost)}</div>
        </div>
        <div style={styles.reconciliationCard}>
          <div style={styles.reconciliationLabel}>Wastage</div>
          <div style={styles.reconciliationValue}>{formatCurrency(summary.wastageCost)}</div>
        </div>
        <div style={styles.reconciliationCard}>
          <div style={styles.reconciliationLabel}>Variance</div>
          <div style={{ ...styles.reconciliationValue, color: summary.variance >= 0 ? "#ef4444" : "#10b981" }}>{formatCurrency(summary.variance)}</div>
        </div>
      </div>

      <div style={styles.commentBox}>
        <div style={styles.commentTitle}>Month-end reconciliation</div>
        <div style={styles.commentText}>
          consume = theoretical recipe/POS consumption; issue/waste = actual store movement; variance helps managers investigate differences.
        </div>
      </div>

      {requests.length === 0 ? (
        <div style={styles.emptyState}>No purchase requests yet.</div>
      ) : (
        requests.map((request) => (
          <div key={request.id} style={styles.requestRow}>
            <div>
              <div style={{ fontWeight: 700, color: "#0f172a" }}>{request.name}</div>
              <div style={styles.metaText}>
                {request.property} • Qty {formatQuantity(request.qty)}
              </div>
            </div>
            <div style={styles.requestActions}>
              <span style={{ ...styles.statusBadge, ...getRequestBadgeStyle(request.status) }}>{getRequestStatusLabel(request.status)}</span>
              {String(request.status).toLowerCase() === "pending_manager_approval" && (
                <button onClick={() => onApproveRequest(request.id)} style={styles.secondaryButton} className="dashboard-button">
                  Approve
                </button>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
