import { supabase } from "../lib/supabase";
import type {
  DishRecord,
  IngredientRecord,
  LoggedInUser,
  PropertyRecord,
  RecipeRecord,
  RoleIngredient,
  TransactionType,
  UserRecord,
} from "../types";

export type DashboardSourceData = {
  properties: PropertyRecord[];
  ingredients: IngredientRecord[];
  transactions: Array<Record<string, unknown>>;
  requests: Array<Record<string, unknown>>;
  dishes: DishRecord[];
  recipes: RecipeRecord[];
};

export type StockTransactionInput = {
  ingredientId: number;
  propertyId: number;
  type: TransactionType;
  quantity: number;
  notes: string;
};

export type PurchaseRequestInput = {
  ingredientId: number;
  propertyId: number;
  requestedQty: number;
  status: string;
  requestedBy: string;
  requestSource: string;
  createdByRole: string;
  notes: string;
};

export type CreateUserInput = {
  name: string;
  role: string;
  subRole: string;
  password: string;
  propertyId: number;
  ingredientNames: string[];
};

const throwIfError = (error: { message?: string } | null | undefined) => {
  if (error) {
    throw error;
  }
};

export const fetchUsers = async (): Promise<UserRecord[]> => {
  const { data, error } = await supabase.from("users").select("*");
  throwIfError(error);
  return (data ?? []) as UserRecord[];
};

export const fetchProperties = async (): Promise<PropertyRecord[]> => {
  const { data, error } = await supabase.from("properties").select("*").order("property_name");
  throwIfError(error);
  return (data ?? []) as PropertyRecord[];
};

export const fetchDashboardData = async (): Promise<DashboardSourceData> => {
  const [propertiesResult, ingredientsResult, transactionsResult, requestsResult, dishesResult, recipesResult] = await Promise.all([
    supabase.from("properties").select("*").order("property_name"),
    supabase.from("ingredients").select("*").order("name"),
    supabase.from("stock_transactions").select("*").order("id", { ascending: false }),
    supabase.from("purchase_requests").select("*").order("id", { ascending: false }),
    supabase.from("dishes").select("*").order("dish_name"),
    supabase.from("recipes").select("*").order("dish_id"),
  ]);

  throwIfError(propertiesResult.error);
  throwIfError(ingredientsResult.error);
  throwIfError(transactionsResult.error);
  throwIfError(requestsResult.error);
  throwIfError(dishesResult.error);
  throwIfError(recipesResult.error);

  return {
    properties: (propertiesResult.data ?? []) as PropertyRecord[],
    ingredients: (ingredientsResult.data ?? []) as IngredientRecord[],
    transactions: (transactionsResult.data ?? []) as Array<Record<string, unknown>>,
    requests: (requestsResult.data ?? []) as Array<Record<string, unknown>>,
    dishes: (dishesResult.data ?? []) as DishRecord[],
    recipes: (recipesResult.data ?? []) as RecipeRecord[],
  };
};

export const fetchRoleIngredients = async (user: LoggedInUser | null, propertyId: number | null) => {
  if (!user || !propertyId) {
    return [] as RoleIngredient[];
  }

  const { data, error } = await supabase
    .from("role_ingredients")
    .select("*")
    .eq("role", user.role)
    .eq("sub_role", user.sub_role)
    .eq("property_id", propertyId);

  throwIfError(error);
  return (data ?? []) as RoleIngredient[];
};

export const createStockTransaction = async (input: StockTransactionInput) => {
  const { error } = await supabase.from("stock_transactions").insert([
    {
      ingredient_id: input.ingredientId,
      property_id: input.propertyId,
      transaction_type: input.type,
      quantity: input.quantity,
      notes: input.notes,
    },
  ]);

  throwIfError(error);
};

export const createPurchaseRequest = async (input: PurchaseRequestInput) => {
  const { error } = await supabase.from("purchase_requests").insert([
    {
      ingredient_id: input.ingredientId,
      property_id: input.propertyId,
      requested_qty: input.requestedQty,
      status: input.status,
      requested_by: input.requestedBy,
      request_source: input.requestSource,
      created_by_role: input.createdByRole,
      notes: input.notes,
    },
  ]);

  throwIfError(error);
};

export const createUser = async (input: CreateUserInput) => {
  const { data: userData, error: userError } = await supabase
    .from("users")
    .insert([
      {
        name: input.name,
        role: input.role,
        sub_role: input.subRole,
        password: input.password,
        property_id: input.propertyId,
      },
    ])
    .select("*")
    .single();

  throwIfError(userError);

  const user = userData as UserRecord;
  const uniqueIngredientNames = Array.from(new Set(input.ingredientNames));

  if (uniqueIngredientNames.length === 0) {
    return user;
  }

  const { data: ingredientsData, error: ingredientError } = await supabase
    .from("ingredients")
    .select("id")
    .in("name", uniqueIngredientNames)
    .eq("property_id", input.propertyId);

  throwIfError(ingredientError);

  const ingredientIds = Array.from(
    new Set((ingredientsData ?? []).map((item) => Number((item as { id: unknown }).id)).filter((id) => !Number.isNaN(id))),
  );

  if (ingredientIds.length === 0) {
    return user;
  }

  const { data: existingRoleIngredients, error: existingError } = await supabase
    .from("role_ingredients")
    .select("ingredient_id")
    .in("ingredient_id", ingredientIds)
    .eq("role", input.role)
    .eq("sub_role", input.subRole)
    .eq("property_id", input.propertyId);

  throwIfError(existingError);

  const existingIds = new Set((existingRoleIngredients ?? []).map((item) => Number((item as { ingredient_id: unknown }).ingredient_id)));
  const newRoleIngredientIds = ingredientIds.filter((id) => !existingIds.has(id));

  if (newRoleIngredientIds.length > 0) {
    const { error: roleIngredientError } = await supabase.from("role_ingredients").insert(
      newRoleIngredientIds.map((ingredientId) => ({
        role: input.role,
        sub_role: input.subRole,
        ingredient_id: ingredientId,
        property_id: input.propertyId,
      })),
    );

    throwIfError(roleIngredientError);
  }

  return user;
};

export const approvePurchaseRequest = async (requestId: number) => {
  const { error } = await supabase.from("purchase_requests").update({ status: "approved_by_manager", approved_by: "Manager" }).eq("id", requestId);
  throwIfError(error);
};

export const convertRequestToVendorOrder = async (requestId: number) => {
  const { error } = await supabase.from("purchase_requests").update({ status: "ordered_by_purchase_manager" }).eq("id", requestId);
  throwIfError(error);
};

export const receivePurchaseRequest = async (requestId: number, ingredientId: number, propertyId: number, quantity: number) => {
  const [transactionResult, requestResult] = await Promise.all([
    supabase.from("stock_transactions").insert([
      {
        ingredient_id: ingredientId,
        property_id: propertyId,
        transaction_type: "receive",
        quantity,
        notes: `Received into storeroom against purchase request #${requestId}`,
      },
    ]),
    supabase.from("purchase_requests").update({ status: "received_by_store" }).eq("id", requestId),
  ]);

  throwIfError(transactionResult.error);
  throwIfError(requestResult.error);
};

export const issueChefRequest = async (requestId: number, ingredientId: number, propertyId: number, quantity: number) => {
  const [transactionResult, requestResult] = await Promise.all([
    supabase.from("stock_transactions").insert([
      {
        ingredient_id: ingredientId,
        property_id: propertyId,
        transaction_type: "issue",
        quantity,
        notes: `Issued to kitchen for chef request #${requestId}`,
      },
    ]),
    supabase.from("purchase_requests").update({
      status: "issued_by_store",
      request_source: "store_room",
      created_by_role: "Store Keeper",
    }).eq("id", requestId),
  ]);

  throwIfError(transactionResult.error);
  throwIfError(requestResult.error);
};

export const forwardRequestToManager = async (requestId: number) => {
  const { error } = await supabase
    .from("purchase_requests")
    .update({
      status: "pending_manager_approval",
      request_source: "store_room",
      created_by_role: "Store Keeper",
      notes: "Store room forwarded shortage to manager",
    })
    .eq("id", requestId);
  throwIfError(error);
};

export const issueReceivedRequest = async (requestId: number, ingredientId: number, propertyId: number, quantity: number) => {
  const [transactionResult, requestResult] = await Promise.all([
    supabase.from("stock_transactions").insert([
      {
        ingredient_id: ingredientId,
        property_id: propertyId,
        transaction_type: "issue",
        quantity,
        notes: `Issued to kitchen after purchase request #${requestId}`,
      },
    ]),
    supabase.from("purchase_requests").update({ status: "issued_to_kitchen" }).eq("id", requestId),
  ]);

  throwIfError(transactionResult.error);
  throwIfError(requestResult.error);
};
