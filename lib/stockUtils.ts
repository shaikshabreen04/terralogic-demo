import type {
  DashboardMetrics,
  DishRecord,
  Ingredient,
  IngredientRecord,
  LoggedInUser,
  PropertyRecord,
  RecipeDefinition,
  RecipeRecord,
  RequestItem,
  RoleIngredient,
  Transaction,
  TransactionLedgerEntry,
  TransactionType,
} from "../types";

const roundToTwo = (value: number): number => Math.round(value * 100) / 100;

const trimDecimals = (value: number): string => {
  if (Number.isNaN(value) || value === 0) return `${value}`;
  const fixed = value.toFixed(2);
  return fixed.replace(/\.00$/, "").replace(/(\.\d[1-9])0$/, "$1");
};

export const formatQuantity = (value: number | string, unit = ""): string => {
  const normalized = Number(value);
  if (Number.isNaN(normalized)) return `0${unit ? ` ${unit}` : ""}`;
  const rounded = roundToTwo(normalized);
  const display = Number.isInteger(rounded) ? `${rounded}` : trimDecimals(rounded);
  return `${display}${unit ? ` ${unit}` : ""}`;
};

export const formatCurrency = (value: number | string): string => {
  const normalized = Number(value);
  if (Number.isNaN(normalized)) return "₹0";
  const rounded = roundToTwo(normalized);
  const display = Number.isInteger(rounded) ? `${rounded}` : rounded.toFixed(2).replace(/\.00$/, "");
  return `₹${display}`;
};

export const getStock = (transactions: Transaction[], ingredientId: number, propertyId: number | null): number =>
  transactions
    .filter((transaction) => transaction.ingredientId === ingredientId && transaction.propertyId === propertyId)
    .reduce((total, transaction) => {
      if (transaction.type === "receive" || transaction.type === "adjust_add") return total + Number(transaction.qty);
      if (["issue", "consume", "waste", "adjust_remove"].includes(transaction.type)) return total - Number(transaction.qty);
      return total;
    }, 0);

export const calculateStoreroomStock = (
  ingredientId: number,
  propertyId: number | null,
  transactions: Transaction[],
): number =>
  transactions
    .filter((transaction) => transaction.ingredientId === ingredientId && transaction.propertyId === propertyId)
    .reduce((total, transaction) => {
      if (transaction.type === "receive" || transaction.type === "adjust_add") return total + Number(transaction.qty);
      if (transaction.type === "issue" || transaction.type === "waste" || transaction.type === "adjust_remove") return total - Number(transaction.qty);
      return total;
    }, 0);

export const calculateKitchenStock = (
  ingredientId: number,
  propertyId: number | null,
  transactions: Transaction[],
): number =>
  transactions
    .filter((transaction) => transaction.ingredientId === ingredientId && transaction.propertyId === propertyId)
    .reduce((total, transaction) => {
      if (transaction.type === "issue") return total + Number(transaction.qty);
      if (transaction.type === "consume") return total - Number(transaction.qty);
      return total;
    }, 0);

export const getAccessibleIngredients = (
  loggedInUser: LoggedInUser | null,
  selectedPropertyId: number | null,
  ingredients: Ingredient[],
  roleIngredients: RoleIngredient[],
) : Ingredient[] => {
  if (!loggedInUser || !selectedPropertyId) return [] as Ingredient[];

  const propertyFilteredIngredients = ingredients.filter((ingredient) => ingredient.property_id === selectedPropertyId);

  if (loggedInUser.role === "Purchase Manager") {
    return ingredients;
  }

  if (loggedInUser.role === "Chef") {

    const assignedRoleIngredients = roleIngredients.filter(
      (roleIngredient) =>
        roleIngredient.role === loggedInUser.role &&
        roleIngredient.sub_role === loggedInUser.sub_role &&
        roleIngredient.property_id === selectedPropertyId,
    );

    const allowedIngredientIds = assignedRoleIngredients.map((roleIngredient) => roleIngredient.ingredient_id);
    return propertyFilteredIngredients.filter((ingredient) => allowedIngredientIds.includes(ingredient.id));
  }

  return propertyFilteredIngredients;
};

export const getRecentConsumptionRows = (
  transactions: Transaction[],
  ingredients: Ingredient[],
  selectedPropertyId: number | null,
  visibleIngredients: Ingredient[],
  loggedInUser: LoggedInUser | null,
) => {
  const visibleIngredientIds = new Set(visibleIngredients.map((ingredient) => ingredient.id));
  const filtered = transactions.filter((transaction) => {
    return (
      transaction.type === "consume" &&
      transaction.propertyId === selectedPropertyId &&
      visibleIngredientIds.has(transaction.ingredientId)
    );
  });
  return getTransactionRows(filtered, ingredients, selectedPropertyId).slice(0, 5);
};

export const getAvailableRecipes = (
  dishes: DishRecord[],
  recipes: RecipeRecord[],
  visibleIngredients: Ingredient[],
): RecipeDefinition[] => {
  const visibleIngredientIds = new Set(visibleIngredients.map((ingredient) => ingredient.id));

  return dishes
    .map((dish) => {
      const dishRecipes = recipes.filter((recipe) => recipe.dish_id === dish.id);
      if (!dishRecipes.length) return null;

      const hasAllIngredients = dishRecipes.every((recipeItem) => visibleIngredientIds.has(recipeItem.ingredient_id));
      if (!hasAllIngredients) return null;

      return {
        name: dish.dish_name,
        ingredients: dishRecipes.map((recipeItem) => {
          const ingredient = visibleIngredients.find((item) => item.id === recipeItem.ingredient_id);
          return {
            id: recipeItem.ingredient_id,
            name: ingredient?.name ?? `Ingredient ${recipeItem.ingredient_id}`,
            qty: Number(recipeItem.quantity_required ?? 0),
            unit: ingredient?.unit ?? "",
          };
        }),
      } satisfies RecipeDefinition;
    })
    .filter((recipe): recipe is RecipeDefinition => recipe !== null);
};

export const getRequestBadgeStyle = (status: string) => {
  const normalized = String(status).toLowerCase();
  if (normalized === "chef_requested") {
    return { background: "rgba(245, 158, 11, 0.12)", color: "#f59e0b" };
  }
  if (normalized === "issued_by_store" || normalized === "issued_to_kitchen") {
    return { background: "rgba(16, 185, 129, 0.12)", color: "#10b981" };
  }
  if (normalized === "pending_manager_approval" || normalized === "approved_by_manager") {
    return { background: "rgba(37, 99, 235, 0.12)", color: "#2563eb" };
  }
  if (normalized === "ordered_by_purchase_manager") {
    return { background: "rgba(14, 165, 233, 0.12)", color: "#0284c7" };
  }
  if (normalized === "received_by_store") {
    return { background: "rgba(16, 185, 129, 0.12)", color: "#10b981" };
  }
  if (normalized === "store_shortage" || normalized === "forwarded_to_manager") {
    return { background: "rgba(239, 68, 68, 0.12)", color: "#ef4444" };
  }
  return { background: "rgba(245, 158, 11, 0.16)", color: "#f59e0b" };
};

export const getRequestStatusLabel = (status: string) => {
  switch (String(status).toLowerCase()) {
    case "chef_requested":
      return "Requested to Store Room";
    case "issued_by_store":
      return "Issued by Store Room";
    case "pending_manager_approval":
      return "Forwarded to Manager";
    case "approved_by_manager":
      return "Forwarded to Manager";
    case "ordered_by_purchase_manager":
      return "Ordered";
    case "received_by_store":
      return "Received by Store";
    case "issued_to_kitchen":
      return "Issued to Kitchen";
    default:
      return String(status);
  }
};

export const getTransactionIcon = (type: TransactionType) => {
  if (type === "receive") return "+";
  if (type === "issue") return "−";
  if (type === "consume") return "◌";
  return "!";
};

export const getTransactionTone = (type: TransactionType) => {
  if (type === "receive") return { background: "rgba(16, 185, 129, 0.14)", color: "#10b981" };
  if (type === "issue") return { background: "rgba(239, 68, 68, 0.14)", color: "#ef4444" };
  if (type === "consume") return { background: "rgba(245, 158, 11, 0.16)", color: "#f59e0b" };
  return { background: "rgba(30, 58, 138, 0.12)", color: "#1e3a8a" };
};

export const getTransactionLabel = (type: TransactionType) => {
  if (type === "receive") return "Stock Received into Storeroom";
  if (type === "issue") return "Issued to Kitchen";
  if (type === "consume") return "Kitchen Consumed in Recipe";
  if (type === "waste") return "Marked as Waste";
  return "Adjusted Inventory";
};

export const calculateDashboardMetrics = (
  currentIngredients: Ingredient[],
  transactions: Transaction[],
  selectedPropertyId: number | null,
  propertyRequests: RequestItem[],
  ingredients: Ingredient[],
  loggedInUser: LoggedInUser | null,
) : DashboardMetrics => {
  const lowStockItems = currentIngredients.filter((ingredient) => {
    const isChef = loggedInUser?.role === "Chef";
    const stock = isChef
      ? calculateKitchenStock(ingredient.id, selectedPropertyId, transactions)
      : calculateStoreroomStock(ingredient.id, selectedPropertyId, transactions);
    const parLevel = isChef ? 0 : (ingredient.par ?? 0);
    return isChef ? stock <= parLevel : stock < parLevel;
  }).length;
  const normalizedRequests = propertyRequests.map((request) => ({ ...request, status: String(request.status).toLowerCase() }));

  const openRequests = normalizedRequests.filter((request) => {
    if (loggedInUser?.role === "Manager") {
      return request.status === "pending_manager_approval" && request.requestSource === "store_room";
    }
    if (loggedInUser?.role === "Purchase Manager") {
      return request.status === "approved_by_manager" && request.requestSource === "store_room";
    }
    if (loggedInUser?.role === "Store Keeper") {
      return request.status === "chef_requested" && request.requestSource === "chef";
    }
    if (loggedInUser?.role === "Chef") {
      return (
        request.status === "chef_requested" &&
        request.requestSource === "chef" &&
        request.requestedBy === loggedInUser.name
      );
    }

    return ["chef_requested", "pending_manager_approval", "approved_by_manager", "ordered_by_purchase_manager"].includes(request.status);
  }).length;

  const pendingRequests = normalizedRequests.filter(
    (request) => request.status === "pending_manager_approval" && request.requestSource === "store_room",
  ).length;
  const approvedRequests = normalizedRequests.filter(
    (request) => request.status === "approved_by_manager" && request.requestSource === "store_room",
  ).length;

  const propertyTransactions = transactions.filter((transaction) => transaction.propertyId === selectedPropertyId);

  const foodCost = propertyTransactions
    .filter((transaction) => transaction.type === "receive")
    .reduce((sum, transaction) => {
      const ingredient = ingredients.find((item) => item.id === transaction.ingredientId);
      return sum + transaction.qty * (ingredient?.price || 0);
    }, 0);

  const theoreticalConsumptionCost = propertyTransactions
    .filter((transaction) => transaction.type === "consume")
    .reduce((sum, transaction) => {
      const ingredient = ingredients.find((item) => item.id === transaction.ingredientId);
      return sum + transaction.qty * (ingredient?.price || 0);
    }, 0);

  const actualConsumptionCost = propertyTransactions
    .filter((transaction) => transaction.type === "issue")
    .reduce((sum, transaction) => {
      const ingredient = ingredients.find((item) => item.id === transaction.ingredientId);
      return sum + transaction.qty * (ingredient?.price || 0);
    }, 0);

  const wastageCost = propertyTransactions
    .filter((transaction) => transaction.type === "waste")
    .reduce((sum, transaction) => {
      const ingredient = ingredients.find((item) => item.id === transaction.ingredientId);
      return sum + transaction.qty * (ingredient?.price || 0);
    }, 0);

  const variance = actualConsumptionCost - theoreticalConsumptionCost;

  return {
    lowStockItems,
    openRequests,
    pendingRequests,
    foodCost: roundToTwo(foodCost),
    approvedRequests,
    theoreticalConsumptionCost: roundToTwo(theoreticalConsumptionCost),
    actualConsumptionCost: roundToTwo(actualConsumptionCost),
    wastageCost: roundToTwo(wastageCost),
    variance: roundToTwo(variance),
  };
};

export const resolvePropertySelection = (
  properties: PropertyRecord[],
  currentProperty: string,
  loggedInUser: LoggedInUser | null,
) => {
  if (!properties.length) {
    return { property: "", selectedPropertyId: null as number | null };
  }

  const assignedProperty = loggedInUser ? properties.find((property) => property.id === loggedInUser.property_id) : null;
  const isLockedRole = loggedInUser?.role === "Store Keeper" || loggedInUser?.role === "Chef";

  if (isLockedRole && assignedProperty) {
    return { property: assignedProperty.property_name, selectedPropertyId: assignedProperty.id };
  }

  if (!currentProperty || !properties.some((property) => property.property_name === currentProperty)) {
    return { property: properties[0].property_name, selectedPropertyId: properties[0].id };
  }

  const matchedProperty = properties.find((property) => property.property_name === currentProperty);
  return { property: matchedProperty?.property_name ?? properties[0].property_name, selectedPropertyId: matchedProperty?.id ?? properties[0].id };
};

export const mapTransactions = (rows: Array<Record<string, unknown>>, propertyMap: Map<number, string>): Transaction[] =>
  rows.map((row) => {
    const rawType = String(row.transaction_type ?? "");
    let type: TransactionType = "receive";
    const s = rawType.toLowerCase().trim();
    if (s === "receive" || s === "stock received into storeroom") {
      type = "receive";
    } else if (s === "issue" || s === "issued to kitchen") {
      type = "issue";
    } else if (s === "consume" || s === "kitchen consumed in recipe") {
      type = "consume";
    } else if (s === "waste" || s === "marked as waste") {
      type = "waste";
    } else if (s === "adjust_add") {
      type = "adjust_add";
    } else if (s === "adjust_remove") {
      type = "adjust_remove";
    } else {
      type = rawType as TransactionType;
    }
    return {
      id: Number(row.id),
      ingredientId: Number(row.ingredient_id),
      type,
      qty: Number(row.quantity ?? 0),
      property: propertyMap.get(Number(row.property_id)) ?? "",
      propertyId: Number(row.property_id),
      notes: String(row.notes ?? ""),
    };
  });

export const mapRequests = (
  rows: Array<Record<string, unknown>>,
  propertyMap: Map<number, string>,
  ingredients: Ingredient[],
): RequestItem[] =>
  rows.map((row) => {
    const ingredient = ingredients.find((item) => item.id === Number(row.ingredient_id));
    return {
      id: Number(row.id),
      ingredientId: Number(row.ingredient_id),
      name: ingredient?.name ?? "Unknown",
      property: propertyMap.get(Number(row.property_id)) ?? "",
      propertyId: Number(row.property_id),
      qty: Number(row.requested_qty ?? 0),
      status: String(row.status ?? "chef_requested"),
      requestedBy: String(row.requested_by ?? "Chef"),
      requestSource: String(row.request_source ?? ""),
      createdByRole: String(row.created_by_role ?? ""),
      notes: String(row.notes ?? ""),
    };
  });

export const mapIngredients = (rows: IngredientRecord[], propertyMap: Map<number, string>): Ingredient[] =>
  rows.map((item) => ({
    id: item.id,
    name: item.name,
    unit: item.unit,
    par: Number(item.par_level ?? item.par ?? 0),
    price: item.price,
    property_id: item.property_id,
    property: propertyMap.get(item.property_id) ?? "",
  })) as Ingredient[];

export const getTransactionRows = (transactions: Transaction[], ingredients: Ingredient[], selectedPropertyId: number | null) =>
  transactions
    .filter((transaction) => transaction.propertyId === selectedPropertyId)
    .map((transaction) => {
      const ingredient = ingredients.find((item) => item.id === transaction.ingredientId);
      return {
        id: transaction.id,
        ingredientName: ingredient?.name ?? "Unknown",
        qty: transaction.qty,
        unit: ingredient?.unit ?? "",
        property: transaction.property,
        type: transaction.type,
        notes: transaction.notes,
      } satisfies TransactionLedgerEntry;
    });
