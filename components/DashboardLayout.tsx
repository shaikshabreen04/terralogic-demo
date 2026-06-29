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
        
        /* Modern Premium Scrollbar */
        ::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        ::-webkit-scrollbar-track {
          background: transparent;
        }
        ::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 999px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }

        /* Smooth Interactive Transitions */
        .dashboard-card {
          transition: transform 220ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 220ms cubic-bezier(0.16, 1, 0.3, 1), border-color 220ms cubic-bezier(0.16, 1, 0.3, 1);
        }
        .dashboard-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 30px rgba(15, 23, 42, 0.04), 0 1px 3px rgba(0, 0, 0, 0.02);
          border-color: #cbd5e1 !important;
        }
        .dashboard-button {
          transition: all 180ms cubic-bezier(0.16, 1, 0.3, 1);
        }
        .dashboard-button:hover {
          filter: brightness(0.96);
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.15);
        }
        .dashboard-button:active {
          transform: scale(0.98);
        }
        .dashboard-input {
          transition: all 180ms ease;
        }
        .dashboard-input:focus {
          border-color: #2563eb !important;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
          outline: none;
        }
        .dashboard-table-row {
          transition: background-color 150ms ease;
        }
        .dashboard-table-row:hover td {
          background: #f8fafc !important;
        }
      `}</style>
    </main>
  );
}
