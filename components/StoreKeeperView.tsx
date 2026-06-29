"use client";

import { useMemo, useState } from "react";
import { dashboardStyles as styles } from "./dashboardStyles";
import CurrentStockTable from "./CurrentStockTable";
import TransactionLedger from "./TransactionLedger";
import { formatQuantity } from "../lib/stockUtils";

type FormState = {
  ingredientId: number;
  type: "receive" | "issue" | "consume" | "waste" | "adjust_add" | "adjust_remove";
  qty: string;
};

type Ingredient = {
  id: number;
  name: string;
  unit: string;
  par: number;
  property_id: number;
  property: string;
};

type StockRow = {
  ingredient: Ingredient;
  stock: number;
  parLevel: number;
  isLow: boolean;
};

type TransactionLedgerEntry = {
  id: number;
  ingredientName: string;
  qty: number;
  unit: string;
  property: string;
  type: "receive" | "issue" | "consume" | "waste" | "adjust_add" | "adjust_remove";
};

type PurchaseRequest = {
  id: number;
  ingredientId: number;
  name: string;
  property: string;
  propertyId: number;
  qty: number;
  status: string;
  requestedBy: string;
};

type StoreKeeperViewProps = {
  currentIngredients: Ingredient[];
  stockRows: StockRow[];
  ledgerEntries: TransactionLedgerEntry[];
  chefRequests: PurchaseRequest[];
  orderedRequests: Array<{
    id: number;
    ingredientId: number;
    name: string;
    property: string;
    propertyId: number;
    qty: number;
    status: string;
  }>;
  emptyMessage: string;
  onIssueMovement: (form: FormState) => Promise<void> | void;
  onReceiveOrderedRequest: (requestId: number) => Promise<void> | void;
  onIssueChefRequest: (requestId: number, ingredientId: number, qty: number) => Promise<void> | void;
  onForwardRequestToManager: (requestId: number) => Promise<void> | void;
  onRaiseRequest: (ingredientId: number) => void;
};

export default function StoreKeeperView({
  currentIngredients,
  stockRows,
  ledgerEntries,
  chefRequests,
  orderedRequests,
  emptyMessage,
  onIssueMovement,
  onReceiveOrderedRequest,
  onIssueChefRequest,
  onForwardRequestToManager,
  onRaiseRequest,
}: StoreKeeperViewProps) {
  const safeChefRequests = chefRequests ?? [];
  const [form, setForm] = useState<FormState>({ ingredientId: currentIngredients[0]?.id ?? 0, type: "issue", qty: "" });

  const selectedIngredientId = useMemo(() => {
    if (!currentIngredients.length) return 0;
    return currentIngredients.some((ingredient) => ingredient.id === form.ingredientId) ? form.ingredientId : currentIngredients[0].id;
  }, [currentIngredients, form.ingredientId]);

  return (
    <>
      <section style={styles.gridTwo}>
        <div style={styles.card} className="dashboard-card">
          <div style={styles.cardHeader}>
            <div>
              <h2 style={styles.cardTitle}>Chef Ingredient Requests</h2>
              <p style={styles.cardSubtitle}>Process chef requests in the storeroom</p>
            </div>
            <div style={styles.liveBadge}>Live</div>
          </div>

          <div style={styles.timeline}>
            {safeChefRequests.length === 0 ? (
              <div style={styles.emptyState}>No chef requests pending.</div>
            ) : (
              safeChefRequests.map((request) => (
                <div key={request.id} style={styles.timelineItem}>
                  <div style={{ ...styles.timelineIcon, background: "rgba(245, 158, 11, 0.12)", color: "#f59e0b" }}>?</div>
                  <div style={{ flex: 1 }}>
                    <div style={styles.timelineTitle}>{request.name}</div>
                    <div style={styles.metaText}>
                      {request.qty} units • {request.property}
                    </div>
                  </div>
                  <div style={styles.requestActions}>
                    <button
                      onClick={() => void onIssueChefRequest(request.id, request.ingredientId, request.qty)}
                      style={styles.secondaryButton}
                      className="dashboard-button"
                    >
                      Issue from Stock
                    </button>
                    <button
                      onClick={() => void onForwardRequestToManager(request.id)}
                      style={styles.secondaryButton}
                      className="dashboard-button"
                    >
                      Forward to Manager
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div style={styles.card} className="dashboard-card">
          <div style={styles.cardHeader}>
            <div>
              <h2 style={styles.cardTitle}>Issue to Kitchen / Waste</h2>
              <p style={styles.cardSubtitle}>Move storeroom stock to the kitchen or record spoilage</p>
            </div>
          </div>

          <div style={styles.formGrid}>
            {currentIngredients.length === 0 ? (
              <div style={{ ...styles.emptyState, gridColumn: "1 / -1" }}>{emptyMessage}</div>
            ) : (
              <>
                <label style={styles.fieldBlock}>
                  <span style={styles.fieldLabel}>Ingredient</span>
                  <select
                    value={selectedIngredientId}
                    onChange={(e) => setForm({ ...form, ingredientId: Number(e.target.value) })}
                    style={styles.input}
                    className="dashboard-input"
                  >
                    {currentIngredients.map((ingredient) => (
                      <option key={ingredient.id} value={ingredient.id}>
                        {ingredient.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label style={styles.fieldBlock}>
                  <span style={styles.fieldLabel}>Movement Type</span>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value as FormState["type"] })}
                    style={styles.input}
                    className="dashboard-input"
                  >
                    <option value="issue">Issue to Kitchen</option>
                    <option value="waste">Wastage/Spoilage</option>
                  </select>
                </label>

                <label style={styles.fieldBlock}>
                  <span style={styles.fieldLabel}>Quantity</span>
                  <input
                    placeholder="Qty"
                    value={form.qty}
                    onChange={(e) => setForm({ ...form, qty: e.target.value })}
                    style={styles.input}
                    className="dashboard-input"
                  />
                </label>

                <button
                  onClick={() => void onIssueMovement({ ...form, ingredientId: selectedIngredientId })}
                  style={styles.primaryButton}
                  className="dashboard-button"
                >
                  Save Movement
                </button>
              </>
            )}
          </div>
        </div>

        <div style={styles.card} className="dashboard-card">
          <div style={styles.cardHeader}>
            <div>
              <h2 style={styles.cardTitle}>Ordered Deliveries Pending</h2>
              <p style={styles.cardSubtitle}>Receive incoming orders into the storeroom</p>
            </div>
          </div>

          <div style={styles.timeline}>
            {orderedRequests.length === 0 ? (
              <div style={styles.emptyState}>No ordered deliveries pending.</div>
            ) : (
              orderedRequests.map((request) => (
                <div key={request.id} style={styles.timelineItem}>
                  <div style={{ ...styles.timelineIcon, background: "rgba(14, 165, 233, 0.12)", color: "#0284c7" }}>⇩</div>
                  <div style={{ flex: 1 }}>
                    <div style={styles.timelineTitle}>{request.name}</div>
                    <div style={styles.metaText}>
                      {formatQuantity(request.qty)} • {request.property}
                    </div>
                  </div>
                  <button
                    onClick={() => void onReceiveOrderedRequest(request.id)}
                    style={styles.secondaryButton}
                    className="dashboard-button"
                  >
                    Receive Delivery
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <CurrentStockTable rows={stockRows} emptyMessage={emptyMessage} onRaiseRequest={onRaiseRequest} />
      </section>
      <section style={styles.gridSingle}>
        <TransactionLedger entries={ledgerEntries} />
      </section>
    </>
  );
}
