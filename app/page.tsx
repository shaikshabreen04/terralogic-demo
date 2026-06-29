import Dashboard from "../components/Dashboard";
import { fetchProperties, fetchUsers } from "../services/stockService";

export default async function Home() {
  try {
    const [users, properties] = await Promise.all([fetchUsers(), fetchProperties()]);

    return <Dashboard initialUsers={users} initialProperties={properties} />;
  } catch (error) {
    console.error("Failed to fetch users:", error);

    return (
      <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#f8fafc", color: "#0f172a" }}>
        <div>Unable to load StockRoom.</div>
      </main>
    );
  }
}
