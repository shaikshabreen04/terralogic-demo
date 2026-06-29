"use client";

import type { ReactNode } from "react";
import KpiCards from "./KpiCards";
import Navbar from "./Navbar";
import { dashboardStyles as styles } from "./dashboardStyles";
import type { DashboardMetric, LoggedInUser, PropertyRecord } from "../types";

type DashboardLayoutProps = {
  loggedInUser: LoggedInUser;
  property: string;
  properties: PropertyRecord[];
  canChangeProperty: boolean;
  onPropertyChange: (nextProperty: string) => void;
  onLogout: () => void;
  loading: boolean;
  metrics: DashboardMetric[];
  children: ReactNode;
};

export default function DashboardLayout({
  loggedInUser,
  property,
  properties,
  canChangeProperty,
  onPropertyChange,
  onLogout,
  loading,
  metrics,
  children,
}: DashboardLayoutProps) {
  return (
    <main style={styles.page}>
      <div style={styles.shell}>
        <Navbar
          loggedInUser={loggedInUser}
          property={property}
          properties={properties}
          canChangeProperty={canChangeProperty}
          onPropertyChange={onPropertyChange}
          onLogout={onLogout}
        />

        {loading ? <div style={styles.loading}>Loading StockRoom workspace…</div> : null}

        <KpiCards metrics={metrics} />
        {children}
      </div>

      <style jsx global>{`
        * { box-sizing: border-box; }
        .dashboard-card { transition: transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease; }
        .dashboard-card:hover { transform: translateY(-3px); box-shadow: 0 18px 42px rgba(15, 23, 42, 0.08); }
        .dashboard-button { transition: transform 180ms ease, box-shadow 180ms ease; }
        .dashboard-button:hover { transform: translateY(-1px); box-shadow: 0 10px 24px rgba(37, 99, 235, 0.2); }
        .dashboard-input:focus { border-color: #2563eb !important; box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.12); outline: none; }
        .dashboard-table-row:hover td { background: #f8fbff !important; }
      `}</style>
    </main>
  );
}
