import { useState } from "react";
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
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const totalPages = Math.ceil(entries.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedEntries = entries.slice(startIndex, startIndex + itemsPerPage);

  const formatTransactionTitle = (entry: TransactionLedgerEntry) => {
    if (entry.type === "consume") {
      const match = entry.notes.match(/Recipe:\s*([^|]*?)\s*\|\s*Ingredient used:\s*([^|]*)/i);
      if (match) {
        return `${match[1].trim()} prepared → ${match[2].trim()} used`;
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
        {paginatedEntries.length === 0 ? (
          <div style={styles.emptyState}>No transactions available.</div>
        ) : (
          paginatedEntries.map((entry) => {
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
        }))}
      </div>

      {entries.length > 0 && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16 }}>
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            style={{ ...styles.secondaryButton, opacity: currentPage === 1 ? 0.5 : 1 }}
            className={currentPage === 1 ? "" : "dashboard-button"}
          >
            Previous
          </button>
          <span style={{ fontSize: 13, color: "#64748b", fontWeight: 600 }}>
            Page {currentPage} of {totalPages}
          </span>
          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            style={{ ...styles.secondaryButton, opacity: currentPage === totalPages ? 0.5 : 1 }}
            className={currentPage === totalPages ? "" : "dashboard-button"}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
