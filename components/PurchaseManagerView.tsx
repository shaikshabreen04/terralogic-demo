import { dashboardStyles as styles } from "./dashboardStyles";
import PurchaseConsole from "./PurchaseConsole";
import type { RequestItem } from "../types";

type PurchaseManagerViewProps = {
  requests: RequestItem[];
  onConvertToVendorOrder: (requestId: number) => void;
};

export default function PurchaseManagerView({ requests, onConvertToVendorOrder }: PurchaseManagerViewProps) {
  return (
    <section style={styles.gridTwo}>
      <PurchaseConsole requests={requests} onConvertToVendorOrder={onConvertToVendorOrder} />
    </section>
  );
}
