import { useMemo } from "react";
import {
  calculateDashboardMetrics,
  calculateKitchenStock,
  calculateStoreroomStock,
  formatCurrency,
  getAccessibleIngredients,
  getAvailableRecipes,
  getRecentConsumptionRows,
  getTransactionRows,
} from "../lib/stockUtils";
import type {
  DashboardMetric,
  DishRecord,
  Ingredient,
  LoggedInUser,
  RequestItem,
  RoleIngredient,
  RecipeRecord,
  StockRow,
  Transaction,
} from "../types";

type UseStockParams = {
  loggedInUser: LoggedInUser | null;
  selectedPropertyId: number | null;
  ingredients: Ingredient[];
  transactions: Transaction[];
  requests: RequestItem[];
  roleIngredients: RoleIngredient[];
  dishes: DishRecord[];
  recipes: RecipeRecord[];
};

export function useStock({
  loggedInUser,
  selectedPropertyId,
  ingredients,
  transactions,
  requests,
  roleIngredients,
  dishes,
  recipes,
}: UseStockParams) {
  const currentIngredients = useMemo(
    () => getAccessibleIngredients(loggedInUser, selectedPropertyId, ingredients, roleIngredients),
    [loggedInUser, selectedPropertyId, ingredients, roleIngredients],
  );

  const propertyTransactions = useMemo(
    () => transactions.filter((transaction) => transaction.propertyId === selectedPropertyId),
    [transactions, selectedPropertyId],
  );

  const propertyRequests = useMemo(
    () => requests.filter((request) => request.propertyId === selectedPropertyId),
    [requests, selectedPropertyId],
  );

  const availableRecipes = useMemo(
    () => getAvailableRecipes(dishes, recipes, currentIngredients),
    [dishes, recipes, currentIngredients],
  );

  const stockRows = useMemo<StockRow[]>(
    () =>
      currentIngredients.map((ingredient) => {
        const isChef = loggedInUser?.role === "Chef";
        const stock = isChef
          ? calculateKitchenStock(ingredient.id, selectedPropertyId, transactions)
          : calculateStoreroomStock(ingredient.id, selectedPropertyId, transactions);
        const parLevel = isChef ? 0 : (ingredient.par ?? 0);
        return {
          ingredient,
          stock,
          parLevel,
          isLow: isChef ? stock <= parLevel : stock < parLevel,
        };
      }),
    [currentIngredients, transactions, selectedPropertyId, loggedInUser?.role],
  );

  const ledgerEntries = useMemo(() => getTransactionRows(transactions, ingredients, selectedPropertyId), [transactions, ingredients, selectedPropertyId]);
  const recentConsumptionEntries = useMemo(
    () => getRecentConsumptionRows(transactions, ingredients, selectedPropertyId, currentIngredients, loggedInUser),
    [transactions, ingredients, selectedPropertyId, currentIngredients, loggedInUser],
  );

  const summary = useMemo(
    () => calculateDashboardMetrics(currentIngredients, transactions, selectedPropertyId, propertyRequests, ingredients, loggedInUser),
    [currentIngredients, transactions, selectedPropertyId, propertyRequests, ingredients, loggedInUser],
  );

  const purchaseManagerMetrics = useMemo<DashboardMetric[]>(() => {
    const approvedRequests = propertyRequests.filter(
      (request) => request.status === "approved_by_manager" && request.requestSource === "store_room",
    ).length;
    const ordersCreated = propertyRequests.filter((request) => request.status === "ordered_by_purchase_manager").length;
    const totalOrderValue = propertyRequests
      .filter((request) => request.status === "ordered_by_purchase_manager")
      .reduce((sum, request) => {
        const ingredient = ingredients.find((item) => item.id === request.ingredientId);
        return sum + request.qty * (ingredient?.price || 0);
      }, 0);

    return [
      { label: "Approved Requests", value: approvedRequests, accent: "#2563eb", icon: "✔", hint: "Approved by manager" },
      { label: "Orders Created", value: ordersCreated, accent: "#0ea5e9", icon: "🛒", hint: "Purchase orders created" },
      { label: "Pending Deliveries", value: ordersCreated, accent: "#f59e0b", icon: "📦", hint: "Awaiting deliveries" },
      { label: "Total Order Value", value: formatCurrency(totalOrderValue), accent: "#10b981", icon: "₹", hint: "Value for selected property" },
    ];
  }, [propertyRequests, ingredients]);

  const metrics = useMemo<DashboardMetric[]>(
    () => {
      if (loggedInUser?.role === "Purchase Manager") {
        return purchaseManagerMetrics;
      }

      return [
        { label: "Assigned Items", value: currentIngredients.length, accent: "#2563eb", icon: "◎", hint: "Mapped to your role" },
        { label: "Low Stock Items", value: summary.lowStockItems, accent: "#ef4444", icon: "⚠", hint: "Needs attention" },
        { label: "Open Requests", value: summary.openRequests, accent: "#f59e0b", icon: "↺", hint: "Awaiting review" },
        { label: "Recipes Available", value: availableRecipes.length, accent: "#10b981", icon: "◔", hint: "Visible to your role" },
      ];
    },
    [loggedInUser?.role, purchaseManagerMetrics, currentIngredients.length, summary.lowStockItems, summary.openRequests, availableRecipes.length],
  );

  const emptyMessage = "No ingredients available for this property.";

  return {
    currentIngredients,
    propertyTransactions,
    propertyRequests,
    availableRecipes,
    stockRows,
    ledgerEntries,
    recentConsumptionEntries,
    summary,
    metrics,
    emptyMessage,
  };
}
