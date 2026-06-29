import { dashboardStyles as styles } from "./dashboardStyles";
import { formatQuantity } from "../lib/stockUtils";

type StockRow = {
  ingredient: {
    id: number;
    name: string;
    unit: string;
    par: number;
    property_id: number;
    property: string;
  };
  stock: number;
  parLevel: number;
  isLow: boolean;
};

type CurrentStockTableProps = {
  rows: StockRow[];
  emptyMessage: string;
  onRaiseRequest: (ingredientId: number) => void;
};

export default function CurrentStockTable({ rows, emptyMessage, onRaiseRequest }: CurrentStockTableProps) {
  return (
    <div style={styles.card} className="dashboard-card">
      <div style={styles.cardHeader}>
        <div>
          <h2 style={styles.cardTitle}>Current Stock</h2>
          <p style={styles.cardSubtitle}>Track consumption and low-stock alerts by property</p>
        </div>
      </div>

      <div style={styles.tableWrap}>
        {rows.length === 0 ? (
          <div style={styles.emptyState}>{emptyMessage}</div>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Ingredient</th>
                <th style={styles.th}>Stock</th>
                <th style={styles.th}>Par Level</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.ingredient.id} style={{ ...styles.trRow, background: row.isLow ? "#fff7f7" : "#ffffff" }}>
                  <td style={styles.td}>{row.ingredient.name}</td>
                  <td style={styles.td}>
                    {formatQuantity(row.stock, row.ingredient.unit)}
                  </td>
                  <td style={styles.td}>
                    {formatQuantity(row.parLevel, row.ingredient.unit)}
                  </td>
                  <td style={styles.td}>
                    <span
                      style={{
                        ...styles.statusBadge,
                        background: row.isLow ? "rgba(239, 68, 68, 0.12)" : "rgba(16, 185, 129, 0.12)",
                        color: row.isLow ? "#ef4444" : "#10b981",
                      }}
                    >
                      {row.isLow ? "Low Stock" : "Healthy"}
                    </span>
                  </td>
                  <td style={styles.td}>
                    <button onClick={() => onRaiseRequest(row.ingredient.id)} style={styles.secondaryButton} className="dashboard-button">
                      Raise Request
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
