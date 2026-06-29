import { dashboardStyles as styles } from "./dashboardStyles";
import { formatQuantity, getTransactionIcon, getTransactionLabel, getTransactionTone } from "../lib/stockUtils";
import type { TransactionLedgerEntry } from "../types";

type TransactionLedgerProps = {
  entries: TransactionLedgerEntry[];
  title?: string;
  subtitle?: string;
};

export default function TransactionLedger({
  entries,
  title = "Transaction Ledger",
  subtitle = "A polished activity timeline for the selected property",
}: TransactionLedgerProps) {
  const formatTransactionTitle = (entry: TransactionLedgerEntry) => {
    if (entry.type === "consume") {
      const match = entry.notes.match(/^Recipe:\s*(.*?)\s*\|\s*Ingredient used:\s*(.*)$/i);
      if (match) {
        return `${match[1]} prepared → ${match[2]} used`;
      }
    }
    return `${getTransactionLabel(entry.type)} • ${entry.ingredientName}`;
  };

  return (
    <div style={styles.card} className="dashboard-card">
      <div style={styles.cardHeader}>
        <div>
          <h2 style={styles.cardTitle}>{title}</h2>
          <p style={styles.cardSubtitle}>{subtitle}</p>
        </div>
      </div>

      <div style={styles.timeline}>
        {entries.map((entry) => {
          const tone = getTransactionTone(entry.type);
          return (
            <div key={entry.id} style={styles.timelineItem}>
              <div style={{ ...styles.timelineIcon, background: tone.background, color: tone.color }}>
                {getTransactionIcon(entry.type)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
                  <div>
                    <div style={styles.timelineTitle}>
                      {formatTransactionTitle(entry)}
                    </div>
                    <div style={styles.metaText}>
                      {formatQuantity(entry.qty, entry.unit)} • {entry.property}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
