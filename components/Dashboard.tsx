"use client";

import { useState } from "react";
import DashboardLayout from "./DashboardLayout";
import ChefView from "./ChefView";
import LoginPage from "./LoginPage";
import ManagerView from "./ManagerView";
import PurchaseManagerView from "./PurchaseManagerView";
import StoreKeeperView from "./StoreKeeperView";
import { buildLoggedInUser, findMatchingUser, validateLoginForm } from "../lib/authUtils";
import {
  approvePurchaseRequest,
  convertRequestToVendorOrder,
  createPurchaseRequest,
  createStockTransaction,
  createUser,
  fetchDashboardData,
  fetchRoleIngredients,
  fetchUsers,
  forwardRequestToManager,
  issueChefRequest,
  issueReceivedRequest,
  receivePurchaseRequest,
} from "../services/stockService";
import { mapIngredients, mapRequests, mapTransactions, resolvePropertySelection } from "../lib/stockUtils";
import { useStock } from "../hooks/useStock";
import type {
  FormState,
  LoggedInUser,
  LoginCredentials,
  PropertyRecord,
  RequestItem,
  RoleIngredient,
  DishRecord,
  Ingredient,
  RecipeRecord,
  Transaction,
  UserRecord,
} from "../types";

type DashboardProps = {
  initialUsers: UserRecord[];
  initialProperties: PropertyRecord[];
};

export default function Dashboard({ initialUsers, initialProperties }: DashboardProps) {
  const [users, setUsers] = useState<UserRecord[]>(initialUsers);
  const [loginProperties] = useState(initialProperties);
  const [loggedInUser, setLoggedInUser] = useState<LoggedInUser | null>(null);
  const [properties, setProperties] = useState<PropertyRecord[]>([]);
  const [property, setProperty] = useState("");
  const [selectedPropertyId, setSelectedPropertyId] = useState<number | null>(null);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [roleIngredients, setRoleIngredients] = useState<RoleIngredient[]>([]);
  const [dishes, setDishes] = useState<DishRecord[]>([]);
  const [recipes, setRecipes] = useState<RecipeRecord[]>([]);
  const [loading, setLoading] = useState(false);

  const stock = useStock({
    loggedInUser,
    selectedPropertyId,
    ingredients,
    transactions,
    requests,
    roleIngredients,
    dishes,
    recipes,
  });

  const loadDashboardData = async (user: LoggedInUser, preferredPropertyName = property) => {
    setLoading(true);

    try {
      const snapshot = await fetchDashboardData();
      const propertyMap = new Map(snapshot.properties.map((item) => [item.id, item.property_name]));
      const mappedIngredients = mapIngredients(snapshot.ingredients, propertyMap);
      const mappedTransactions = mapTransactions(snapshot.transactions, propertyMap);
      const mappedRequests = mapRequests(snapshot.requests, propertyMap, mappedIngredients);

      setProperties(snapshot.properties);
      setIngredients(mappedIngredients);
      setTransactions(mappedTransactions);
      setRequests(mappedRequests);
      setDishes(snapshot.dishes);
      setRecipes(snapshot.recipes);

      const nextSelection = resolvePropertySelection(snapshot.properties, preferredPropertyName, user);
      setProperty(nextSelection.property);
      setSelectedPropertyId(nextSelection.selectedPropertyId);

      const nextRoleIngredients = await fetchRoleIngredients(user, nextSelection.selectedPropertyId);
      setRoleIngredients(nextRoleIngredients);
    } catch (error) {
      console.error("Failed to load StockRoom data:", error);
      alert("Unable to load StockRoom data.");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const reloadDashboardData = async () => {
    if (!loggedInUser) return;
    await loadDashboardData(loggedInUser, property);
  };

  const refreshUsers = async () => {
    const allUsers = await fetchUsers();
    setUsers(allUsers);
    return allUsers;
  };

  const handleLogin = async (credentials: LoginCredentials) => {
    const validationError = validateLoginForm(credentials);
    if (validationError) return validationError;

    const matchingUser = findMatchingUser(users, credentials.role, credentials.username, credentials.password);
    if (!matchingUser) return "Invalid credentials";

    const nextUser = buildLoggedInUser(matchingUser);

    try {
      await loadDashboardData(nextUser, "");
      setLoggedInUser(nextUser);
      return null;
    } catch {
      return "Unable to load StockRoom data.";
    }
  };

  const handleLogout = () => {
    setLoggedInUser(null);
    setProperties([]);
    setProperty("");
    setSelectedPropertyId(null);
    setIngredients([]);
    setTransactions([]);
    setRequests([]);
    setRoleIngredients([]);
    setDishes([]);
    setRecipes([]);
    setLoading(false);
  };

  const handlePropertyChange = async (nextProperty: string) => {
    if (!loggedInUser) return;
    if (loggedInUser.role === "Chef" || loggedInUser.role === "Store Keeper") return;

    const nextSelection = resolvePropertySelection(properties, nextProperty, loggedInUser);
    setProperty(nextSelection.property);
    setSelectedPropertyId(nextSelection.selectedPropertyId);

    const nextRoleIngredients = await fetchRoleIngredients(loggedInUser, nextSelection.selectedPropertyId);
    setRoleIngredients(nextRoleIngredients);
  };

  const handleAddTransaction = async ({ ingredientId, type, qty }: FormState) => {
    if (!loggedInUser || !selectedPropertyId) return alert("Select a property first");
    if (type === "receive") return alert("Store Keeper can only receive ordered deliveries.");
    if (!qty) return alert("Enter quantity");

    const quantity = Number(qty);
    if (Number.isNaN(quantity) || quantity <= 0) return alert("Enter a valid quantity");

    try {
      const movementNotes =
        type === "issue"
          ? "Issued to kitchen / chef section"
          : "Wastage / spoilage recorded in storeroom";

      await createStockTransaction({
        ingredientId,
        propertyId: selectedPropertyId,
        type,
        quantity,
        notes: movementNotes,
      });
      await reloadDashboardData();
    } catch (error) {
      console.error("Failed to save transaction:", error);
      alert("Unable to save transaction.");
    }
  };

  const handleReceiveOrderedRequest = async (requestId: number) => {
    if (!loggedInUser || !selectedPropertyId) return alert("Select a property first");

    const orderedRequest = requests.find(
      (request) => request.id === requestId && request.propertyId === selectedPropertyId && String(request.status).toLowerCase() === "ordered_by_purchase_manager",
    );

    if (!orderedRequest) {
      alert("Only ordered deliveries for your property can be received.");
      return;
    }

    try {
      await receivePurchaseRequest(orderedRequest.id, orderedRequest.ingredientId, selectedPropertyId, orderedRequest.qty);
      await reloadDashboardData();
    } catch (error) {
      console.error("Failed to receive ordered request:", error);
      alert("Unable to receive delivery.");
    }
  };

  const handleMarkDishPrepared = async (dishName: string, quantity: number) => {
    if (!loggedInUser || !selectedPropertyId) return alert("Select a property first");
    if (Number.isNaN(quantity) || quantity <= 0) return alert("Enter a valid number of dishes");

    const visibleIngredients = stock.currentIngredients;
    const recipe = stock.availableRecipes.find((item) => item.name === dishName);
    if (!recipe) return alert("No recipes available for this property");

    const missingIngredients = recipe.ingredients.filter((ingredient) => {
      const match = visibleIngredients.find(
        (item) => (ingredient.id != null && item.id === ingredient.id) || item.name.toLowerCase() === ingredient.name.toLowerCase(),
      );
      return !match;
    });

    if (missingIngredients.length) {
      alert(`Some recipe ingredients are missing for ${property || "this property"}: ${missingIngredients.map((item) => item.name).join(", ")}`);
      return;
    }

    const transactionRows = recipe.ingredients
      .map((ingredient) => {
        const match = visibleIngredients.find(
          (item) => (ingredient.id != null && item.id === ingredient.id) || item.name.toLowerCase() === ingredient.name.toLowerCase(),
        );
        if (!match) return null;

        const requiredQty = ingredient.qty * quantity;
        const currentStock = stock.stockRows.find((row) => row.ingredient.id === match.id)?.stock ?? 0;
        if (currentStock < requiredQty) {
          throw new Error(`${match.name} stock is insufficient for this POS event`);
        }

        return {
          ingredient_id: match.id,
          property_id: selectedPropertyId,
          transaction_type: "consume" as const,
          quantity: requiredQty,
          notes: `Recipe: ${dishName} | Ingredient used: ${match.name} | Chef: ${loggedInUser.name}`,
        };
      })
      .filter(
        (row): row is {
          ingredient_id: number;
          property_id: number;
          transaction_type: "consume";
          quantity: number;
          notes: string;
        } => row !== null,
      );

    if (transactionRows.length !== recipe.ingredients.length) {
      alert("Unable to process the selected recipe.");
      return;
    }

    try {
      for (const row of transactionRows) {
        await createStockTransaction({
          ingredientId: row.ingredient_id,
          propertyId: row.property_id,
          type: row.transaction_type,
          quantity: row.quantity,
          notes: row.notes,
        });
      }
      await reloadDashboardData();
    } catch (error) {
      console.error("Failed to deduct recipe stock:", error);
      alert(error instanceof Error ? error.message : "Unable to deduct recipe stock.");
    }
  };

  const handleRaiseRequest = async (ingredientId: number) => {
    if (!loggedInUser || !selectedPropertyId) return alert("Select a property first");

    const ingredient = ingredients.find((item) => item.id === ingredientId);
    if (!ingredient) return alert("Unable to raise request.");

    const isStoreKeeper = loggedInUser.role === "Store Keeper";

    try {
      await createPurchaseRequest({
        ingredientId: ingredient.id,
        propertyId: selectedPropertyId,
        requestedQty: (ingredient.par ?? 0) * 2,
        status: isStoreKeeper ? "pending_manager_approval" : "chef_requested",
        requestedBy: loggedInUser.name,
        requestSource: isStoreKeeper ? "store_room" : "chef",
        createdByRole: isStoreKeeper ? "Store Keeper" : "Chef",
        notes: isStoreKeeper
          ? "Store room request raised to manager"
          : "Chef requested ingredient from store room",
      });
      await reloadDashboardData();
      alert(isStoreKeeper ? "Store room request raised to manager." : "Chef request raised to store room.");
    } catch (error) {
      console.error("Failed to raise request:", error);
      alert(isStoreKeeper ? "Unable to raise store room request." : "Unable to raise chef request.");
    }
  };

  const handleIssueChefRequest = async (requestId: number, ingredientId: number, requestedQty: number) => {
    if (!loggedInUser || !selectedPropertyId) return alert("Select a property first");

    const currentStock = stock.stockRows.find((row) => row.ingredient.id === ingredientId)?.stock ?? 0;
    if (currentStock < requestedQty) {
      alert("Insufficient stock in storeroom. Forward request to manager.");
      return;
    }

    try {
      await issueChefRequest(requestId, ingredientId, selectedPropertyId, requestedQty);
      await reloadDashboardData();
    } catch (error) {
      console.error("Failed to issue chef request:", error);
      alert("Unable to issue request from storeroom.");
    }
  };

  const handleForwardRequestToManager = async (requestId: number) => {
    try {
      await forwardRequestToManager(requestId);
      await reloadDashboardData();
      alert("Store Room request forwarded to Manager.");
    } catch (error) {
      console.error("Failed to forward request to manager:", error);
      alert("Unable to forward request to manager.");
    }
  };

  const handleIssueReceivedRequest = async (requestId: number, ingredientId: number, requestedQty: number) => {
    if (!loggedInUser || !selectedPropertyId) return alert("Select a property first");

    try {
      await issueReceivedRequest(requestId, ingredientId, selectedPropertyId, requestedQty);
      await reloadDashboardData();
    } catch (error) {
      console.error("Failed to receive delivery:", error);
      alert("Unable to receive delivery.");
    }
  };

  const handleApproveRequest = async (requestId: number) => {
    try {
      await approvePurchaseRequest(requestId);
      await reloadDashboardData();
      alert("Request approved and forwarded to Purchase Manager.");
    } catch (error) {
      console.error("Failed to approve request:", error);
      alert("Unable to approve request.");
    }
  };

  const handleConvertToVendorOrder = async (requestId: number) => {
    try {
      await convertRequestToVendorOrder(requestId);
      await reloadDashboardData();
    } catch (error) {
      console.error("Failed to convert to vendor order:", error);
      alert("Unable to convert to vendor order.");
    }
  };

  if (!loggedInUser) {
    return <LoginPage users={users} properties={loginProperties} onLogin={handleLogin} />;
  }

  const canChangeProperty = loggedInUser.role === "Manager" || loggedInUser.role === "Purchase Manager";
  const isStoreKeeper = loggedInUser.role === "Store Keeper";
  const isChef = loggedInUser.role === "Chef";
  const isManager = loggedInUser.role === "Manager";
  const isPurchaseManager = loggedInUser.role === "Purchase Manager";

  const chefRequests = stock.propertyRequests.filter(
    (request) =>
      request.status === "chef_requested" &&
      request.requestSource === "chef" &&
      request.propertyId === selectedPropertyId,
  );
  const chefOwnRequests = stock.propertyRequests.filter(
    (request) =>
      request.status === "chef_requested" &&
      request.requestSource === "chef" &&
      request.requestedBy === loggedInUser.name &&
      request.propertyId === selectedPropertyId,
  );
  const managerPendingRequests = stock.propertyRequests.filter(
    (request) => request.status === "pending_manager_approval" && request.requestSource === "store_room",
  );
  const purchaseManagerRequests = stock.propertyRequests.filter(
    (request) => request.status === "approved_by_manager" && request.requestSource === "store_room",
  );
  const storeOrderedRequests = stock.propertyRequests.filter(
    (request) => request.status === "ordered_by_purchase_manager" && request.propertyId === selectedPropertyId,
  );

  return (
    <DashboardLayout
      loggedInUser={loggedInUser}
      property={property}
      properties={properties}
      canChangeProperty={canChangeProperty}
      onPropertyChange={(nextProperty) => void handlePropertyChange(nextProperty)}
      onLogout={handleLogout}
      loading={loading}
      metrics={stock.metrics}
    >
      {isStoreKeeper ? (
        <StoreKeeperView
          currentIngredients={stock.currentIngredients}
          stockRows={stock.stockRows}
          ledgerEntries={stock.ledgerEntries}
          chefRequests={chefRequests}
          orderedRequests={storeOrderedRequests}
          emptyMessage={stock.emptyMessage}
          onIssueMovement={(form) => void handleAddTransaction(form)}
          onReceiveOrderedRequest={(requestId) => void handleReceiveOrderedRequest(requestId)}
          onIssueChefRequest={(requestId, ingredientId, qty) => void handleIssueChefRequest(requestId, ingredientId, qty)}
          onForwardRequestToManager={(requestId) => void handleForwardRequestToManager(requestId)}
          onRaiseRequest={handleRaiseRequest}
        />
      ) : null}

      {isChef ? (
        <ChefView
          currentIngredients={stock.currentIngredients}
          stockRows={stock.stockRows}
          availableRecipes={stock.availableRecipes}
          recentConsumptionEntries={stock.recentConsumptionEntries}
          chefRequests={chefOwnRequests}
          emptyMessage={stock.emptyMessage}
          onRaiseRequest={handleRaiseRequest}
          onMarkDishPrepared={handleMarkDishPrepared}
        />
      ) : null}

      {isManager ? (
        <ManagerView
          summary={stock.summary}
          requests={managerPendingRequests}
          properties={properties}
          onApproveRequest={handleApproveRequest}
          onCreateChef={async (name, role, subRole, password, propertyId) => {
            try {
              const ingredientNames = role === "Chef" && subRole === "Saucier Chef"
                ? ["Tomato Puree", "Butter", "Fresh Cream", "Garlic", "Ginger", "Cooking Oil", "Black Pepper", "Mixed Herbs"]
                : ["Fish Fillet", "Prawns", "Seafood Stock", "Lemon", "Garlic", "Butter", "Parsley", "Black Pepper"];

              await createUser({
                name,
                role,
                subRole,
                password,
                propertyId,
                ingredientNames,
              });

              const updatedUsers = await refreshUsers();
              console.log("all users after create", updatedUsers);
              await reloadDashboardData();
              alert(`Chef ${name} created successfully.`);
            } catch (error) {
              console.error("Failed to create chef:", error);
              alert("Unable to create chef.");
            }
          }}
        />
      ) : null}

      {isPurchaseManager ? (
        <PurchaseManagerView requests={purchaseManagerRequests} onConvertToVendorOrder={handleConvertToVendorOrder} />
      ) : null}
    </DashboardLayout>
  );
}
