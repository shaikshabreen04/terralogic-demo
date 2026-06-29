import { dashboardStyles as styles } from "./dashboardStyles";
import type { DashboardMetric } from "../types";

type KpiCardsProps = {
  metrics: DashboardMetric[];
};

export default function KpiCards({ metrics }: KpiCardsProps) {
  return (
    <section style={styles.metricsGrid}>
      {metrics.map((card) => (
        <div key={card.label} style={styles.metricCard} className="dashboard-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={{ color: "#64748b", fontSize: 13, textTransform: "uppercase", letterSpacing: 0.6 }}>{card.label}</div>
            <div style={{ ...styles.metricIcon, color: card.accent, background: `${card.accent}12` }}>{card.icon}</div>
          </div>
          <div style={{ ...styles.metricValue, ...styles.metricValueWrap, color: card.accent }}>{card.value}</div>
          <div style={styles.metricHint}>{card.hint}</div>
        </div>
      ))}
    </section>
  );
}
